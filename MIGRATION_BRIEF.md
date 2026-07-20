# MIGRATION_BRIEF.md

**Project:** mityjohn.com — WordPress → Astro on GitHub Pages
**Owner:** Jan Van Wassenhove (mITy.John)
**Status:** canonical spec. This file is the single source of truth for Claude Code (Fable) sessions.
**Rule:** if chat and this file disagree, this file wins. Update this file first, then implement.

---

## 0. Objective

Replace the WordPress installation at `mityjohn.com` with a statically generated site
hosted on GitHub Pages, without losing search ranking, inbound links, or image URLs.

Extend it with:
- an **Apps store** (downloads sourced from GitHub Releases / GitHub Pages demos)
- a **Books store** (entries linking out to Amazon KDP / Google Play Books)
- **Instagram** and **Spotify** integrations, built at build time, not client-side

Everything must be mobile-first.

---

## 1. Non-negotiables

| # | Constraint | Why |
|---|---|---|
| N1 | Every currently indexed URL resolves with a **301** to its new location | SEO + external references |
| N2 | `/wp-content/uploads/**` keeps working at the **identical path** | Instagram/LinkedIn/blog posts hotlink these |
| N3 | No API secrets in the repo or in client-side JS | static host, public repo |
| N4 | No runtime dependency on Instagram/Spotify APIs | site must render if an API is down |
| N5 | Mobile-first; Lighthouse mobile ≥ 90 across all four categories | |
| N6 | Build and deploy fully automated via GitHub Actions | no manual publish step |

---

## 2. Current state (verified 2026-07-18)

WordPress with **plain permalinks**. All public URLs are query strings:

```
https://mityjohn.com/?p=941          posts
https://mityjohn.com/?page_id=184    pages
https://mityjohn.com/?tag=ai         tag archives
http://mityjohn.com/?feed=rss2       RSS
```

**Consequence:** GitHub Pages ignores query strings entirely. `?p=941` would silently
serve the homepage. This is the central technical problem of the migration and is solved
in §5.

Known page IDs (from the live nav — verify against the full export):

| ID | Page |
|---|---|
| 2 | About mITy.John |
| 100 | Scrum Programming Language |
| 184 | Blog |
| 219 | Music Agent |
| 481 | Typix |
| 514 | mITyStudio |
| 546 | Hipster |
| 591 | Artist |
| 640 | Sports Madness |
| 706 | mITyGuitar |
| 760 | LoveFlix |
| 771 | mITyStories |
| 790 | mITyFighter |
| 830 | mITyLaundry |
| 841 | mITyLex |
| 853 | PiBeat |
| 899 | Books |
| 901 | Children (books) |
| 902 | Reimagining Series (books) |
| 951 | Ghosts in the Machine |
| 960 | Games |

Current information architecture: **Blog / Music / Games / Books / Fun / SCRUM / About**.
This is the *starting point*, not a commitment — Phase 1 formally confirms or amends it,
since the move to an apps/books store model may turn Games and Fun into filters rather
than sections.

### 2.1 Extraction findings (REST payload inspected 2026-07-18)

`https://mityjohn.com/?rest_route=/wp/v2/posts&per_page=100` returns valid JSON. Five
findings that the migration scripts must handle explicitly:

**F1 — Categories exist and were not visible on the homepage.**
The homepage renders a *tag* cloud, but posts also carry categories:
`development` (7), `ai` (13), `fun` (25), `music` (37) observed so far. Tags observed:
`ai` (19), `music` (21). Several posts have `tags: []` but a populated `categories`.
Pull `/wp/v2/categories` as well as `/wp/v2/tags`. **Decision D7 below.**

**F2 — Some slugs are numeric garbage.**
Post 921 has `"slug": "921"` — the title is *"When a cat makes you publish you're first
picture book"*. Slugs are **not** trustworthy as-is. The export script must:
- flag any slug matching `^\d+$` or shorter than 3 chars
- regenerate from `title.rendered` (slugify, strip HTML entities, cap ~60 chars)
- write both `wpSlug` and final `slug` to frontmatter so the mapping stays auditable

**F3 — Post bodies contain query-string internal links.**
Observed: `href="https://mityjohn.com/?p=553"` and `href="https://mityjohn.com/?page_id=901"`,
carrying `data-type` / `data-id` attributes. These must be **rewritten at conversion
time** using `url-map.json`. Internal links must resolve directly, never via a redirect
hop.

**F4 — Uploads mirror must include every generated size variant.**
Content references WordPress-generated derivatives inside `srcset`:
`logo_title-300x100.png`, `-768x256.png`, `-1024x576.png`, `-1536x864.png`, `-2048x820.jpg`.
Mirroring only originals breaks `srcset`. Mirror `/wp-content/uploads/**` **complete**.

**F5 — Comments are closed site-wide.**
`comment_status: "closed"` on all inspected posts. Giscus is therefore net-new
functionality with no legacy comments to migrate. Confirm by checking whether
`/wp/v2/comments` returns anything before assuming zero.

**Also note:** `_fields` is honoured by WordPress but some proxies drop it. Paginate with
`&page=N` and read the `X-WP-TotalPages` response header rather than guessing. `per_page`
caps at 100.

Third-party embeds in use: Spotify artist `4lRudVkciTQ8j2bEySXqPz`, Instagram feed
plugin (`@mity.john`), Smart Slider 3 ("Fresh from the lab" carousel).

---

## 3. Target stack

- **Astro** (latest LTS), TypeScript, content collections
- `astro.config.mjs`: `site: 'https://mityjohn.com'`, `trailingSlash: 'always'`, `build.format: 'directory'`
- Styling: Tailwind, driven by tokens exported from Claude Design
- Zero client-side JS by default; islands only where genuinely interactive
- Hosting: GitHub Pages (`gh-pages` via Actions artifact deploy)
- CDN/redirects: **Cloudflare free plan**, DNS proxied, in front of GitHub Pages
- Images: `astro:assets` for new content; legacy uploads served untouched
- **Comments:** Giscus, backed by GitHub Discussions in this repo. Blog posts only. Lazy-loaded iframe, below the fold, never render-blocking.
- **Analytics:** Cloudflare Web Analytics only. Cookieless, so **no consent banner is required** — do not add a CMP. Google Analytics / Site Kit is **not** carried over.
- **Search Console:** retained and mandatory. It is the instrument for Phase 7 monitoring and is independent of the analytics choice.
- **RSS:** yes, at `/feed/` and `/rss.xml`. **No newsletter, no signup form, no email capture** — do not build one.

**Do not** ship the Claude Design HTML export as the site. It is the design system and
visual reference. Rebuild it as Astro components.

---

## 4. Repository layout

```
mityjohn-site/
├─ .github/workflows/
│  ├─ deploy.yml            # build + deploy to Pages
│  ├─ sync-instagram.yml    # daily
│  └─ sync-releases.yml     # daily + on repository_dispatch
│  # sync-spotify.yml — NOT in v1, see §8.2
├─ design/                  # Claude Design output — REFERENCE ONLY, never built
│  ├─ handoff/              # export, verbatim
│  ├─ archive/              # .zip export, durable snapshot
│  ├─ tokens.css            # extracted — the only file src/ may import
│  ├─ implied-schema.md     # fields each designed template needs (Phase 0)
│  └─ README.md             # incl. the §15 template mapping table
├─ content-model.json       # wpId → target type + slug (Phase 2)
├─ gap-list.md              # design/content mismatches + resolutions (Phase 2)
├─ scripts/
│  ├─ wp-export.mjs         # one-shot: WP → markdown + url-map
│  ├─ fetch-instagram.mjs
│  ├─ fetch-releases.mjs
│  └─ build-redirects.mjs   # url-map.json → Cloudflare Bulk Redirect CSV
├─ workers/
│  └─ instagram/            # Cloudflare Worker: token custody + media cache
│     ├─ src/index.ts
│     └─ wrangler.toml      # secrets via `wrangler secret put`, never committed
├─ src/
│  ├─ content/
│  │  ├─ blog/              # md, frontmatter carries wpId
│  │  ├─ apps/
│  │  ├─ books/
│  │  └─ pages/
│  ├─ data/                 # generated JSON, committed
│  │  ├─ instagram.json
│  │  ├─ spotify.json
│  │  └─ releases.json
│  ├─ components/
│  ├─ layouts/
│  └─ pages/
├─ public/
│  ├─ wp-content/uploads/** # copied verbatim — DO NOT restructure
│  ├─ CNAME
│  └─ robots.txt
├─ url-map.json             # generated, committed, source for Cloudflare rules
└─ MIGRATION_BRIEF.md
```

---

## 5. URL contract

### 5.1 New scheme

| Type | Pattern |
|---|---|
| Home | `/` |
| Blog index | `/blog/` |
| Post | `/blog/{slug}/` |
| Tag | `/tags/{tag}/` |
| ~~Category~~ | *removed — flattened into tags per D7* |
| App | `/apps/{slug}/` |
| Books index | `/books/` |
| ~~Book~~ | *`/books/{slug}/` dropped in v1 — books link out (Amazon); no legacy URL maps here. See gap-list.md G2.* |
| Static page | `/{slug}/` |
| RSS | `/feed/` **and** `/rss.xml` (identical content) |
| Sitemap | `/sitemap-index.xml` |

Trailing slashes are mandatory and consistent. Never emit both `/blog/x` and `/blog/x/`.

### 5.2 url-map.json

Generated by `scripts/wp-export.mjs`, committed, regenerated whenever content moves.

```json
[
  { "type": "post", "wpId": 941, "old": "/?p=941",       "new": "/blog/ghosts-in-the-machine/" },
  { "type": "page", "wpId": 184, "old": "/?page_id=184", "new": "/blog/" },
  { "type": "tag",  "wpTag": "ai", "old": "/?tag=ai",    "new": "/tags/ai/" },
  { "type": "feed", "old": "/?feed=rss2",                "new": "/feed/" }
]
```

Every post and page frontmatter carries `wpId:` so this file is **derived**, never
hand-maintained.

### 5.3 Cloudflare redirects (primary mechanism)

Cloudflare free plan. Proxy DNS (orange cloud) with GitHub Pages as origin.

**Corrected 2026-07-19.** This section originally specified Bulk Redirects for
everything. That does not work: **Cloudflare Bulk Redirects cannot match a query
string in the source URL**, and 110 of the 112 legacy URLs are query strings
(`/?p=941`, `/?page_id=2`, `/?tag=ai`). Redirect Rules would need one rule per
mapping, far past the free-plan limit. The split is now:

- **`workers/redirects/`** — a Worker on route `mityjohn.com/` (root path only)
  serves all 110 query-string redirects from a generated lookup table. Regenerate
  with `node scripts/build-worker-redirects.mjs`, deploy with `wrangler deploy`.
  Unrecognised query strings (`?utm_source=…`) fall through to the origin, and a
  same-zone `fetch()` cannot re-enter a Worker route, so there is no loop.
- **Bulk Redirects** — only the two path-based rules (`/feed/`, `/feed`), from
  `scripts/build-redirects.mjs`. The CSV must have **no header row**; Cloudflare
  reads the first line as data.
- Status **301**, preserve query string **off**, subpath matching **off**

Both require the orange cloud: a Worker route only sees traffic that is proxied.

Also configure at Cloudflare: Always Use HTTPS, Automatic HTTPS Rewrites, and a redirect
from `www.mityjohn.com` → apex.

### 5.4 JS shim (secondary, belt-and-braces)

`src/pages/index.astro` includes a small inline script: if `location.search` contains
`p`, `page_id`, `tag` or `feed`, look it up in an inlined compact map and
`location.replace()` to the new URL. Runs before paint. This covers anything Cloudflare
misses and any direct-to-origin traffic. It is **not** a substitute for §5.3.

### 5.5 Assets

`/wp-content/uploads/**` is copied into `public/` at the identical path. No renaming, no
folder restructuring, no format conversion. New content uses `src/assets/` and
`astro:assets`.

---

## 6. Phases and acceptance criteria

**This project is design-led.** The Claude Design work already exists and is the starting
point. The content model is *derived from* the design, not the other way round. Phases 0
and 1 run in parallel; Phase 2 reconciles them.

### Phase 0 — Design intake

The design is the primary input. Nothing is invented that the design does not show.

1. Export from Claude Design into `design/` per §15 — handoff bundle into
   `design/handoff/`, `.zip` into `design/archive/`.
2. Extract `design/tokens.css` (colour, type scale, spacing, radii, shadows).
3. Fill in the **§15 template mapping table**: every exported screen → its Astro target.
4. **Derive the implied content model.** Read the designed screens and write down, for
   each, the fields they render. An app card showing a version pill, a platform badge row
   and a download button implies `version`, `platforms[]`, `downloadUrl`. Output
   `design/implied-schema.md`.
5. **Derive the implied IA** from the designed navigation and index pages — sections,
   filters, sort orders, what the store looks like. This supersedes §2's description of
   the current WordPress IA.

**Done when:** `design/` is populated, the mapping table is complete with no unmapped
screens, and `implied-schema.md` lists every field every template needs.

### Phase 1 — Content inventory (parallel with Phase 0)

Pure extraction. No modelling, no design decisions.

1. Export content via the REST API using the **query-string route form**, which is what
   works under plain permalinks:
   ```
   https://mityjohn.com/?rest_route=/wp/v2/posts&per_page=100
   https://mityjohn.com/?rest_route=/wp/v2/pages&per_page=100
   https://mityjohn.com/?rest_route=/wp/v2/tags&per_page=100
   https://mityjohn.com/?rest_route=/wp/v2/categories&per_page=100
   https://mityjohn.com/?rest_route=/wp/v2/media&per_page=100
   ```
   Paginate with `&page=N`, reading `X-WP-TotalPages`. Fallback: WP Admin → Tools →
   Export → All content (WXR XML).
2. Mirror `/wp-content/uploads/**` complete, including every `srcset` derivative (F4).
   Derive the file list from content + `/wp/v2/media` rather than directory listing.
3. Capture the existing `sitemap.xml` as the authoritative list of indexed URLs.
4. Pull top landing pages and queries from Search Console — these redirects get verified
   individually at cutover.

**Done when:** `content-inventory.json` and a complete local `uploads/` exist, reconciled
against the sitemap. **No `url-map.json` yet** — it is not computable until Phase 2.

### Phase 2 — Reconciliation: content model & URL map

Where the design meets the actual content. This is the phase that catches the expensive
surprises, and it produces three artifacts.

1. **Classify every page and post** against the design's IA. Output `content-model.json`:
   ```json
   { "wpId": 514, "wpType": "page", "title": "mITyStudio",
     "target": "apps", "slug": "mitystudio" }
   ```
   Targets: `blog` · `apps` · `books` · `page` · `merge` · `retire`.

   Expected reclassifications — WordPress pages that become collection entries:
   mITyStudio (514), mITyGuitar (706), PiBeat (853), Music Agent (219), mITyFighter (790),
   Hipster (546), Ghosts in the Machine (951), LoveFlix (760), mITyStories (771),
   Typix (481), Sports Madness (640), mITyLaundry (830), mITyLex (841). Books:
   Children (901), Reimagining Series (902). Section landings Games (960), Books (899)
   and the Music parent likely become collection **indexes**, not content.

2. **Produce the gap list** — the highest-value output of this phase. Two directions:
   - *Design asks, content lacks*: the app card wants a `version` and a screenshot gallery
     that no WordPress page contains. Each gap needs a decision: author it now, derive it
     (e.g. version from GitHub Releases), or drop it from the design.
   - *Content has, design ignores*: fields or whole pages the design has no home for.
     Each needs a target or an explicit `retire`.

   Output `gap-list.md`. **Nothing proceeds to Phase 3 with open gaps.**

3. **Finalise schemas** from `design/implied-schema.md` plus the gap resolutions. These
   become the Astro `content.config.ts` definitions in Phase 4.

4. **Produce `url-map.json`** from `content-model.json`. Only now is it computable.

**Done when:** every ID in `content-inventory.json` has a target and final slug, the gap
list is empty of unresolved items, schemas are agreed, and `url-map.json` validates —
no duplicate targets, no orphans, every sitemap URL covered.

### Phase 3 — Scaffold

Astro project, Tailwind wired to `design/tokens.css`, layouts and components rebuilt from
the handoff bundle per the §15 mapping table, content collections defined from the Phase 2
schemas, `deploy.yml` green, site live at the `github.io` URL with placeholder content.

**Rebuild as Astro components — do not wrap the exported HTML (§15 rule 5).**

**Done when:** a placeholder page deploys automatically on push to `main`, and every
template in the §15 mapping table exists and renders with fixture data.

### Phase 4 — Content migration

`scripts/wp-export.mjs`: WP HTML → Markdown (turndown or rehype pipeline), rewrite image
paths to `/wp-content/uploads/...`, strip WordPress shortcodes and plugin wrappers
(Smart Slider, Instagram Feed), emit frontmatter including `wpId`, `date`, `tags`,
`ogImage`.

**Done when:** every post and page renders, `url-map.json` is complete, all slugs pass the
F2 audit, no query-string internal links remain in any built page (grep `dist/` for
`?p=` and `?page_id=`), every `srcset` candidate resolves, and no broken internal links
(`lychee` or `linkinator` in CI).

### Phase 5 — Integrations

Instagram (§7), Spotify (§8), GitHub Releases (§9). All three are build-time; each
component renders gracefully from stale or empty JSON.

**Done when:** the three sync workflows run green and the site builds with the network
blocked.

### Phase 6 — Stores

Apps and Books content collections with schemas. App pages show version, release date,
platform badges, changelog excerpt, and a download button pointing at the latest release
asset. Book pages show cover, blurb, language editions, and buy links.

**Done when:** every app and book from the current site has an entry and every outbound
link resolves.

### Phase 7 — Cutover

1. Verify the build on the `github.io` URL end to end.
2. Add `CNAME`, point DNS at GitHub Pages, enable Enforce HTTPS, wait for the cert.
3. Put Cloudflare in front, import the Bulk Redirect list, test 20 sampled old URLs for a
   literal `301` and correct `Location`.
4. Submit `sitemap-index.xml` in Search Console; use "Validate fix" on any old URLs
   flagged.
5. Keep the WordPress install **switched off but not deleted** for 30 days.
6. Monitor Search Console Coverage and Performance weekly for 8 weeks.

**Done when:** zero unexpected 404s in Search Console after 14 days and impressions have
recovered to baseline.

---

## 7. Instagram integration

`@mity.john`. The old Basic Display API is retired; use the **Instagram API with
Instagram Login** (Graph, `graph.instagram.com`). Verify current endpoint details against
Meta's developer docs before implementing — this API changes often.

Per D10 the credentials live in a **Cloudflare Worker**, never in GitHub. Architecture and
custody rules are in §11.4; this section covers implementation.

### 7.1 One-off manual setup

1. developers.facebook.com → create an app → add the **Instagram** product.
2. Note the **Instagram App ID** and **Instagram App Secret**.
3. Add an OAuth redirect URI (localhost is fine for a one-time token grab).
4. Run the OAuth flow once with scopes for reading your own media → **short-lived token**.
5. Exchange for a **long-lived token** (~60 days).
6. `wrangler secret put IG_APP_ID` / `IG_APP_SECRET` / `IG_TOKEN` — into **Cloudflare**,
   not GitHub. After the Worker's first run, KV is authoritative for the token.

### 7.2 Worker: `workers/instagram/`

- KV namespace `IG` holding `token`, `token_expires`, `media`
- Cron trigger, daily:
  - `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=…`
    → write new token + expiry to KV
  - `GET https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12&access_token=…`
    → normalise to the whitelisted shape, write to KV
- `GET /instagram` → cached media JSON. Public, read-only. **Never returns the token.**
- `GET /health` → `{ tokenExpiresIn: <days>, lastSync: <iso> }`
- Refresh requires the token to be ≥24h old and unexpired; skip rather than fail if not.

### 7.3 `scripts/fetch-instagram.mjs` (no credentials)

- `GET https://<worker>/instagram` — a public URL, safe to hardcode
- Download each `media_url` / `thumbnail_url` into `public/instagram/` and rewrite the
  JSON to the **local** copies. Instagram CDN URLs are signed and expire; never link them.
- Truncate captions to ~180 chars for the card; keep the full caption as `alt`
- Write `src/data/instagram.json`
- **On any error: exit 0, leave the existing JSON untouched.** A failed sync must never
  break a deploy.

### 7.4 Monitoring

Weekly workflow calls `/health`; opens a GitHub issue if `tokenExpiresIn < 14` or
`lastSync` is older than 72h. In normal operation this never fires.

---

## 8. Spotify integration

Artist ID `4lRudVkciTQ8j2bEySXqPz`.

### 8.1 Embed (keep it — this is the current player, unchanged)

The `open.spotify.com/embed/artist/…` iframe requires no auth, no secrets, no workflow,
and self-updates when new music is released. It is carried over from WordPress as-is.

**Mandatory: click-to-load.** Render a static poster (artist image + play affordance) and
only inject the iframe on click.

Two reasons, and the second is not optional:
1. Performance — the embed is a heavy third-party payload against a mobile budget.
2. **Consent.** The Spotify iframe sets third-party cookies. Per D5 the site is
   deliberately cookieless so that **no consent banner is required**. An auto-loading
   embed would silently break that and drag a CMP back onto the site. Nothing loads
   until the visitor acts. **Do not "optimize" this into an eager iframe.**

### 8.2 Native release cards — DEFERRED, not cancelled

Not in v1. See §11.3: this is the only reason the project would hold Spotify credentials,
and the embed already covers the core need.

Deferring costs nothing and loses nothing that exists today. What it defers is *additive*:
release artwork rendered in the site's own design system, a "latest release" block usable
outside the artist page, and crawlable release text (iframe content is not indexed as
your content). Adding it later is one JSON file plus a component — no rework, no
migration impact.

When it is picked up: only **public** artist data is needed, so the **Client Credentials**
flow is sufficient — no user login, no refresh-token dance.

1. developer.spotify.com/dashboard → create an app → note Client ID and Client Secret.
2. Secrets go in the **Cloudflare Worker**, consistent with §11.4 — not in the repo:
   `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`.
3. `scripts/fetch-spotify.mjs`:
   - `POST https://accounts.spotify.com/api/token` with `grant_type=client_credentials`
     and a Basic auth header → access token (1 hour, fetched fresh each run, never stored)
   - `GET https://api.spotify.com/v1/artists/{id}` → name, followers, genres, image
   - `GET https://api.spotify.com/v1/artists/{id}/albums?include_groups=album,single&limit=20&market=BE`
   - cache album artwork locally into `public/spotify/`
   - write `src/data/spotify.json`
   - on error: exit 0, keep previous JSON

Only if you later want *personal* listening data (recently played, your playlists) do you
need the Authorization Code flow and a stored refresh token. Not in scope.

---

## 9. GitHub Releases integration (Apps store)

`scripts/fetch-releases.mjs`, build-time, unauthenticated calls are enough for public
repos but pass `GITHUB_TOKEN` to raise the rate limit.

- For each app entry with a `repo:` field:
  `GET https://api.github.com/repos/janvanwassenhove/{repo}/releases/latest`
- Extract: `tag_name`, `published_at`, `body` (changelog), and per-asset
  `name` / `browser_download_url` / `size` / download count
- Map asset filename patterns to platform badges (`.exe`/`.msi` → Windows, `.dmg` → macOS,
  `.AppImage`/`.deb` → Linux, `.apk` → Android)
- Write `src/data/releases.json`
- Apps without releases fall back to a "View on GitHub" / "Open demo" CTA

---

## 10. GitHub Actions

### 10.1 `deploy.yml`

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '30 5 * * *'   # nightly rebuild so synced data goes live
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

### 10.2 Sync workflows (same shape for Instagram / Spotify / Releases)

```yaml
name: Sync Instagram
on:
  schedule:
    - cron: '0 4 * * *'
  workflow_dispatch:
permissions:
  contents: write
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: node scripts/fetch-instagram.mjs
        env:
          IG_WORKER_URL: https://ig.mityjohn.workers.dev/instagram   # public, not a secret
      - name: Commit if changed
        run: |
          git config user.name  "mITy.Bot"
          git config user.email "bot@mityjohn.com"
          git add src/data/instagram.json public/instagram
          git diff --staged --quiet || git commit -m "chore: sync instagram"
          git push
```

Sync jobs commit to `main`, which triggers `deploy.yml`. Keep the nightly `schedule` on
deploy as a safety net in case nothing changed but a rebuild is still wanted.

### 10.3 Quality gate (`ci.yml`, on pull requests)

- `astro check` + `tsc --noEmit`
- link checker across `dist/`
- Lighthouse CI, mobile preset, budget: performance ≥ 90, a11y ≥ 95, SEO ≥ 95
- redirect assertion script: sample N entries from `url-map.json`, assert 301 + Location
  (runs against production, post-cutover only)

---

## 11. Secrets and workflow security

### 11.1 Threat model

GitHub Pages never has access to secrets. It serves the `dist/` artifact and nothing
else. All exposure risk lives in the Actions layer.

| Secret | Location | Used by | Blast radius if leaked | Rotation |
|---|---|---|---|---|
| `IG_APP_ID` / `IG_APP_SECRET` | **Cloudflare Worker** | token refresh | Requires the token too; app-level only | Regenerate in Meta app |
| `ig_token` | **Cloudflare KV** | Worker | Read-only access to own IG media, ≤60 days | Auto-refreshed daily |
| `GITHUB_TOKEN` | auto-provisioned | sync-releases | Job-scoped, expires with the run | n/a |

**The repository stores no secrets.** Spotify needs none (§8.1 embed only, §8.2 deferred).
GitHub Releases calls work unauthenticated for public repos. Instagram credentials live in
Cloudflare per §11.4.

### 11.2 Hard rules

- **R1** — `pull_request_target` is forbidden. `pull_request` from forks correctly
  withholds secrets; `pull_request_target` runs base-repo workflows against untrusted
  head code with secrets in scope. This is the standard public-repo exfiltration path.
- **R2** — Secrets are read only inside `scripts/`. Never in `src/`, never in
  `astro.config.mjs`. **Astro inlines any `PUBLIC_*` env var into the client bundle** —
  no secret may ever carry that prefix.
- **R3** — Never log request objects, headers, or raw responses in a step holding
  secrets. GitHub masks exact secret values but **not derived ones**: Spotify's
  `base64(client_id:client_secret)` Basic auth header is not masked. No `set -x`.
- **R4** — Pin third-party actions to a full commit SHA, never a floating tag. Any
  action in a step with secrets in scope can read them.
- **R5** — Sync scripts write only whitelisted fields to `src/data/*.json`. Never
  serialize an API response wholesale; a token or signed URL can ride along.
- **R6** — Grant `permissions:` per job at the minimum required. Never
  `permissions: write-all`.
- **R7** — Add a secret-scanning pre-commit hook (gitleaks) and enable GitHub secret
  scanning + push protection on the repo.

### 11.3 Surface reduction (preferred over management)

- The Spotify **iframe embed requires no auth at all**. Ship §8.1 only and defer §8.2;
  that removes two secrets for a feature that may not be missed. Revisit later.
- GitHub Releases calls work unauthenticated for public repos; `GITHUB_TOKEN` only
  raises the rate limit and is auto-provisioned, so it adds no stored secret.
- Net result: **one stored secret** (the IG token) plus optionally its refresh PAT.

### 11.4 Instagram token custody — Cloudflare Worker broker (D10, closed)

The token does **not** live in GitHub. It lives in Cloudflare, which is already part of
the stack per D1. This eliminates the last stored secret from the repository.

**Architecture**

```
Instagram Graph API
        ↑ (cron: refresh token, fetch media)
Cloudflare Worker  ──  KV namespace: { ig_token, ig_media, ig_expires }
        ↓ (public, read-only JSON)
GitHub Action (no secrets)  →  src/data/instagram.json  →  commit  →  build
```

**Worker responsibilities**

1. **Cron trigger, daily.** Call `refresh_access_token`, write the new 60-day token to KV.
   Because it runs daily and the token is valid for 60, missing runs is harmless.
2. **Cron trigger, daily.** Fetch `/me/media`, normalise to a whitelisted shape
   (`id, caption, permalink, media_type, media_url, thumbnail_url, timestamp`), store in KV.
3. **`GET /instagram`** — return the cached media JSON. Public, read-only, no auth.
   Never returns the token. CORS restricted to `mityjohn.com` (defence in depth; the
   payload is public content anyway).
4. **`GET /health`** — return `{ tokenExpiresIn: <days> }` so expiry is monitorable.

**Worker secrets** are set via `wrangler secret put` and stored in Cloudflare, never in
git: `IG_APP_ID`, `IG_APP_SECRET`, and the bootstrap `IG_TOKEN` (written to KV on first
run, after which KV is authoritative).

**GitHub Action** holds no credentials. It fetches the public Worker endpoint, caches
images locally into `public/instagram/`, writes `src/data/instagram.json`, and commits.
Delay of up to 24h is acceptable and expected.

**Failure behaviour.** If the Worker is unreachable or returns stale data, the Action
exits 0 and leaves the previous JSON in place. The site never breaks because Instagram did.

**Monitoring.** A weekly workflow calls `/health`; if `tokenExpiresIn < 14`, it opens a
GitHub issue. This is the only manual escape hatch and should never fire in normal
operation.

**Net result: the repository contains zero stored secrets.** `GITHUB_TOKEN` is
auto-provisioned and job-scoped; nothing else is required.

### 11.5 Repository visibility (D9, closed: public, solo maintainer)

Public repo, Jan is the only contributor. Because the repo holds no secrets (§11.1) the
exposure is minimal, but a public repo still accepts fork PRs from anyone, so configure:

- Settings → Actions → **Require approval for all outside collaborators** (fork workflow
  runs do not execute without approval)
- Settings → Actions → Workflow permissions → **Read repository contents by default**;
  grant `contents: write` per job only where a sync commits
- Branch protection on `main`: require the CI check to pass. Allow self-merge — a solo
  maintainer requiring review of themselves is theatre.
- Enable **secret scanning + push protection** and **Dependabot** alerts
- `.gitignore`: `.env`, `.dev.vars` (Wrangler local secrets), `*.pem`

R1–R7 remain mandatory regardless.

---

## 12. Definition of done

- [ ] All Phase 0–7 acceptance criteria met
- [ ] 20 sampled legacy query-string URLs return 301 to the correct target
- [ ] Every `/wp-content/uploads/**` URL referenced by an existing social post still resolves
- [ ] Lighthouse mobile ≥ 90 / 95 / 95 / 95 on home, a blog post, and an app page
- [ ] Site builds successfully with the network disabled
- [ ] RSS validates at both `/feed/` and `/rss.xml`
- [ ] Giscus renders on blog posts and a test comment round-trips to GitHub Discussions
- [ ] Cloudflare Web Analytics reporting; no consent banner present anywhere on the site
- [ ] No `gtag`, `analytics.js` or Site Kit remnants in any built page
- [ ] 12 months of legacy GA data exported to CSV and archived
- [ ] No workflow uses `pull_request_target`; all third-party actions pinned to SHA
- [ ] `grep -r "PUBLIC_" src/` returns no secret-bearing variable
- [ ] Built `dist/` scanned with gitleaks — clean
- [ ] Instagram token expiry warning fires correctly at T-14 days
- [ ] Sitemap submitted; Search Console clean after 14 days
- [ ] WordPress instance archived (full DB + uploads backup retained offline)

---

## 13. Decisions (all closed)

| # | Decision | Outcome |
|---|---|---|
| D1 | CDN / redirects | **Cloudflare free plan** in front of GitHub Pages |
| D2 | Static site generator | **Astro** |
| D3 | "Fresh from the lab" carousel | **Superseded** — replaced by the Claude Design homepage treatment |
| D4 | Comments | **Superseded 2026-07-20 — dropped entirely.** Originally: Giscus on GitHub Discussions, blog posts only. Jan chose to drop comments for the new site, so the scaffold was removed rather than left disabled. Nothing to migrate: F5 confirmed comments were closed site-wide on WordPress. |
| D5 | Analytics | **Cloudflare Web Analytics only.** No GA4, no Site Kit, no consent banner. Search Console retained separately. Export 12 months of GA history to CSV before decommissioning WordPress. |
| D6 | Newsletter | **Dropped.** RSS only. Do not build signup forms or email capture. |
| D7 | Taxonomy | **Tags only.** Categories are flattened into tags. Legacy `?cat=N` and `?category_name=x` URLs redirect to `/tags/{slug}/`; where a category has no tag equivalent, create the tag. |
| D8 | Slug policy | **Regenerate from title** for any slug that is numeric, under 3 chars, or otherwise non-descriptive. SEO is preserved by the 301 (§5.3), not by the slug — the two are independent. |
| D9 | Repository visibility | **Public**, Jan sole contributor. Hardening per §11.5. |
| D10 | Instagram token custody | **Cloudflare Worker broker** (§11.4). Token never enters GitHub. Daily refresh, ≤24h content delay accepted. Repo holds zero secrets. |

### Reopened by the extraction findings

*(All resolved — retained for traceability.)*

---

## 14. Ownership: Claude Code vs Jan

Claude Code (Fable) does the build and the data work. Jan does everything that requires a
browser login, a dashboard, or an irreversible decision.

### Claude Code does

- `scripts/wp-export.mjs` — call the REST API, paginate, convert HTML → Markdown, run the
  F2 slug audit, rewrite F3 internal links, emit frontmatter and `url-map.json`
- **Mirror the uploads directory without FTP:** collect every image URL from post/page
  bodies (including all `srcset` candidates, per F4) plus `/wp/v2/media`, dedupe, and
  download each into `public/wp-content/uploads/` preserving paths. Directory listing is
  usually disabled; deriving the file list from content is the robust route.
- Scaffold and build the Astro site from the design system and the §15 mapping table
- Write the Cloudflare Worker (§7.2) and the GitHub Actions workflows (§10)
- Generate the Cloudflare Bulk Redirect CSV from `url-map.json`
- Run local builds, link checking, Lighthouse, and the redirect assertion script

### Jan does

- Create the Meta app and run the one-off Instagram OAuth flow (browser)
- `wrangler login` and `wrangler secret put` (Claude Code can run these once authenticated)
- Cloudflare dashboard: DNS, proxy on, import the Bulk Redirect list, enable Web Analytics
- DNS change at the registrar
- GitHub repo settings: Pages source, secret scanning, branch protection, Actions approval
  policy (§11.5)
- Search Console: submit the sitemap, validate fixes
- Export 12 months of legacy GA data before decommissioning
- **The cutover decision itself**, and switching WordPress off

### How to run the sessions

One phase per session. Open with: *"Read MIGRATION_BRIEF.md. Execute Phase N only. Stop at
the acceptance criteria and report against them."* Do **not** ask for "migrate my site" in
one go — the phase gates exist so that a bad conversion is caught at Phase 4 rather than
discovered at cutover.

Update this file first when something changes, then implement. Chat scrollback is not the
spec.

### Session order for a design-led build

| Session | Phase | Opening instruction |
|---|---|---|
| 1 | 0 | "Read MIGRATION_BRIEF.md. Execute Phase 0. The design in `design/handoff/` is the source of truth — derive the implied schema and IA from it, do not invent." |
| 2 | 1 | "Execute Phase 1 only. Extraction only — no modelling." |
| 3 | 2 | "Execute Phase 2. Reconcile the design's implied schema against the extracted content. Produce the gap list and stop — do not resolve gaps unilaterally." |
| 4 | 3 | "Execute Phase 3 only." |
| … | 4–7 | one phase per session |

Session 3 is the one that needs Jan in the loop: gap resolutions are product decisions,
not implementation details.

---

## 15. Design folder contract

The Claude Design output is the **visual contract**, not the codebase.

### Rules

1. Lives at `design/` in the repo root. Astro only builds `src/pages`, so this folder is
   inert by default — no exclusion config needed. It **is** committed to git.
2. `design/handoff/` holds the Claude Design export verbatim. Never edit it by hand. If
   the design changes, re-export and replace the folder wholesale.
3. `design/archive/` holds a plain `.zip` export taken at the same moment. The handoff
   bundle is optimized for a live session; the zip is the durable snapshot you can diff
   against months later.
4. `design/tokens.css` — colours, type scale, spacing, radii, shadows — is extracted from
   the handoff bundle and is **the only file `src/` is permitted to import from
   `design/`**.
5. **Do not build the site from the exported HTML.** Rebuild every template as an Astro
   component. A wrapped HTML export produces an untemplatable wall of divs and is grounds
   for rejecting the phase.
6. `design/README.md` states, at the top: *"Reference only. Do not build from these files.
   See MIGRATION_BRIEF.md §15."*

### Template mapping (required)

The export alone is not actionable — Fable needs to know which exported screen becomes
which Astro template. Maintain this table in `design/README.md` and fill it in **during Phase 0**. An unmapped screen is either a missing template or scope creep; both need
a decision, not a guess.

| Exported screen | Astro target | Notes |
|---|---|---|
| Home | `src/pages/index.astro` | also hosts the `?p=` JS shim (§5.4) |
| Blog index | `src/pages/blog/index.astro` | pagination behaviour? |
| Blog post | `src/layouts/Post.astro` | Giscus block below fold |
| Tag archive | `src/pages/tags/[tag].astro` | tags only, per D7 |
| App detail | `src/pages/apps/[slug].astro` | version + platform badges from `releases.json` |
| App card | `src/components/AppCard.astro` | |
| Books index | `src/pages/books/index.astro` | |
| Book detail | `src/pages/books/[slug].astro` | Amazon / Google Play CTAs |
| Static page | `src/layouts/Page.astro` | |
| Instagram grid | `src/components/InstagramGrid.astro` | reads `instagram.json` |
| Spotify block | `src/components/SpotifyEmbed.astro` | click-to-load poster, §8.1 |
| 404 | `src/pages/404.astro` | |
| Nav / footer | `src/components/` | IA per §2 |

Any screen in the export with no row here is out of scope for v1 — record it in
`design/README.md` under "Deferred" rather than silently building it.

Preferred, for ongoing iteration — connect the Claude Design MCP server so Claude Code
can pull designs directly:

```
claude mcp add --scope user --transport http claude-design https://api.anthropic.com/v1/design/mcp
```

One-off alternative — run Claude Code from inside the repo directory, then in Claude
Design use Export → **Send to Claude Code**. The handoff bundle lands in the working
directory; move it into `design/handoff/`.

Either way, also take the `.zip` export for `design/archive/`.

