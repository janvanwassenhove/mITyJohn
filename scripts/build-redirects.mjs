// §5.3 — url-map.json → Cloudflare Bulk Redirect CSV.
// Import at: Cloudflare dash → Rules → Bulk Redirects → upload CSV.
// Settings per brief: 301, preserve query string OFF, subpath matching OFF.
// Run: node scripts/build-redirects.mjs   → cloudflare-redirects.csv

import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const urlMap = JSON.parse(readFileSync(new URL('url-map.json', ROOT), 'utf8'));

const SITE = 'https://mityjohn.com';
const rows = [['Source URL', 'Target URL', 'Status', 'Parameters']];

for (const e of urlMap) {
  // Source includes the query string (plain-permalink URLs are query strings).
  const target = e.new.startsWith('http') ? e.new : SITE + e.new;
  rows.push([`mityjohn.com/${e.old.replace(/^\//, '')}`, target, '301', '']);
}
// /feed/ path form (§5.1: /feed/ mirrors /rss.xml; edge 301 beats the meta-refresh fallback)
rows.push(['mityjohn.com/feed/', `${SITE}/rss.xml`, '301', '']);
rows.push(['mityjohn.com/feed', `${SITE}/rss.xml`, '301', '']);

const csv = rows.map((r) => r.map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n') + '\n';
writeFileSync(new URL('cloudflare-redirects.csv', ROOT), csv);
console.log(`cloudflare-redirects.csv: ${rows.length - 1} rules`);
