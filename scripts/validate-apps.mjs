// Audit every app entry: does the repo exist, does the demo URL resolve, are there
// releases, and is there tile art? Read-only — prints a table, changes nothing.
//
// Run: node scripts/validate-apps.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const shots = JSON.parse(readFileSync(new URL('src/data/screenshots.json', ROOT), 'utf8'));
const releases = JSON.parse(readFileSync(new URL('src/data/releases.json', ROOT), 'utf8'));

const headers = { 'User-Agent': 'mityjohn-site-validate' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const apps = [];
for (const f of readdirSync(new URL('src/content/apps/', ROOT))) {
  const raw = readFileSync(new URL('src/content/apps/' + f, ROOT), 'utf8');
  const fm = raw.slice(0, raw.indexOf('\n---', 4));
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')) || [])[1];
  const slug = f.replace(/\.md$/, '');
  // first image referenced in the page body, usable as tile art
  const bodyImg = (raw.match(/!\[[^\]]*\]\((\/wp-content\/uploads\/[^)]+)\)/) || [])[1];
  apps.push({ slug, name: get('name'), repo: get('repo'), demoUrl: get('demoUrl'), bodyImg });
}

const check = async (url, method = 'HEAD') => {
  try {
    const r = await fetch(url, { method, headers, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return r.status;
  } catch (e) {
    return `ERR ${e.message.slice(0, 24)}`;
  }
};

const rows = [];
for (const a of apps) {
  const repoStatus = a.repo ? await check(`https://api.github.com/repos/janvanwassenhove/${a.repo}`, 'GET') : '—';
  const demoStatus = a.demoUrl ? await check(a.demoUrl) : '—';
  const shotCount = (shots[a.slug] || []).length;
  const rel = a.repo && releases[a.repo];
  rows.push({
    app: a.name,
    slug: a.slug,
    repo: a.repo || '(none)',
    repoOk: repoStatus === 200 ? 'ok' : String(repoStatus),
    demo: a.demoUrl ? (demoStatus === 200 ? 'ok' : String(demoStatus)) : '—',
    release: rel ? rel.tag : a.repo ? 'none' : '—',
    shots: shotCount || (a.bodyImg ? 'body-img' : 'NONE'),
    bodyImg: a.bodyImg || '',
  });
}

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(pad('APP', 26) + pad('REPO', 16) + pad('REPO?', 8) + pad('DEMO', 8) + pad('RELEASE', 10) + 'TILE ART');
console.log('-'.repeat(84));
for (const r of rows) {
  console.log(pad(r.app, 26) + pad(r.repo, 16) + pad(r.repoOk, 8) + pad(r.demo, 8) + pad(r.release, 10) + r.shots);
}

console.log('\nProblems:');
const probs = rows.filter((r) => r.repoOk !== 'ok' && r.repo !== '(none)' || r.demo !== '—' && r.demo !== 'ok' || r.shots === 'NONE');
if (!probs.length) console.log('  none');
for (const r of probs) {
  const why = [];
  if (r.repo !== '(none)' && r.repoOk !== 'ok') why.push(`repo ${r.repoOk}`);
  if (r.demo !== '—' && r.demo !== 'ok') why.push(`demo ${r.demo}`);
  if (r.shots === 'NONE') why.push('no tile art');
  console.log(`  ${r.app}: ${why.join(', ')}`);
}
console.log('\nCandidate tile art from page bodies (for apps without repo screenshots):');
for (const r of rows.filter((x) => x.shots === 'body-img')) console.log(`  ${r.slug}: ${r.bodyImg}`);
