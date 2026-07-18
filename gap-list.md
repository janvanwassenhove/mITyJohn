# gap-list.md — design ↔ content reconciliation (Phase 2)

Status: **no open items.** Every gap has a resolution recorded below.
Direction A = *design asks, content lacks*. Direction B = *content has, design ignores*.
Resolutions marked **[Jan]** were decided by Jan; the rest follow directly from the
design (source of truth for look/content) or the brief (source of truth for architecture).

| # | Dir | Gap | Resolution |
|---|---|---|---|
| G1 | A | **App detail template not designed.** The designed store cards link out (GitHub / demo / Info), but the URL contract (§5.1) requires `/apps/{slug}/` and the cards' own "Info" buttons need an internal target (the old WP app pages). | **Author it in Phase 3** from designed precedents: AppCard header art + action row on top of the prose Page layout, with WP app-page content as body. Version / release date / platform badges from `releases.json` render here (not on cards, which stay exactly as designed). |
| G2 | A | **Book detail pages (`/books/{slug}/`) exist in the URL contract but not in the design** — book cards go straight to Amazon/preview, and no per-book WP content exists to fill a detail page. | **Dropped from v1.** `/books/` index only; cards link out as designed. No legacy URL redirects to a book detail, so N1 is unaffected. §5.1 amended (see brief changelog note). Revisit when a book needs its own landing page. |
| G3 | B | **mITyGarden (page 883)** exists in WordPress but is missing from the design's 14 app cards and from the brief's §2 page table. | **Include as the 15th app card**, `cat: fun`, `/apps/mitygarden/`. Dropping published content silently would violate N1's spirit; the store grid is a template, not a fixed set. Home "stats" tile stays editorial. |
| G4 | B | **Posts 1 (`hello-world`) and 342 (`test`)** look like junk by slug, but content inspection (2026-07-18) shows both are real articles: "The battle of low-code solutions!" and "SCRUM Becomes 2!". | **Keep as blog posts; regenerate slugs per D8** → `the-battle-of-low-code-solutions`, `scrum-becomes-2`. Old URLs 301 to the new slugs. |
| G5 | B | **2 approved comments exist on post 1** (F5 was wrong: not zero). | **[Jan] Dropped.** Not migrated. Giscus starts fresh (D4). |
| G6 | B | **7 categories, not 4** (adds hockey, low-code, uncategorized). D7 flattens categories into tags. | All have tag equivalents already (`hockey`→`hockey`, `low-code`→`lowcode`); no new tags needed. `uncategorized` (0 posts) → `?cat=1` redirects to `/blog/`. Post frontmatter tags = union(tags, mapped categories). |
| G7 | B | **`?author=1`** is in the sitemap but has no content object. | Redirect to `/about/` (the site is single-author; the About page is the author page). |
| G8 | B | **Section pages Games (960), Books (899), Blog (184), Children (901), Reimagining Series (902)** are WP content pages; the design gives them no standalone home (store lives on the home page; books are one index). | `merge` targets: 184→`/blog/`, 899→`/books/`, 901/902→`/books/` (series become index groupings, matching the design's `series` field), 960→`/#apps` (the designed store section; Games is a filter per the implied IA). Any usable intro copy merges into the receiving index. |
| G9 | A | **Design's blog cards show no date/excerpt**, but blog index, post layout and RSS need dates. | Cards stay per design. Dates render on the post layout and feed only (data is in frontmatter regardless). |
| G10 | A | **Design's book covers are typographic** (no cover images), while real cover art exists in uploads. | Ship the designed typographic covers in v1. Real cover images are a content upgrade later — schema carries an optional `cover` field from day one. |
| G11 | A | **Design stat tiles** ("14 apps in the lab", "4+ books in print", …) are editorial claims content can't verify. | Keep editorial, maintained by hand in the home page content. Not derived. (14 → 15 after G3.) |
| G12 | A | **Design links Twitter** (`twitter.com/mity_john`) in the footer; brief never mentions it. | Keep as designed — it's an outbound link, zero cost. Jan can prune links in content later. |
| G13 | B | **Page 2 slug is `sample-page`**, page 219 slug is `music` (title "Music Agent"). | D8 regeneration: 2→`about`, 219→`music-agent`. Old query-string URLs 301 anyway. |
| G14 | B | **Smart Slider 3 carousel** ("Fresh from the lab") exists in WP content. | Already closed as D3: superseded by the design's homepage. Shortcode wrappers stripped at conversion (Phase 4). |

## Amendment to MIGRATION_BRIEF.md

Per G2, §5.1's `Book | /books/{slug}/` row is out of scope for v1. Recorded here and
flagged in the brief; the rest of the URL contract is unchanged.

## Final schemas (input for `content.config.ts`, Phase 3/4)

**blog** (`src/content/blog/*.md`)
`title` string · `date` ISO · `updated` ISO? · `tags` string[] (union of WP tags + D7-mapped categories) ·
`cover` path? (from post's first/featured image) · `ogImage` path? · `wpId` number · `wpSlug` string ·
`cardTag` string? (display form for the designed card, e.g. "Games · AI"; defaults to joined tags)

**apps** (`src/content/apps/*.md` — body = converted WP page content)
`name` string · `code` string (card badge) · `tag` string (card corner label) ·
`cat` enum music|games|fun|lab · `blurb` string · `repo` string? (GitHub repo name) ·
`demoUrl` url? · `order` number? · `wpId` number? · `wpSlug` string?
Derived at build: version/date/assets/platforms from `releases.json` keyed by `repo` (§9).

**books** (`src/content/books/*.md`)
`title` string · `series` string · `badge` string · `desc` string · `buy` url ·
`preview` url? (internal or external) · `cover` path? (G10, optional) · `order` number?

**pages** (`src/content/pages/*.md`)
`title` string · `description` string? · `wpId` number? · `wpSlug` string?
(Two entries: about, artist.)
