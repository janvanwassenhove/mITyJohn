// §10.3 — post-cutover redirect assertion. Samples N entries from url-map.json,
// requests the OLD query-string URL against production and asserts a literal 301
// with the correct Location. Run AFTER Cloudflare Bulk Redirects are live.
//
// Run: node scripts/assert-redirects.mjs [sampleSize=20]

import { readFileSync } from 'node:fs';

const SITE = 'https://mityjohn.com';
const urlMap = JSON.parse(readFileSync(new URL('../url-map.json', import.meta.url), 'utf8'));
const N = parseInt(process.argv[2] || '20', 10);

// Deterministic spread: every k-th entry rather than random, so reruns compare.
const step = Math.max(1, Math.floor(urlMap.length / N));
const sample = urlMap.filter((_, i) => i % step === 0).slice(0, N);

let pass = 0, fail = 0;
for (const e of sample) {
  const old = SITE + e.old;
  const want = e.new.startsWith('http') ? e.new : SITE + e.new;
  try {
    const res = await fetch(old, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    const normalizedLoc = loc.replace(/\/$/, '/');
    const ok = res.status === 301 && (normalizedLoc === want || normalizedLoc === want.replace(/\/$/, ''));
    if (ok) { pass++; console.log(`  OK   ${e.old} -> ${loc}`); }
    else { fail++; console.log(`  FAIL ${e.old}: status ${res.status}, location ${loc || '(none)'}, wanted ${want}`); }
  } catch (err) {
    fail++;
    console.log(`  FAIL ${e.old}: ${err.message}`);
  }
}
console.log(`\n${pass}/${sample.length} passed`);
process.exit(fail ? 1 : 0);
