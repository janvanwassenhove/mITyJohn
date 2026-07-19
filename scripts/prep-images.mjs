// Prepare images for a blog post: resize, convert to WebP, drop them in
// public/blog/<slug>/ under the names you give them.
//
// Featured images are squared to 1200x1200 (the card and OG tag both want a
// square); everything else is capped at 1600px wide and left in its own ratio.
//
// Run: node scripts/prep-images.mjs <slug> <src>=<name>[:cover] ...
// e.g. node scripts/prep-images.mjs my-post "../drafts/a.png=cover:cover" "../drafts/b.png=cables"

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const [slug, ...specs] = process.argv.slice(2);
if (!slug || !specs.length) {
  console.error('usage: node scripts/prep-images.mjs <slug> <src>=<name>[:cover] ...');
  process.exit(1);
}

const OUT = fileURLToPath(new URL(`../public/blog/${slug}/`, import.meta.url));
mkdirSync(OUT, { recursive: true });

for (const spec of specs) {
  const [src, rest] = spec.split('=');
  if (!rest) { console.error(`ERROR  bad spec (need src=name): ${spec}`); process.exit(1); }
  const [name, kind] = rest.split(':');
  const from = path.resolve(src);
  if (!existsSync(from)) { console.error(`ERROR  no such file: ${from}`); process.exit(1); }

  const square = kind === 'cover';
  const meta = await sharp(from).metadata();
  const info = await sharp(from)
    .resize(square ? 1200 : 1600, square ? 1200 : null, {
      fit: square ? 'cover' : 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, `${name}.webp`));

  console.log(
    `${name}.webp`.padEnd(14) +
      `${meta.width}x${meta.height} -> ${info.width}x${info.height}  ` +
      `${(info.size / 1024).toFixed(0)} KB  /blog/${slug}/${name}.webp`,
  );
}
