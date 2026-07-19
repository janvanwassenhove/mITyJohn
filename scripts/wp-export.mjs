// Phase 4 — WP HTML → Markdown conversion (MIGRATION_BRIEF.md §6 Phase 4).
// Sources: content-inventory.json (extraction) + content-model.json (targets/slugs)
// + url-map.json (F3 internal link rewriting). Emits src/content/{blog,apps,pages}/*.md.
//
// Run: node scripts/wp-export.mjs

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';
import turndownPluginGfm from 'turndown-plugin-gfm';

const ROOT = new URL('..', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, ROOT), 'utf8'));
const inv = read('content-inventory.json');
const model = read('content-model.json');
const urlMap = read('url-map.json');

// ---------------------------------------------------------------------------
// Lookups
const modelById = new Map(model.map((m) => [`${m.wpType}:${m.wpId}`, m]));
const newUrlByOld = new Map(urlMap.map((e) => [e.old, e.new]));
const tagById = new Map(inv.tags.map((t) => [t.id, t.slug]));
const CATEGORY_TO_TAG = { ai: 'ai', development: 'development', fun: 'fun', hockey: 'hockey', 'low-code': 'lowcode', music: 'music', uncategorized: null };
const catById = new Map(inv.categories.map((c) => [c.id, CATEGORY_TO_TAG[c.slug]]));
const mediaById = new Map(inv.media.map((m) => [m.id, m]));

// Design's per-app metadata (design/handoff is source of truth; gap-list G3 adds mITyGarden)
const APP_META = {
  mitystudio: { name: 'mITyStudio', code: 'STUDIO', tag: 'music', cat: 'music', order: 1, repo: 'mITyStudio', demoUrl: 'https://janvanwassenhove.github.io/mITyStudio', blurb: 'Your vibe-composing DAW. Hum an idea, it does the rest — allegedly.' },
  'music-agent': { name: 'Music Agent', code: 'AGENT', tag: 'music', cat: 'music', order: 2, repo: 'MusicAgent', blurb: 'A multi-agent system that writes electronic songs with Sonic Pi. Bring snacks.' },
  mityguitar: { name: 'mITyGuitar', code: 'GUITAR', tag: 'music', cat: 'music', order: 3, repo: 'mITyGuitar', blurb: 'Turns a game controller into an actual guitar. Your neighbours: thrilled.' },
  pibeat: { name: 'PiBeat', code: 'PIBEAT', tag: 'music', cat: 'music', order: 4, demoUrl: 'https://janvanwassenhove.github.io/PiBeat', repo: 'PiBeat', blurb: 'The ultimate music timeline challenge, running on a Raspberry Pi.' },
  'ghosts-in-the-machine': { name: 'Ghosts in the Machine', code: 'GHOSTS', tag: 'game', cat: 'games', order: 5, demoUrl: 'https://janvanwassenhove.github.io/ghosts', repo: 'ghosts', blurb: 'A haunted IT sim built by inviting a ghost in. It went about as well as you’d expect.' },
  mityfighter: { name: 'mITyFighter', code: 'FIGHT', tag: 'game', cat: 'games', order: 6, demoUrl: 'https://janvanwassenhove.github.io/mITyFighter', repo: 'mITyFighter', blurb: 'A retro fighter where the real boss is legacy code. Flawless victory.' },
  hipster: { name: 'Hipster', code: 'HIPSTER', tag: 'game', cat: 'games', order: 7, demoUrl: 'https://janvanwassenhove.github.io/Hipster', repo: 'Hipster', blurb: 'You probably haven’t played it yet. That’s kind of the point.' },
  loveflix: { name: 'LoveFlix', code: 'LOVE', tag: 'fun', cat: 'fun', order: 8, demoUrl: 'https://janvanwassenhove.github.io/LoveFlix', repo: 'LoveFlix', blurb: 'Where every movie finds its heart. A matchmaker for your watchlist.' },
  sportsmadness: { name: 'Sports Madness', code: 'SPORT', tag: 'fun', cat: 'fun', order: 9, demoUrl: 'https://janvanwassenhove.github.io/SportsMadness', repo: 'SportsMadness', blurb: 'Gamification, creativity & real-time control for literally any sport.' },
  mitystories: { name: 'mITyStories', code: 'STORY', tag: 'fun', cat: 'fun', order: 10, demoUrl: 'https://janvanwassenhove.github.io/mITyStories', blurb: 'Tiny generative stories for when the meeting runs long.' },
  typix: { name: 'Typix', code: 'TYPIX', tag: 'fun', cat: 'fun', order: 11, demoUrl: 'https://janvanwassenhove.github.io/Typix', blurb: 'Type pixels into being. Oddly meditative, mildly pointless.' },
  mitylaundry: { name: 'mITyLaundry', code: 'WASH', tag: 'fun', cat: 'fun', order: 12, demoUrl: 'https://janvanwassenhove.github.io/mITyLaundry', blurb: 'Because someone had to gamify the laundry. Reluctantly, that someone was Jan.' },
  mitylex: { name: 'mITyLex', code: 'LEX', tag: 'fun', cat: 'fun', order: 13, demoUrl: 'https://janvanwassenhove.github.io/mITyLex', blurb: 'A word game with the vocabulary of a very confident intern.' },
  mitygarden: { name: 'mITyGarden', code: 'GARDEN', tag: 'fun', cat: 'fun', order: 14, repo: 'mITyGarden', demoUrl: 'https://janvanwassenhove.github.io/mITyGarden', blurb: 'An AI garden design studio. Move the pool with a prompt, not a shovel.' }, // G3 — not in design's 14
  'scrum-programming': { name: 'Scrum Programming Language', code: 'SPL', tag: 'lab', cat: 'lab', order: 15, repo: 'scrum', blurb: 'A real programming language where you code entirely in ceremonies. Yes, really.' },
};

// ---------------------------------------------------------------------------
// Image downscaling — content referenced full-size originals (multi-MB PNGs) that
// tanked mobile LCP (N5). Where the mirror holds a WP-generated ≤1024 derivative,
// reference that instead. Originals stay untouched at their identical paths (N2).
const uploadsBase = fileURLToPath(new URL('public/wp-content/uploads/', ROOT));
const uploadFiles = new Set(
  readdirSync(uploadsBase, { recursive: true }).map((f) => '/wp-content/uploads/' + String(f).replaceAll('\\', '/')),
);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function pickVariant(src) {
  const m = src.match(/^(\/wp-content\/uploads\/.+)\.(png|jpe?g|webp)$/i);
  if (!m || /-\d+x\d+$/.test(m[1])) return src;
  for (const w of [1024, 768]) {
    const re = new RegExp('^' + escapeRe(m[1]) + '-' + w + 'x\\d+\\.' + m[2] + '$', 'i');
    for (const f of uploadFiles) if (re.test(f)) return f;
  }
  return src;
}

// PNG/JPEG → WebP siblings (multi-MB AI-art PNGs fail the N5 mobile budget even at
// 1024px). Originals keep their identical paths untouched (N2); content references
// the generated .webp alongside. Conversion runs after emit (sharp).
const webpQueue = new Map(); // sourceLocalPath -> webpLocalPath
function downscale(src) {
  const v = pickVariant(src);
  const m = v.match(/^(\/wp-content\/uploads\/.+)\.(png|jpe?g)$/i);
  if (!m) return v;
  const webp = `${m[1]}.webp`;
  webpQueue.set(v, webp);
  return webp;
}

// ---------------------------------------------------------------------------
// HTML pre-processing (before turndown)
function rewriteUrls(html) {
  // Upload URLs → root-relative identical paths (§5.5)
  let out = html.replace(/https?:\/\/(?:www\.)?mityjohn\.com(\/wp-content\/uploads\/[^\s"'<>()\\]+)/g, '$1');
  // F3 — internal query-string links → new URLs (direct, never via a redirect hop)
  out = out.replace(/https?:\/\/(?:www\.)?mityjohn\.com\/(\?[^"'\s<>]+)/g, (full, q) => {
    const key = '/' + q.replace(/&#0?38;|&amp;/g, '&');
    const hit = newUrlByOld.get(key);
    return hit ?? full;
  });
  // Bare site root links
  out = out.replace(/https?:\/\/(?:www\.)?mityjohn\.com\/?(?=["'])/g, '/');
  // Swap full-size image refs for ≤1024 derivatives where the mirror has them
  out = out.replace(/src="(\/wp-content\/uploads\/[^"]+)"/g, (_, u) => `src="${downscale(u)}"`);
  return out;
}

// Known third-party embed hosts -> facade copy. Anything not listed is left as-is.
function embedProvider(src) {
  if (/open\.spotify\.com/.test(src)) return { id: 'spotify', label: 'Play on Spotify', host: 'spotify.com', height: 352 };
  if (/youtube(-nocookie)?\.com|youtu\.be/.test(src)) return { id: 'youtube', label: 'Play on YouTube', host: 'youtube.com', height: 400 };
  if (/soundcloud\.com/.test(src)) return { id: 'soundcloud', label: 'Play on SoundCloud', host: 'soundcloud.com', height: 166 };
  return null;
}

function stripPluginMarkup(html) {
  let out = html;
  // WordPress "Preformatted" blocks hold prose, not code (only wp-block-code has
  // a <code> child). Left as <pre> they render as monospace code with a scrollbar.
  out = out.replace(/<pre class="wp-block-preformatted">([\s\S]*?)<\/pre>/g, '<p>$1</p>');
  // Smart Slider 3 (D3: superseded) — rendered containers and raw shortcodes
  out = out.replace(/<div[^>]*(?:id="n2-ss-|class="[^"]*n2[_-])[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');
  out = out.replace(/\[smartslider3[^\]]*\]/g, '');
  // Instagram feed plugin
  out = out.replace(/<div[^>]*(?:id="sbi_|class="[^"]*sbi[_-])[\s\S]*?<\/div>\s*<\/div>/g, '');
  out = out.replace(/\[instagram-feed[^\]]*\]/g, '');
  // WordPress self-embed iframes (?p=N&embed=true) — dead once WP is gone; the
  // accompanying blockquote link (rewritten by F3) carries the reference.
  out = out.replace(/<iframe[^>]*wp-embedded-content[^>]*><\/iframe>/g, '');
  out = out.replace(/<iframe[^>]*embed=true[^>]*><\/iframe>/g, '');
  // Third-party embeds (Spotify / YouTube / SoundCloud) -> click-to-load facades.
  // Mandated by §8.1 for Spotify and by D5 generally: the site is deliberately
  // cookieless so no consent banner is needed, and an eager embed silently breaks
  // that. Also fixes an observed frame-bust: the eager Spotify iframe navigated
  // the parent page to the site root.
  out = out.replace(/<iframe\b[^>]*\bsrc="([^"]+)"[^>]*><\/iframe>/g, (full, src) => {
    const p = embedProvider(src);
    if (!p) return full; // leave first-party / unknown iframes alone
    const h = (full.match(/height="(\d+)"/) || [])[1] || p.height;
    return `<button type="button" class="embed-facade" data-embed-src="${src}" data-embed-h="${h}" data-embed-provider="${p.id}">`
      + `<span class="ef-glyph">▶</span>`
      + `<span class="ef-title">${p.label}</span>`
      + `<span class="ef-note">Loads ${p.host} — nothing is requested until you click.</span>`
      + `</button>`;
  });
  // Leftover generic shortcodes
  out = out.replace(/\[\/?(?:embed|caption|gallery|et_pb_[a-z_]+)[^\]]*\]/g, '');
  return out;
}

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', hr: '---', bulletListMarker: '-' });
turndownPluginGfm.gfm(td);
// Keep raw: first-party iframes, and the click-to-load facades that replace
// third-party embeds (turndown would otherwise flatten them to their text).
td.keep(['iframe', 'button']);
// WP puts <code> inside <pre>; keep language classes when present
td.addRule('preCode', {
  filter: (node) => node.nodeName === 'PRE',
  replacement: (content, node) => {
    const code = node.querySelector?.('code');
    const cls = (code?.getAttribute?.('class') || node.getAttribute('class') || '');
    const lang = (cls.match(/language-([\w-]+)/) || [])[1] || '';
    const text = (code?.textContent ?? node.textContent ?? '').replace(/\n$/, '');
    return `\n\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
  },
});

const decode = (s) => (s || '')
  .replace(/&#8217;|&#8216;/g, "'").replace(/&#8220;|&#8221;/g, '"')
  .replace(/&#8211;/g, '–').replace(/&#8230;/g, '…').replace(/&amp;/g, '&')
  .replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

const yamlStr = (s) => JSON.stringify(decode(s));

function toMarkdown(html) {
  return normalizeHeadings(
    td.turndown(stripPluginMarkup(rewriteUrls(html)))
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

// WP bodies often start at h3/h4 under the layout's h1, failing the a11y
// heading-order audit (N5). Shift the whole document so its top level is h2.
function normalizeHeadings(md) {
  const lines = md.split('\n');
  let inCode = false, min = 7;
  for (const l of lines) {
    if (/^```/.test(l)) { inCode = !inCode; continue; }
    if (!inCode) { const m = l.match(/^(#{1,6})\s/); if (m) min = Math.min(min, m[1].length); }
  }
  if (min === 7 || min <= 2) return md;
  const shift = min - 2;
  inCode = false;
  return lines.map((l) => {
    if (/^```/.test(l)) { inCode = !inCode; return l; }
    if (inCode) return l;
    const m = l.match(/^(#{1,6})\s/);
    return m ? '#'.repeat(m[1].length - shift) + l.slice(m[1].length) : l;
  }).join('\n');
}

function coverFor(item) {
  if (item.featured_media && mediaById.has(item.featured_media)) {
    const m = mediaById.get(item.featured_media);
    const u = m.source_url || '';
    const local = u.replace(/https?:\/\/(?:www\.)?mityjohn\.com/, '');
    if (local.startsWith('/wp-content/uploads/')) return downscale(local);
  }
  const m = rewriteUrls(item.content.rendered).match(/src="(\/wp-content\/uploads\/[^"]+\.(?:png|jpe?g|webp|gif))"/i);
  return m ? m[1] : undefined;
}

const displayTag = (slug) => ({ ai: 'AI', 'generative-ai': 'GenAI', sdlc: 'SDLC', gpt: 'GPT', llm: 'LLM', tdd: 'TDD', vuejs: 'Vue.js', tmdb: 'TMDB', sonicpi: 'Sonic Pi', musicagent: 'MusicAgent' }[slug]
  ?? slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '));

// ---------------------------------------------------------------------------
// Emit
const outDirs = ['src/content/blog', 'src/content/apps', 'src/content/pages'];
for (const d of outDirs) {
  await rm(new URL(d + '/', ROOT), { recursive: true, force: true });
  await mkdir(new URL(d + '/', ROOT), { recursive: true });
}

let counts = { blog: 0, apps: 0, pages: 0, skipped: 0 };

for (const post of inv.posts) {
  const m = modelById.get(`post:${post.id}`);
  if (!m || m.target !== 'blog') { counts.skipped++; continue; }
  const tags = [...new Set([
    ...post.tags.map((id) => tagById.get(id)).filter(Boolean),
    ...post.categories.map((id) => catById.get(id)).filter(Boolean),
  ])];
  const cover = coverFor(post);
  const fm = [
    '---',
    `title: ${yamlStr(post.title.rendered)}`,
    `date: ${post.date}`,
    ...(post.modified && post.modified !== post.date ? [`updated: ${post.modified}`] : []),
    `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    ...(cover ? [`cover: ${JSON.stringify(cover)}`] : []),
    `cardTag: ${JSON.stringify(tags.slice(0, 2).map(displayTag).join(' · '))}`,
    `wpId: ${post.id}`,
    `wpSlug: ${JSON.stringify(post.slug)}`,
    '---',
  ].join('\n');
  await writeFile(new URL(`src/content/blog/${m.slug}.md`, ROOT), fm + '\n\n' + toMarkdown(post.content.rendered) + '\n');
  counts.blog++;
}

for (const page of inv.pages) {
  const m = modelById.get(`page:${page.id}`);
  if (!m) { counts.skipped++; continue; }
  if (m.target === 'apps') {
    const meta = APP_META[m.slug];
    if (!meta) throw new Error(`No APP_META for ${m.slug}`);
    const fm = [
      '---',
      `name: ${JSON.stringify(meta.name)}`,
      `code: ${JSON.stringify(meta.code)}`,
      `tag: ${JSON.stringify(meta.tag)}`,
      `cat: ${JSON.stringify(meta.cat)}`,
      `blurb: ${JSON.stringify(meta.blurb)}`,
      ...(meta.repo ? [`repo: ${JSON.stringify(meta.repo)}`] : []),
      ...(meta.demoUrl ? [`demoUrl: ${JSON.stringify(meta.demoUrl)}`] : []),
      `order: ${meta.order}`,
      `wpId: ${page.id}`,
      `wpSlug: ${JSON.stringify(page.slug)}`,
      '---',
    ].join('\n');
    await writeFile(new URL(`src/content/apps/${m.slug}.md`, ROOT), fm + '\n\n' + toMarkdown(page.content.rendered) + '\n');
    counts.apps++;
  } else if (m.target === 'page') {
    let body = toMarkdown(page.content.rendered);
    // The About page's conference list now lives in its own section (src/data/talks.json,
    // rendered as the Speaker level). Cut it here so the two never drift apart.
    if (page.id === 2) {
      const cut = body.search(/^\s*(?:#+\s*)?Conference talks\s*$/m);
      if (cut > -1) body = body.slice(0, cut).replace(/\n*-{3,}\s*$/, '').trimEnd();
      else console.warn('  About: "Conference talks" marker not found — talks may be duplicated');
    }
    const fm = [
      '---',
      `title: ${yamlStr(page.title.rendered)}`,
      `wpId: ${page.id}`,
      `wpSlug: ${JSON.stringify(page.slug)}`,
      '---',
    ].join('\n');
    await writeFile(new URL(`src/content/pages/${m.slug}.md`, ROOT), fm + '\n\n' + body + '\n');
    counts.pages++;
  } else {
    counts.skipped++; // merge targets — copy reviewed manually, indexes are designed
  }
}

console.log('emitted:', JSON.stringify(counts));

// Generate queued WebP siblings (skip ones already on disk)
{
  const sharp = (await import('sharp')).default;
  const { readFile, writeFile: wf } = await import('node:fs/promises');
  const pub = new URL('public/', ROOT);
  // \\?\ prefix sidesteps Windows MAX_PATH for the very long DALL·E filenames
  const longPath = (u) => {
    const p = fileURLToPath(u);
    return process.platform === 'win32' && !p.startsWith('\\\\?\\') ? '\\\\?\\' + p : p;
  };
  let made = 0, kept = 0;
  for (const [src, webp] of webpQueue) {
    if (uploadFiles.has(webp)) { kept++; continue; }
    try {
      const buf = await sharp(await readFile(longPath(new URL('.' + src, pub)))).webp({ quality: 82 }).toBuffer();
      await wf(longPath(new URL('.' + webp, pub)), buf);
      uploadFiles.add(webp);
      made++;
    } catch (e) {
      console.error(`  webp failed for ${src}: ${e.message}`);
    }
  }
  console.log(`webp: ${made} generated, ${kept} existing (${webpQueue.size} referenced)`);
}

// Post-emit F3 audit: no query-string internal links may remain
let bad = 0;
for (const dir of outDirs) {
  for (const f of readdirSync(new URL(dir + '/', ROOT))) {
    const txt = readFileSync(new URL(`${dir}/${f}`, ROOT), 'utf8');
    const hits = txt.match(/mityjohn\.com\/\?(?:p|page_id|cat|tag)=/g);
    if (hits) { console.log(`  F3 LEFTOVER in ${dir}/${f}: ${hits.length}`); bad += hits.length; }
  }
}
console.log(bad === 0 ? 'F3 audit: clean' : `F3 audit: ${bad} leftover internal query links`);
