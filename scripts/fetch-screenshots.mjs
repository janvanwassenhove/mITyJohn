// Pull app screenshots + the Scrummy mascot out of the public GitHub repos into
// public/screenshots/ and public/mascot/, and record them in src/data/screenshots.json
// so the store tiles can show real UI instead of the placeholder hatch pattern.
//
// Build-time only, unauthenticated works for public repos (GITHUB_TOKEN raises the
// rate limit). Committed output, so the site still builds with the network blocked.
//
// Run: node scripts/fetch-screenshots.mjs

import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url);
const SHOT_DIR = new URL('public/screenshots/', ROOT);
const MASCOT_DIR = new URL('public/mascot/', ROOT);
const OUT = new URL('src/data/screenshots.json', ROOT);

// Curated per app: repo + the in-repo image paths worth showing, in order.
// Hand-picked rather than globbed so we never surface icons, sprites or noise.
const SOURCES = {
  mitystudio: { repo: 'mITyStudio', files: ['docs/screenshots/studio.png', 'docs/screenshots/voices.png', 'docs/screenshots/assets.png', 'docs/screenshots/onboarding.png'] },
  'music-agent': { repo: 'MusicAgent', files: ['Assets/WebApp/CreativeMode.png', 'Assets/WebApp/SonicPi_Visualisation.png', 'Assets/WebApp/samples_playback.png'] },
  mityguitar: { repo: 'mITyGuitar', files: ['docs/images/splashscreen.png', 'docs/images/controller.png', 'docs/images/dongle.png'] },
  pibeat: { repo: 'PiBeat', files: ['screenshots/timeline.png', 'screenshots/editor.png', 'screenshots/band-visualizer.png', 'screenshots/agent-chat.png'] },
  typix: { repo: 'Typix', files: ['docs/assets/discovery.png', 'docs/assets/enneagram.png', 'docs/assets/disc-profile-sample.png'] },
  hipster: { repo: 'Hipster', files: ['public/hipster.png'] },
  loveflix: { repo: 'LoveFlix', files: ['LoveFlix.png'] },
  mitylex: { repo: 'mITyLex', files: ['public/lexy.png'] },
  'scrum-programming': { repo: 'scrum', files: ['asset/banner.png'] },
};

// Mascot art for the Scrum level (asset/ in the scrum repo).
const MASCOTS = [
  { repo: 'scrum', path: 'asset/scrummy_transparant.png', out: 'scrummy.png' },
  { repo: 'scrum', path: 'asset/scrummy_skate.png', out: 'scrummy-skate.png' },
];

const headers = { 'User-Agent': 'mityjohn-site-sync', Accept: 'application/vnd.github.raw' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const raw = (repo, path) => `https://raw.githubusercontent.com/janvanwassenhove/${repo}/HEAD/${path}`;

// Card art renders ~380px wide at 152px tall and is cropped with object-fit, so
// 560px is already generous. (1200px cost ~528 KiB of waste on the home page,
// 720px still ~56 KiB — both flagged by Lighthouse's responsive-images audit.)
async function grab(repo, path, destUrl, { width = 560 } = {}) {
  const local = fileURLToPath(destUrl);
  if (await stat(local).catch(() => null)) return 'cached';
  const res = await fetch(raw(repo, path), { headers, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const img = sharp(buf);
  const meta = await img.metadata();
  const pipeline = meta.width && meta.width > width ? img.resize({ width }) : img;
  // Keep alpha (mascot cut-outs) as PNG, flatten photos/screenshots to WebP.
  const out = local.endsWith('.png') ? await pipeline.png({ compressionLevel: 9 }).toBuffer() : await pipeline.webp({ quality: 76 }).toBuffer();
  await writeFile(local, out);
  return 'fetched';
}

await mkdir(SHOT_DIR, { recursive: true });
await mkdir(MASCOT_DIR, { recursive: true });

let previous = {};
try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch {}

const index = { ...previous };
let fetched = 0, cached = 0, failed = 0;

for (const [slug, { repo, files }] of Object.entries(SOURCES)) {
  const shots = [];
  for (const [i, path] of files.entries()) {
    const name = `${slug}-${i + 1}.webp`;
    try {
      const r = await grab(repo, path, new URL(name, SHOT_DIR));
      r === 'fetched' ? fetched++ : cached++;
      shots.push({ src: `/screenshots/${name}`, alt: `${slug} screenshot ${i + 1}` });
    } catch (e) {
      failed++;
      console.error(`  ${slug} <- ${repo}/${path}: ${e.message}`);
    }
  }
  if (shots.length) index[slug] = shots;
}

for (const m of MASCOTS) {
  try {
    const r = await grab(m.repo, m.path, new URL(m.out, MASCOT_DIR), { width: 600 });
    r === 'fetched' ? fetched++ : cached++;
  } catch (e) {
    failed++;
    console.error(`  mascot ${m.path}: ${e.message}`);
  }
}

await writeFile(OUT, JSON.stringify(index, null, 2) + '\n');
console.log(`screenshots: ${fetched} fetched, ${cached} cached, ${failed} failed; ${Object.keys(index).length} apps indexed`);
process.exit(0); // never break a build
