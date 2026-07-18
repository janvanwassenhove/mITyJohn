// §7.3 — Instagram sync (NO credentials; reads the public Worker endpoint).
// Downloads media locally (Instagram CDN URLs are signed and expire — never link
// them), writes src/data/instagram.json in the whitelisted shape.
// On ANY error: exit 0 and leave the existing JSON untouched (a failed sync must
// never break a deploy).
// Run: node scripts/fetch-instagram.mjs   (env IG_WORKER_URL overrides the default)

import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const WORKER_URL = process.env.IG_WORKER_URL || 'https://ig.mityjohn.workers.dev/instagram';
const ROOT = new URL('..', import.meta.url);
const IMG_DIR = new URL('public/instagram/', ROOT);
const OUT = new URL('src/data/instagram.json', ROOT);

try {
  const res = await fetch(WORKER_URL, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`worker HTTP ${res.status}`);
  const media = await res.json();
  if (!Array.isArray(media)) throw new Error('unexpected payload shape');

  await mkdir(IMG_DIR, { recursive: true });
  const items = [];
  for (const m of media.slice(0, 12)) {
    if (!m.id || !m.permalink) continue;
    const src = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
    if (!src) continue;
    const file = `${m.id}.jpg`;
    const imgRes = await fetch(src, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) throw new Error(`media HTTP ${imgRes.status}`);
    await pipeline(Readable.fromWeb(imgRes.body), createWriteStream(new URL(file, IMG_DIR)));
    const caption = (m.caption || '').trim();
    items.push({
      // whitelisted shape only (R5)
      href: m.permalink,
      image: `/instagram/${file}`,
      tag: caption ? '#' + (caption.match(/#(\w+)/)?.[1] ?? 'mITyJohn') : '#mITyJohn',
      alt: caption.slice(0, 500),
      timestamp: m.timestamp,
    });
  }
  if (!items.length) throw new Error('no usable items');
  await writeFile(OUT, JSON.stringify(items, null, 2) + '\n');
  console.log(`instagram.json: ${items.length} items`);
} catch (e) {
  console.error(`instagram sync skipped: ${e.message} (existing JSON untouched)`);
}
process.exit(0);
