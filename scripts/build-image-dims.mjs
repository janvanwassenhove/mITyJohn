// Most WordPress uploads carry their size in the filename (`-1024x585.webp`), and
// the rehype plugin in astro.config.mjs reads it from there. The originals do not,
// so those images render without width/height and shift the layout as they load
// (N5: CLS). This measures them once and writes a lookup the plugin falls back to.
//
// Run after adding images that have no -WxH suffix:
//   node scripts/build-image-dims.mjs

import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PUBLIC = fileURLToPath(new URL('../public', import.meta.url));
const OUT = fileURLToPath(new URL('../src/data/image-dims.json', import.meta.url));
const IMG = /\.(webp|png|jpe?g|gif|avif)$/i;
const HAS_SUFFIX = /-\d+x\d+\.[a-z]+$/i;

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (IMG.test(f) && !HAS_SUFFIX.test(f)) files.push(p);
  }
})(PUBLIC);

const dims = {};
let failed = 0;
for (const file of files) {
  const key = '/' + path.relative(PUBLIC, file).split(path.sep).join('/');
  try {
    const { width, height } = await sharp(file).metadata();
    if (width && height) dims[key] = [width, height];
    else failed++;
  } catch {
    failed++; // unreadable or not really an image — the plugin just skips it
  }
}

// sorted so the file diffs cleanly when images are added
const sorted = Object.fromEntries(Object.keys(dims).sort().map((k) => [k, dims[k]]));
writeFileSync(OUT, JSON.stringify(sorted, null, 0) + '\n');
console.log(`${Object.keys(sorted).length} images measured, ${failed} skipped -> src/data/image-dims.json`);
