// Phase 2 — reconciliation (MIGRATION_BRIEF.md §6 Phase 2)
// Derives content-model.json and url-map.json from content-inventory.json plus the
// explicit classification decisions below (documented in gap-list.md).
//
// Run: node scripts/build-content-model.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const inv = JSON.parse(readFileSync(new URL('../content-inventory.json', import.meta.url), 'utf8'));

const decode = (s) => (s || '')
  .replace(/&#8217;|&#8216;/g, "'").replace(/&#8220;|&#8221;/g, '"')
  .replace(/&#8211;/g, '-').replace(/&amp;/g, '&').replace(/&#039;/g, "'");

const slugify = (s) => decode(s).toLowerCase()
  .replace(/<[^>]+>/g, '').replace(/['".,!?()]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');

// ---------------------------------------------------------------------------
// PAGE DECISIONS (gap-list.md records the rationale for every non-obvious row)
// target: blog | apps | books | page | merge | retire
// ---------------------------------------------------------------------------
const PAGE_DECISIONS = {
  2:   { target: 'page',  slug: 'about',              new: '/about/' },              // D8: 'sample-page' non-descriptive
  100: { target: 'apps',  slug: 'scrum-programming',  new: '/apps/scrum-programming/' },
  184: { target: 'merge', slug: null,                 new: '/blog/' },               // blog index
  219: { target: 'apps',  slug: 'music-agent',        new: '/apps/music-agent/' },   // D8: WP slug 'music' ≠ title
  481: { target: 'apps',  slug: 'typix',              new: '/apps/typix/' },
  514: { target: 'apps',  slug: 'mitystudio',         new: '/apps/mitystudio/' },
  546: { target: 'apps',  slug: 'hipster',            new: '/apps/hipster/' },
  591: { target: 'page',  slug: 'artist',             new: '/artist/' },
  640: { target: 'apps',  slug: 'sportsmadness',      new: '/apps/sportsmadness/' },
  706: { target: 'apps',  slug: 'mityguitar',         new: '/apps/mityguitar/' },
  760: { target: 'apps',  slug: 'loveflix',           new: '/apps/loveflix/' },
  771: { target: 'apps',  slug: 'mitystories',        new: '/apps/mitystories/' },
  790: { target: 'apps',  slug: 'mityfighter',        new: '/apps/mityfighter/' },
  830: { target: 'apps',  slug: 'mitylaundry',        new: '/apps/mitylaundry/' },
  841: { target: 'apps',  slug: 'mitylex',            new: '/apps/mitylex/' },
  853: { target: 'apps',  slug: 'pibeat',             new: '/apps/pibeat/' },
  883: { target: 'apps',  slug: 'mitygarden',         new: '/apps/mitygarden/' },    // gap G3: not in design's 14
  899: { target: 'merge', slug: null,                 new: '/books/' },              // books index
  901: { target: 'merge', slug: null,                 new: '/books/' },              // series → index section
  902: { target: 'merge', slug: null,                 new: '/books/' },              // series → index section
  951: { target: 'apps',  slug: 'ghosts-in-the-machine', new: '/apps/ghosts-in-the-machine/' },
  960: { target: 'merge', slug: null,                 new: '/#apps' },               // store lives on home (design IA)
};

// D8 — WP slugs that are misleading/non-descriptive but not caught by the automatic
// F2 rule (numeric or <3 chars). Verified against content 2026-07-18: both are real
// articles whose slugs are leftovers ("hello-world", "test"). Regenerate from title.
const SLUG_NON_DESCRIPTIVE = new Set([1, 342]);

// D7 — categories flatten into tags (category slug → tag slug)
const CATEGORY_TO_TAG = {
  ai: 'ai', development: 'development', fun: 'fun', hockey: 'hockey',
  'low-code': 'lowcode', music: 'music', uncategorized: null, // 0 posts, drop
};

// ---------------------------------------------------------------------------
const model = [];
const urlMap = [];

// Posts
for (const p of inv.posts) {
  const bad = /^\d+$/.test(p.slug) || p.slug.length < 3 || SLUG_NON_DESCRIPTIVE.has(p.id); // F2 + D8
  const slug = bad ? slugify(p.title.rendered) : p.slug;
  model.push({
    wpId: p.id, wpType: 'post', title: decode(p.title.rendered),
    target: 'blog', wpSlug: p.slug, slug,
    ...(bad ? { slugRegenerated: true } : {}),
  });
  urlMap.push({ type: 'post', wpId: p.id, old: `/?p=${p.id}`, new: `/blog/${slug}/` });
}

// Pages
for (const p of inv.pages) {
  const d = PAGE_DECISIONS[p.id];
  if (!d) throw new Error(`Unclassified page ${p.id} (${p.slug}) — every ID must have a target`);
  model.push({ wpId: p.id, wpType: 'page', title: decode(p.title.rendered), target: d.target, wpSlug: p.slug, slug: d.slug });
  urlMap.push({ type: 'page', wpId: p.id, old: `/?page_id=${p.id}`, new: d.new });
}

// Tags — every tag gets an archive redirect
for (const t of inv.tags) {
  urlMap.push({ type: 'tag', wpTag: t.slug, old: `/?tag=${t.slug}`, new: `/tags/${t.slug}/` });
}

// Categories (D7) — ?cat=N and ?category_name=slug both redirect to the tag archive
for (const c of inv.categories) {
  const tag = CATEGORY_TO_TAG[c.slug];
  const target = tag ? `/tags/${tag}/` : '/blog/';
  urlMap.push({ type: 'category', wpId: c.id, old: `/?cat=${c.id}`, new: target });
  urlMap.push({ type: 'category', wpSlug: c.slug, old: `/?category_name=${c.slug}`, new: target });
}

// Feeds, author archive, home
urlMap.push({ type: 'feed', old: '/?feed=rss2', new: '/feed/' });
urlMap.push({ type: 'feed', old: '/?feed=rss', new: '/feed/' });
urlMap.push({ type: 'feed', old: '/?feed=atom', new: '/feed/' });
urlMap.push({ type: 'author', old: '/?author=1', new: '/about/' });

// ---------------------------------------------------------------------------
// Validation: no duplicate olds, no duplicate non-index news among content, every
// sitemap URL covered.
const olds = new Set();
for (const e of urlMap) {
  if (olds.has(e.old)) throw new Error(`duplicate old URL: ${e.old}`);
  olds.add(e.old);
}
const contentNews = urlMap.filter(e => (e.type === 'post' && e.new !== '/blog/') || (e.type === 'page' && !['/blog/', '/books/', '/#apps'].includes(e.new)));
const newSet = new Set();
for (const e of contentNews) {
  if (newSet.has(e.new)) throw new Error(`duplicate target URL: ${e.new}`);
  newSet.add(e.new);
}
const uncovered = inv.sitemapUrls.filter(u => {
  const q = u.replace(/^https?:\/\/(www\.)?mityjohn\.com\/?/, '/');
  return q !== '/' && !olds.has(q);
});
if (uncovered.length) throw new Error('sitemap URLs not covered:\n' + uncovered.join('\n'));

writeFileSync(new URL('../content-model.json', import.meta.url), JSON.stringify(model, null, 2));
writeFileSync(new URL('../url-map.json', import.meta.url), JSON.stringify(urlMap, null, 2));

const counts = model.reduce((a, m) => ((a[m.target] = (a[m.target] || 0) + 1), a), {});
console.log('content-model.json:', model.length, 'entries', JSON.stringify(counts));
console.log('url-map.json:', urlMap.length, 'redirects; all sitemap URLs covered; no duplicate olds; no duplicate content targets');
