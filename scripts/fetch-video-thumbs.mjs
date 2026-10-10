// YouTube thumbnails → public/thumbs/youtube/<id>.webp, and the list of ids that
// have one → src/data/video-thumbs.json.
//
// The site's YouTube players are click-to-load facades (§8.1, D5): nothing is
// requested from YouTube until the visitor clicks. Hotlinking i.ytimg.com for a
// preview would break that on page load, so the thumbnails are fetched here, at
// build time, and served from this site like any other image. Committed output,
// so the site still builds with the network blocked.
//
// Ids are collected from every place a video can appear: talks.json's `video`
// field and any youtube(-nocookie).com/embed/<id> in the content.
//
// Run: node scripts/fetch-video-thumbs.mjs

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url);
const OUT_DIR = new URL('public/thumbs/youtube/', ROOT);
const INDEX = new URL('src/data/video-thumbs.json', ROOT);
const WIDTH = 960;

async function* files(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    if (e.isDirectory()) yield* files(p);
    else if (/\.(md|mdx|astro|json)$/.test(e.name)) yield p;
  }
}

const ids = new Set();
for await (const f of files(new URL('src/', ROOT))) {
  if (f.pathname.endsWith('video-thumbs.json')) continue;
  const text = await readFile(f, 'utf8');
  for (const m of text.matchAll(/youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/g)) ids.add(m[1]);
  for (const m of text.matchAll(/"video"\s*:\s*"([A-Za-z0-9_-]{11})"/g)) ids.add(m[1]);
}

// maxresdefault is the real 16:9 frame but only exists for HD uploads; the
// fallbacks are 4:3 with the picture letterboxed, so they are cropped to 16:9.
const SOURCES = [
  { name: 'maxresdefault', letterboxed: false },
  { name: 'sddefault', letterboxed: true },
  { name: 'hqdefault', letterboxed: true },
];

async function grab(id) {
  for (const { name, letterboxed } of SOURCES) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    let img = sharp(buf);
    const { width, height } = await img.metadata();
    // YouTube answers a missing size with a 120×90 grey placeholder, not a 404.
    if (!width || width <= 120) continue;
    if (letterboxed) {
      const h = Math.round((width * 9) / 16);
      img = img.extract({ left: 0, top: Math.round((height - h) / 2), width, height: h });
    }
    return img.resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  }
  throw new Error('no thumbnail at any size');
}

await mkdir(OUT_DIR, { recursive: true });
const index = {};
let fetched = 0, cached = 0, failed = 0;
for (const id of [...ids].sort()) {
  const dest = new URL(`${id}.webp`, OUT_DIR);
  try {
    if (await stat(dest).catch(() => null)) cached++;
    else {
      await writeFile(dest, await grab(id));
      fetched++;
    }
    index[id] = `/thumbs/youtube/${id}.webp`;
  } catch (e) {
    failed++;
    console.error(`  ${id}: ${e.message}`);
  }
}
await writeFile(INDEX, JSON.stringify(index, null, 2) + '\n');
console.log(`video thumbs: ${fetched} fetched, ${cached} cached, ${failed} failed; ${Object.keys(index).length} indexed -> ${fileURLToPath(INDEX)}`);
