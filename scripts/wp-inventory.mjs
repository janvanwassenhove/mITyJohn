// Phase 1 — content inventory (MIGRATION_BRIEF.md §6 Phase 1)
// Pure extraction, no modelling. Produces:
//   - content-inventory.json          (root; the deliverable)
//   - content-inventory/*.xml         (sitemap capture, verbatim)
//   - public/wp-content/uploads/**    (complete mirror incl. every srcset derivative, F4)
//
// Run: node scripts/wp-inventory.mjs

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const SITE = 'https://mityjohn.com';
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const UPLOADS_DIR = path.join(ROOT, 'public', 'wp-content', 'uploads');
const CAPTURE_DIR = path.join(ROOT, 'content-inventory');

const UA = 'mityjohn-migration-inventory/1.0 (Phase 1; contact: vanwassenhove.jan@gmail.com)';

async function get(url, as = 'json', tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { res, body: as === 'json' ? await res.json() : await res.text() };
    } catch (e) {
      if (i === tries) throw new Error(`${url} -> ${e.message}`);
      await new Promise(r => setTimeout(r, 500 * i));
    }
  }
}

// Paginate a REST collection using the query-string route form (§6 Phase 1.1).
async function fetchAll(route) {
  const out = [];
  let page = 1, totalPages = 1;
  do {
    const url = `${SITE}/?rest_route=/wp/v2/${route}&per_page=100&page=${page}`;
    const { res, body } = await get(url);
    totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10) || 1;
    out.push(...body);
    console.log(`  ${route} page ${page}/${totalPages}: +${body.length}`);
    page++;
  } while (page <= totalPages);
  return out;
}

const strip = (o) => { const { _links, ...rest } = o; return rest; };

// ---- upload URL harvesting -------------------------------------------------
const UPLOAD_RE = /https?:\/\/(?:www\.)?mityjohn\.com\/wp-content\/uploads\/[^\s"'<>()\\]+/g;

function harvestFromHtml(html, set) {
  if (!html) return;
  for (const m of html.matchAll(UPLOAD_RE)) set.add(normalizeUploadUrl(m[0]));
  // srcset attributes may contain relative-protocol or already matched absolute URLs;
  // the regex above catches each candidate URL inside srcset lists individually.
}

function normalizeUploadUrl(u) {
  return u.replace(/^http:\/\//, 'https://').replace('://www.', '://').replace(/[),.;]+$/, '');
}

function uploadRelPath(u) {
  const p = new URL(u).pathname; // /wp-content/uploads/2024/05/x.png
  return decodeURIComponent(p.replace(/^\/wp-content\/uploads\//, ''));
}

async function downloadAll(urls) {
  const failed = [];
  let done = 0;
  const queue = [...urls];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const rel = uploadRelPath(url);
      const dest = path.join(UPLOADS_DIR, rel);
      try {
        await mkdir(path.dirname(dest), { recursive: true });
        const existing = await stat(dest).catch(() => null);
        if (existing && existing.size > 0) { done++; continue; }
        const res = await fetch(url, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
        done++;
        if (done % 50 === 0) console.log(`  downloaded ${done}/${urls.size}`);
      } catch (e) {
        failed.push({ url, error: String(e.message || e) });
      }
    }
  });
  await Promise.all(workers);
  return { done, failed };
}

// ---- sitemap capture ---------------------------------------------------------
async function captureSitemaps() {
  const candidates = [
    `${SITE}/sitemap.xml`,
    `${SITE}/sitemap_index.xml`,
    `${SITE}/wp-sitemap.xml`,
    `${SITE}/?sitemap=index`,
  ];
  // robots.txt may declare the real one
  try {
    const { body } = await get(`${SITE}/robots.txt`, 'text');
    await writeFile(path.join(CAPTURE_DIR, 'robots.txt'), body);
    for (const line of body.split('\n')) {
      const m = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (m) candidates.unshift(m[1]);
    }
  } catch { /* no robots.txt */ }

  const captured = []; // {url, file, locs[]}
  const seen = new Set();
  const fetchSitemap = async (url) => {
    if (seen.has(url)) return;
    seen.add(url);
    let body;
    try {
      ({ body } = await get(url, 'text'));
    } catch { return; }
    if (!/<(urlset|sitemapindex)/i.test(body)) return;
    const file = `sitemap-${captured.length}.xml`;
    await writeFile(path.join(CAPTURE_DIR, file), body);
    const locs = [...body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
      .map(m => m[1].trim().replace(/&amp;/g, '&').replace(/&#0?38;/g, '&'));
    captured.push({ url, file, isIndex: /<sitemapindex/i.test(body), locs });
    if (/<sitemapindex/i.test(body)) for (const loc of locs) await fetchSitemap(loc);
  };
  for (const c of candidates) await fetchSitemap(c);
  return captured;
}

// ---- reconciliation ----------------------------------------------------------
function reconcile(sitemapUrls, posts, pages, tags, categories) {
  const postIds = new Set(posts.map(p => String(p.id)));
  const pageIds = new Set(pages.map(p => String(p.id)));
  const tagSlugs = new Set(tags.map(t => t.slug));
  const catIds = new Set(categories.map(c => String(c.id)));
  const catSlugs = new Set(categories.map(c => c.slug));
  const links = new Set([...posts, ...pages].map(p => normalizeUploadUrl(p.link || '')));

  const results = sitemapUrls.map(raw => {
    const u = raw.replace(/^http:\/\//, 'https://').replace('://www.', '://');
    const url = new URL(u);
    const q = url.searchParams;
    let match = null;
    if (u === SITE + '/' || u === SITE) match = 'home';
    else if (q.get('p') && postIds.has(q.get('p'))) match = `post:${q.get('p')}`;
    else if (q.get('page_id') && pageIds.has(q.get('page_id'))) match = `page:${q.get('page_id')}`;
    else if (q.get('tag') && tagSlugs.has(q.get('tag'))) match = `tag:${q.get('tag')}`;
    else if (q.get('cat') && catIds.has(q.get('cat'))) match = `category:${q.get('cat')}`;
    else if (q.get('category_name') && catSlugs.has(q.get('category_name'))) match = `category:${q.get('category_name')}`;
    else if (links.has(u)) match = 'link-exact';
    return { url: raw, match };
  });
  return {
    total: results.length,
    matched: results.filter(r => r.match).length,
    unmatched: results.filter(r => !r.match).map(r => r.url),
    detail: results,
  };
}

// ---- main --------------------------------------------------------------------
console.log('== Phase 1 extraction ==');
await mkdir(CAPTURE_DIR, { recursive: true });
await mkdir(UPLOADS_DIR, { recursive: true });

console.log('REST export:');
const [posts, pages, tags, categories, media] = [
  await fetchAll('posts'),
  await fetchAll('pages'),
  await fetchAll('tags'),
  await fetchAll('categories'),
  await fetchAll('media'),
];

// F5 — comments: confirm zero rather than assume
let comments = [];
try { comments = await fetchAll('comments'); } catch (e) { console.log('  comments: ' + e.message); }

console.log('Sitemap capture:');
const sitemaps = await captureSitemaps();
const sitemapPageUrls = sitemaps.filter(s => !s.isIndex).flatMap(s => s.locs);
console.log(`  captured ${sitemaps.length} sitemap file(s), ${sitemapPageUrls.length} URLs`);

console.log('Harvesting upload URLs (content + media API, F4):');
const uploadUrls = new Set();
for (const item of [...posts, ...pages]) {
  harvestFromHtml(item.content?.rendered, uploadUrls);
  harvestFromHtml(item.excerpt?.rendered, uploadUrls);
}
for (const m of media) {
  if (m.source_url?.includes('/wp-content/uploads/')) uploadUrls.add(normalizeUploadUrl(m.source_url));
  const sizes = m.media_details?.sizes || {};
  for (const s of Object.values(sizes)) {
    if (s.source_url?.includes('/wp-content/uploads/')) uploadUrls.add(normalizeUploadUrl(s.source_url));
  }
}
console.log(`  ${uploadUrls.size} unique upload URLs`);

console.log('Mirroring uploads:');
const dl = await downloadAll(uploadUrls);
console.log(`  ok: ${dl.done}, failed: ${dl.failed.length}`);

const reconciliation = reconcile(sitemapPageUrls, posts, pages, tags, categories);

const inventory = {
  generatedAt: new Date().toISOString(),
  site: SITE,
  counts: {
    posts: posts.length, pages: pages.length, tags: tags.length,
    categories: categories.length, media: media.length, comments: comments.length,
    uploadUrls: uploadUrls.size, uploadsDownloaded: dl.done, uploadsFailed: dl.failed.length,
    sitemapUrls: sitemapPageUrls.length,
  },
  posts: posts.map(strip),
  pages: pages.map(strip),
  tags: tags.map(strip),
  categories: categories.map(strip),
  media: media.map(strip),
  comments: comments.map(strip),
  sitemaps: sitemaps.map(({ url, file, isIndex, locs }) => ({ url, file, isIndex, urlCount: locs.length })),
  sitemapUrls: sitemapPageUrls,
  uploads: { total: uploadUrls.size, downloaded: dl.done, failed: dl.failed },
  reconciliation,
};

await writeFile(path.join(ROOT, 'content-inventory.json'), JSON.stringify(inventory, null, 2));
console.log('\nWrote content-inventory.json');
console.log(`Reconciliation: ${reconciliation.matched}/${reconciliation.total} sitemap URLs matched; unmatched: ${reconciliation.unmatched.length}`);
if (reconciliation.unmatched.length) console.log(reconciliation.unmatched.slice(0, 20).join('\n'));
