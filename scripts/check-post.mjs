// Pre-publish check for a blog post. Catches the things that are annoying to
// discover after a deploy: bad frontmatter, images that do not exist, links that
// point nowhere, a slug that collides with an existing post.
//
// Run: node scripts/check-post.mjs src/content/blog/my-post.md
//      node scripts/check-post.mjs            (checks every post)

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url);
const BLOG = fileURLToPath(new URL('src/content/blog/', ROOT));
const PUBLIC = fileURLToPath(new URL('public', ROOT));

const args = process.argv.slice(2);
const files = args.length
  ? args.map((a) => path.resolve(a))
  : readdirSync(BLOG).filter((f) => f.endsWith('.md')).map((f) => path.join(BLOG, f));

let errors = 0;
let warnings = 0;
const err = (f, m) => { console.log(`  ERROR  ${m}`); errors++; };
const warn = (f, m) => { console.log(`  warn   ${m}`); warnings++; };

const slugs = new Set(
  readdirSync(BLOG).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')),
);

for (const file of files) {
  const name = path.basename(file);
  const slug = name.replace(/\.md$/, '');
  console.log(`\n${name}`);

  if (!existsSync(file)) { err(file, 'file does not exist'); continue; }
  const raw = readFileSync(file, 'utf8');

  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) { err(file, 'no frontmatter block'); continue; }
  const front = fm[1];
  const body = raw.slice(fm[0].length).trim();

  const get = (k) => (front.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')) || [])[1]?.trim();

  // --- required fields
  const title = get('title');
  const date = get('date');
  if (!title) err(file, 'missing title');
  else if (!/^["']/.test(title)) warn(file, 'title is unquoted — quote it if it contains : or #');
  if (!date) err(file, 'missing date');
  else if (Number.isNaN(Date.parse(date.replace(/^["']|["']$/g, '')))) err(file, `date is not parseable: ${date}`);

  const tags = get('tags');
  if (!tags) warn(file, 'no tags — the post will not appear on any tag page');

  const isDraft = /^draft:\s*true\s*$/m.test(front);
  if (isDraft) console.log('  note   draft: true — excluded from the build');

  // --- slug collisions (only relevant for a file not yet in the folder)
  if (!file.startsWith(BLOG) && slugs.has(slug)) err(file, `slug "${slug}" already exists in src/content/blog`);

  // --- images referenced in frontmatter and body must exist on disk
  const imgs = new Set();
  for (const k of ['cover', 'ogImage']) {
    const v = get(k)?.replace(/^["']|["']$/g, '');
    if (v) imgs.add(v);
  }
  for (const m of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) imgs.add(m[1]);
  for (const m of body.matchAll(/<img[^>]+src="([^"]+)"/g)) imgs.add(m[1]);

  for (const src of imgs) {
    if (/^https?:\/\//.test(src)) { warn(file, `remote image (will not be in your control): ${src}`); continue; }
    if (!src.startsWith('/')) { err(file, `image path must start with / : ${src}`); continue; }
    if (!existsSync(path.join(PUBLIC, decodeURIComponent(src)))) err(file, `image not found in public/: ${src}`);
  }

  // --- internal links should resolve to something we publish
  for (const m of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = m[1].split('#')[0];
    if (!href || href.startsWith('/wp-content/') || href.startsWith('/instagram/')) continue;
    const known =
      href === '/' ||
      /^\/(blog|apps|books|tags|talks|about|artist)\//.test(href) ||
      existsSync(path.join(PUBLIC, href));
    if (!known) warn(file, `internal link may not resolve: ${href}`);
  }

  // --- house style (references/voice.md)
  if (/in today's fast-paced/i.test(body)) err(file, 'contains "in today\'s fast-paced" — instant fail per voice guide');
  const bangs = (body.match(/!(?!\[)/g) || []).length;
  if (bangs > 1) warn(file, `${bangs} exclamation marks — the voice guide allows at most one`);
  const emoji = body.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu);
  if (emoji) warn(file, `${emoji.length} emoji — the voice guide says none unless asked`);

  const words = body.split(/\s+/).length;
  console.log(`  ${words} words${errors === 0 ? '' : ''}`);
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
