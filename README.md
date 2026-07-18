# mityjohn.com

Static site for [mityjohn.com](https://mityjohn.com) — Astro on GitHub Pages, fronted by
Cloudflare. Replaces the previous WordPress installation without losing URLs, images, or
search ranking.

**Canonical spec: [MIGRATION_BRIEF.md](MIGRATION_BRIEF.md).** If anything here disagrees
with the brief, the brief wins. Cutover checklist: [CUTOVER.md](CUTOVER.md).

## Stack

- [Astro 5](https://astro.build) + Tailwind 4, tokens from [design/tokens.css](design/tokens.css)
  (extracted from the Claude Design project — `design/` is reference only, never built)
- Content collections: `blog` (37 posts), `apps` (15), `books`, `pages` — converted from
  the WordPress REST export, frontmatter carries `wpId`/`wpSlug` for traceability
- Zero client-side JS by default; tiny inline islands for theme toggle, store filter,
  click-to-load Spotify, scroll reveal
- Build-time integrations only: GitHub Releases, Instagram (via a Cloudflare Worker
  token broker in [workers/instagram](workers/instagram) — the repo holds **zero secrets**)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `preview` | the usual Astro trio |
| `npm run check` | `astro check` type/diagnostic pass |
| `npm run wp:export` | regenerate `src/content/**` from `content-inventory.json` |
| `npm run sync:releases` | refresh `src/data/releases.json` from GitHub Releases |
| `npm run sync:instagram` | refresh Instagram data from the Worker (fail-safe no-op) |
| `npm run redirects` | regenerate `cloudflare-redirects.csv` from `url-map.json` |
| `node scripts/check-dist.mjs` | audit `dist/` for legacy links + broken internal refs |
| `node scripts/assert-redirects.mjs` | post-cutover: assert 301s against production |

## URL contract (short version)

Old WordPress query-string URLs (`/?p=941`, `/?page_id=184`, `/?tag=ai`, …) 301 to the
new scheme (`/blog/{slug}/`, `/tags/{tag}/`, `/apps/{slug}/`, …) via Cloudflare Bulk
Redirects generated from [url-map.json](url-map.json), with a JS shim on the homepage as
belt-and-braces. `/wp-content/uploads/**` is mirrored byte-identical — never restructure
it; social posts hotlink those paths.

## Workflows

- `deploy.yml` — build + Pages deploy on push to `main`, plus a nightly rebuild
- `sync-releases.yml` / `sync-instagram.yml` — daily data sync, commit-if-changed
- `ig-health.yml` — weekly Instagram token expiry watchdog (opens an issue at T-14d)
- `ci.yml` — PR gate: `astro check`, build, dist audit, link check, Lighthouse budgets
  (mobile ≥ 90 perf / 95 a11y / 95 SEO)

All third-party actions are pinned to commit SHAs; `pull_request_target` is banned.
