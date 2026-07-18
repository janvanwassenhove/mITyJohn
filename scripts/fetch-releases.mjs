// §9 — GitHub Releases → src/data/releases.json (build-time; apps store).
// Unauthenticated works for public repos; pass GITHUB_TOKEN to raise the rate limit.
// Whitelisted fields only (R5). On any error: keep previous JSON, exit 0.
// Run: node scripts/fetch-releases.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('src/data/releases.json', ROOT);

// Repo list derived from apps frontmatter — single source of truth.
const repos = new Set();
for (const f of readdirSync(new URL('src/content/apps/', ROOT))) {
  const m = readFileSync(new URL('src/content/apps/' + f, ROOT), 'utf8').match(/^repo:\s*"([^"]+)"/m);
  if (m) repos.add(m[1]);
}

const PLATFORM = [
  [/\.(exe|msi)$/i, 'Windows'],
  [/\.dmg$/i, 'macOS'],
  [/\.(AppImage|deb|rpm)$/i, 'Linux'],
  [/\.apk$/i, 'Android'],
];
const platformOf = (name) => PLATFORM.find(([re]) => re.test(name))?.[1];

const headers = { 'User-Agent': 'mityjohn-site-sync', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

let previous = {};
try { previous = JSON.parse(readFileSync(OUT, 'utf8')); } catch {}

const out = { ...previous };
let ok = 0, misses = 0, failures = 0;

for (const repo of repos) {
  try {
    const res = await fetch(`https://api.github.com/repos/janvanwassenhove/${repo}/releases/latest`, { headers });
    if (res.status === 404) { misses++; delete out[repo]; continue; } // no releases — designed fallback CTA
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const r = await res.json();
    // R5: whitelisted shape only — never serialize the API response wholesale.
    out[repo] = {
      tag: r.tag_name,
      date: r.published_at,
      changelog: (r.body || '').slice(0, 2000),
      assets: (r.assets || [])
        // real user downloads only — drop electron-updater metadata and blockmaps
        .filter((a) => !/\.(yml|yaml|blockmap|sig|txt)$/i.test(a.name))
        .map((a) => ({
          name: a.name,
          url: a.browser_download_url,
          size: a.size,
          downloads: a.download_count,
          platform: platformOf(a.name),
        }))
        // installers with a recognised platform first, biggest download count as tiebreak
        .sort((a, b) => (b.platform ? 1 : 0) - (a.platform ? 1 : 0) || b.downloads - a.downloads),
    };
    ok++;
  } catch (e) {
    failures++;
    console.error(`  ${repo}: ${e.message} (keeping previous data)`);
  }
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`releases.json: ${ok} with releases, ${misses} without, ${failures} errors (previous kept)`);
process.exit(0); // a failed sync must never break a deploy
