// Phase 4/6 audit — greps dist/ for legacy query-string links, verifies every
// internal href/src resolves to a built file or mirrored upload.
// Run after `npm run build`: node scripts/check-dist.mjs

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const htmlFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

let legacy = 0, broken = 0, checked = 0;
const missing = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = path.relative(DIST, file);

  // 1. Legacy query-string internal links (§6 Phase 4 done-when)
  for (const m of html.matchAll(/(?:https?:\/\/(?:www\.)?mityjohn\.com)?\/\?(?:p|page_id|cat|category_name|tag|feed)=[^"'\s<>]*/g)) {
    console.log(`LEGACY ${rel}: ${m[0]}`);
    legacy++;
  }

  // 2. Internal hrefs/srcs resolve
  for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    let u = m[1].split('#')[0].split('?')[0];
    if (!u || u.startsWith('//')) continue;
    u = decodeURIComponent(u);
    checked++;
    const candidates = [
      path.join(DIST, u),
      path.join(DIST, u, 'index.html'),
      path.join(DIST, u.replace(/\/$/, '') + '.html'),
    ];
    if (!candidates.some((c) => existsSync(c) && !statSync(c).isDirectory() || existsSync(path.join(c, 'index.html')))) {
      const ok = existsSync(path.join(DIST, u)) || existsSync(path.join(DIST, u, 'index.html'));
      if (!ok) {
        missing.set(u, (missing.get(u) || 0) + 1);
        broken++;
      }
    }
  }
}

if (missing.size) {
  console.log('\nMissing internal targets:');
  for (const [u, n] of [...missing.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${u}`);
}
console.log(`\n${htmlFiles.length} pages · ${checked} internal refs checked · legacy query links: ${legacy} · broken internal refs: ${broken}`);
process.exit(legacy || missing.size ? 1 : 0);
