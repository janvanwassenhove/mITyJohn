// Generate the redirect table for workers/redirects from url-map.json.
//
// Bulk Redirects cannot match query strings (Cloudflare limitation), so the
// query-string entries are served by a Worker instead. Path-only entries stay
// in the CSV for Bulk Redirects.
//
// Run: node scripts/build-worker-redirects.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const urlMap = JSON.parse(readFileSync(new URL('url-map.json', ROOT), 'utf8'));

/** { p: { '941': '/blog/…' }, page_id: { '2': '/about/' }, … } */
const table = {};
let queryCount = 0;
const pathOnly = [];

for (const e of urlMap) {
  const m = e.old.match(/^\/\?([a-z_]+)=(.+)$/);
  if (m) {
    const [, key, value] = m;
    (table[key] ??= {})[decodeURIComponent(value)] = e.new;
    queryCount++;
  } else {
    pathOnly.push(e);
  }
}

mkdirSync(new URL('workers/redirects/src/', ROOT), { recursive: true });
writeFileSync(new URL('workers/redirects/src/map.json', ROOT), JSON.stringify(table, null, 2) + '\n');

console.log(`map.json: ${queryCount} query-string redirects across keys ${Object.keys(table).join(', ')}`);
console.log(`path-only (stay in the Bulk Redirects CSV): ${pathOnly.length}`);
for (const e of pathOnly) console.log(`  ${e.old} -> ${e.new}`);
