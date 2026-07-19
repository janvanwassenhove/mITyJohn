// §5.3 — path-based redirects → Cloudflare Bulk Redirect CSV.
// Import at: Cloudflare dash → Rules → Bulk Redirects → upload CSV.
//
// IMPORTANT: Cloudflare Bulk Redirects cannot match a query string in the source
// URL, and 110 of our 112 legacy URLs are query strings (/?p=941, /?page_id=2…).
// Those are handled by workers/redirects instead — see
// scripts/build-worker-redirects.mjs. Only path-based redirects belong here.
//
// The file must have NO header row: Cloudflare reads the first line as data.
// Format: <SOURCE_URL>,<TARGET_URL>,<STATUS>,<PRESERVE_QUERY>,<INCLUDE_SUBDOMAINS>,<SUBPATH>,<PRESERVE_SUFFIX>
//
// Run: node scripts/build-redirects.mjs   → cloudflare-redirects.csv

import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const urlMap = JSON.parse(readFileSync(new URL('url-map.json', ROOT), 'utf8'));

const SITE = 'https://mityjohn.com';
const rows = [];

let skipped = 0;
for (const e of urlMap) {
  if (e.old.includes('?')) { skipped++; continue; } // Worker territory
  const target = e.new.startsWith('http') ? e.new : SITE + e.new;
  rows.push([`mityjohn.com/${e.old.replace(/^\//, '')}`, target, '301', 'false', 'false', 'false', 'false']);
}
// /feed/ path form (§5.1: /feed/ mirrors /rss.xml; edge 301 beats the meta-refresh fallback)
rows.push(['mityjohn.com/feed/', `${SITE}/rss.xml`, '301', 'false', 'false', 'false', 'false']);
rows.push(['mityjohn.com/feed', `${SITE}/rss.xml`, '301', 'false', 'false', 'false', 'false']);

const csv = rows.map((r) => r.map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n') + '\n';
writeFileSync(new URL('cloudflare-redirects.csv', ROOT), csv);
console.log(`cloudflare-redirects.csv: ${rows.length} path-based rules (no header row)`);
console.log(`${skipped} query-string redirects excluded — those live in workers/redirects`);
