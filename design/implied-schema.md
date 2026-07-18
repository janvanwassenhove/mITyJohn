# Implied content model — derived from the Claude Design export (Phase 0)

Source: `design/handoff/mITyJohn.dc.html` (single screen: Home). Every field below is
rendered by a designed template; nothing here is invented. Where the brief expects a field
the design does **not** render, that is called out explicitly — those become Phase 2
gap-list items, not schema entries.

Sample values shown are the design's own placeholder content (useful as fixtures in
Phase 3, but they are design content, not migrated content).

---

## 1. App (store card) — collection `apps`

Rendered by the app card in the store grid.

| Field | Type | Rendered as | Example |
|---|---|---|---|
| `name` | string | card title (h3) | `mITyStudio` |
| `code` | string, short uppercase | badge centered in the card header art | `STUDIO` |
| `tag` | string | tiny uppercase label, top-left of header art | `music`, `game`, `fun`, `lab` |
| `cat` | enum `music \| games \| fun \| lab` | filter membership (chips: All · Music · Games · Fun · Lab) | `games` |
| `blurb` | string, ~1 sentence | card body copy | "Turns a game controller into an actual guitar. Your neighbours: thrilled." |
| `actions[]` | list of `{ label, href, primary? }` | button row at card bottom | see below |

Action buttons observed (each app has 2–4, first is the primary filled button):

| Label pattern | Meaning | Implied source field |
|---|---|---|
| `Get ↓` | download → GitHub **releases page** (`…/releases`) | `repo` (GitHub repo name under `janvanwassenhove/`) + flag that releases exist |
| `Web ↗` / `Play ↗` | live demo on GitHub Pages | `demoUrl` |
| `Code` | repository | `repo` |
| `Info` / `Post` | background page or blog post (currently `?page_id=N` / `?p=N`) | `infoRef` — internal link after Phase 2 URL mapping |

**Practical schema:** `name`, `code`, `tag`, `cat`, `blurb`, `repo?`, `demoUrl?`,
`infoRef?`, plus a derived "has releases" signal from `releases.json` (§9). The design
hardcodes button sets per app; deriving them (`repo` → Get/Code, `demoUrl` → Web/Play,
`infoRef` → Info) reproduces every observed combination.

**Not rendered by the design** (though the brief §6/§15 anticipated them): version pill,
release date, platform badges, changelog, download counts, screenshots. There is also **no
app detail page**. → gap list.

Design's full app inventory (14): mITyStudio, Music Agent, mITyGuitar, PiBeat (music) ·
Ghosts in the Machine, mITyFighter, Hipster (games) · LoveFlix, Sports Madness,
mITyStories, Typix, mITyLaundry, mITyLex (fun) · Scrum Programming Language (lab).

---

## 2. Book (store card) — collection `books`

Rendered by the bookstore grid card: a typographic 2/3 cover + text block below.

| Field | Type | Rendered as | Example |
|---|---|---|---|
| `title` | string | cover title + list title | `The Cat Who Curated` |
| `series` | string | tiny uppercase label, cover top | `Children · Picture book`, `Reimagining series`, `Coming soon` |
| `badge` | string | availability line, cover bottom (accent-2) | `Paperback · Kindle`, `Art book`, `In the oven` |
| `desc` | string, 1–2 sentences | list description | "A cat drags a small human through famous paintings…" |
| `buy` | URL | cover link + "Buy on Amazon" button | Amazon search/product URL |
| `preview` | URL | "Preview" button | currently `?page_id=901/902/899` → internal after Phase 2 |

**Not rendered by the design:** real cover images (covers are typographic), language
editions (brief Phase 6 expects them), price, ISBN, Google Play links (brief §0 mentions
Google Play Books; design only shows Amazon). **No book detail page.** → gap list.

---

## 3. Blog post (card) — collection `blog`

Rendered by the "Latest from the blog" card (also the pattern for `/blog/`, `/tags/`).

| Field | Type | Rendered as | Example |
|---|---|---|---|
| `title` | string | card title | "When a cat makes you publish your first picture book" |
| `tag` | string, display form, may be compound | mono accent label above title | `Games · AI`, `Books`, `Delivery · SDLC` |
| `slug` | string | image placeholder key → implies a **cover image** per post | `cat-book` |
| `href` | URL | whole card links to the post | `?p=921` → `/blog/{slug}/` after Phase 2 |

Implied frontmatter: `title`, `tags[]` (the card shows a joined display form), `cover`
(the 16/10 header area), `slug`. Migration adds `wpId`, `wpSlug`, `date`, `ogImage` per
brief §4/§F2 — the design neither shows nor forbids a date; the card renders **no date,
no excerpt, no author, no reading time**.

**Not designed:** the post page itself (body typography, headings, code blocks, images,
Giscus placement) and index pagination. → gap list.

---

## 4. Instagram tile — generated data `src/data/instagram.json`

| Field | Type | Rendered as | Example |
|---|---|---|---|
| `tag` | string | label at tile bottom-left | `#COBOL` |
| `href` | URL | tile links to the Instagram post | `https://www.instagram.com/p/DaJE6SZDOxd/` |

Tiles are square, 6 shown. The design uses placeholder art; the real integration (§7.3)
supplies `image` (local copy) + full caption as `alt` — compatible superset of the
designed shape. Whole section is conditional (`showInstagram`): render nothing when the
JSON is empty/stale (N4).

---

## 5. Quote — static content (component props)

| Field | Type | Rendered as | Example |
|---|---|---|---|
| `kicker` | string | uppercase display label | `Creative` |
| `text` | string | blockquote | "If it's a good idea, go ahead and do it…" |
| `who` | string | figcaption | `Grace Hopper` |
| `accent` | color | kicker/quote-mark/rule color | `#e0a44a` |
| `tint` | color (rgba) | card hover background | `rgba(224,164,74,0.08)` |

Three quotes, fixed content — component props or a small JSON, not a collection.

---

## 6. Site chrome — layout-level data

**Nav item:** `{ lvl?: string, label: string, href: string }` — e.g.
`{ lvl: '01', label: 'Apps', href: '#apps' }`; Scrum and About have no level number.

**Stat tile:** `{ n: string, label: string }` — e.g. `{ n: '14', label: 'apps in the lab' }`.
Editorial strings, not computed.

**Footer column:** `{ title: string, links: [{ label, href }] }` — three columns:
Explore, Music, Connect.

**Hero:** status badge text ("the software archeologist's lab"), h1, lead paragraph,
4 numbered CTAs `{ n, label, href, style: primary|secondary }`.

**Section headers (levels):** `{ levelNo, levelColor, sectionName, h2, intro }` — e.g.
LEVEL 03 / `--level-books` / THE BOOKSTORE / "Books, printed & kindled" / intro line.

**Page/theme props (from the design's prop panel):** `accent` (#e0a44a), `accent2`
(#6fb3c9), `showInstagram` (bool), `year` (footer), `theme` (`dark` default, `light`
toggle persisted in `localStorage("mityTheme")`).

**External identity URLs baked into the design:** Spotify artist
`4lRudVkciTQ8j2bEySXqPz`, `soundcloud.com/mityjohn`, `instagram.com/mity.john`, LinkedIn
`jan-van-wassenhove-9b49893`, Twitter `mity_john`, GitHub `janvanwassenhove`.

---

## 7. Fields the brief expects that no designed template renders

Recorded here so Phase 2 starts with the full list (direction: *content/brief has,
design ignores* — each needs author / derive / drop):

| Expectation (brief) | Design reality |
|---|---|
| App detail page with `version`, `platforms[]`, `downloadUrl`, changelog (§6 Phase 6, §15) | No app detail page; cards link out; no version/platform UI anywhere |
| Book detail page with cover image, language editions, Google Play link (§0, §6) | No book detail page; typographic covers; Amazon only |
| Post date / excerpt on blog cards | Card shows tag + title + image only |
| Tag archive page (D7: tags only) | Tags exist only as display strings on cards |
| RSS discovery, sitemap, 404 (§5.1) | Not represented in the design (build-level concerns) |
| Giscus comments on posts (D4) | No post template exists |
