# design/ — Claude Design output

**Reference only. Do not build from these files. See MIGRATION_BRIEF.md §15.**

| File | What it is |
|---|---|
| `handoff/mITyJohn.dc.html` | The Claude Design export, verbatim. Single designed screen (Home) with embedded sample data and behaviour. Never edit by hand. |
| `handoff/support.js` | Claude Design runtime shipped with the export. Not part of the site. |
| `handoff/uploads/*.png` | Reference images pasted during design: the old WordPress quotes section (×2, identical) and a styled iteration of the quotes section. Not screens. |
| `archive/claude-design-export-2026-07-18.zip` | Durable snapshot of the handoff bundle, same moment. |
| `tokens.css` | Extracted design tokens. **The only file `src/` may import from `design/`.** |
| `implied-schema.md` | Fields each designed template needs (Phase 0 deliverable). |

Source project: <https://claude.ai/design/p/c0d41421-26bb-43d9-a42a-5f76bbfad6b9?file=mITyJohn.dc.html>

---

## §15 Template mapping

The export contains **one designed screen — Home** — a one-pager whose sections are the
component designs. Every exported screen/section is mapped below; nothing in the export is
unmapped.

### Exported screen → Astro targets

| Exported screen / section | Astro target | Notes |
|---|---|---|
| Home (whole page) | `src/pages/index.astro` | Also hosts the `?p=` JS shim (§5.4). Page background wash + section order per the export. |
| Nav (sticky, level numbers, theme toggle) | `src/components/Nav.astro` + `src/components/ThemeToggle.astro` | Toggle is the only interactive part → island. Theme persisted in `localStorage("mityTheme")`, dark default. |
| Hero (badge, h1 with blinking cursor, lead, 4 numbered CTAs) | part of `src/pages/index.astro` (or `src/components/Hero.astro`) | CTAs anchor to #apps / #artist / #books / #blog. |
| Stats strip (4 tiles) | `src/components/StatsStrip.astro` | Values are content, not live counters. |
| Arcade strips (4 decorative mini-games: platformer, rhythm, race, fight) | `src/components/ArcadeStrip.astro` | `aria-hidden` decorative JS animation between sections. Island with `client:visible`; must respect `prefers-reduced-motion` and stay within the N5 Lighthouse budget — verify cost in Phase 3. |
| Apps store section (level badge, intro, filter chips, card grid) | `src/pages/index.astro` section + `src/components/AppFilters.astro` + `src/components/AppCard.astro` | Filters: All / Music / Games / Fun / Lab — client-side filter → small island. Card: code badge, tag, name, blurb, action buttons. |
| SCRUM feature banner | `src/components/ScrumFeature.astro` | Links to the SPL page (currently `?page_id=100` → internal URL after Phase 2). |
| Artist section (panel + Spotify artist embed) | `src/components/ArtistSection.astro` + `src/components/SpotifyEmbed.astro` | **Deviation required:** the export embeds the Spotify iframe eagerly; §8.1 mandates click-to-load poster. Brief wins over design (MIGRATION_BRIEF.md rule). |
| Bookstore section (level badge, intro, book cover grid) | `src/pages/index.astro` section + `src/components/BookCard.astro` | Card: typographic cover (series, title, badge), desc, Buy on Amazon + Preview CTAs. Same card serves `/books/` index. |
| Blog section (level badge, "All posts →", 4 post cards) | `src/pages/index.astro` section + `src/components/PostCard.astro` | Card: cover image, tag, title (no date/excerpt shown). Same card serves `/blog/` index. |
| Instagram grid (h2, @mity.john link, 6 tiles) | `src/components/InstagramGrid.astro` | Reads `src/data/instagram.json` (§7.3). Section is toggleable in the design (`showInstagram`) → renders nothing when JSON is empty (N4). |
| Quotes section (3 tinted quote cards) | `src/components/Quotes.astro` | Static content: kicker, quote, author, per-card accent/tint. |
| About / Footer (statement, 3 link columns, legal row) | `src/components/Footer.astro` | Columns: Explore / Music / Connect. About links to the About page. |

### Required by the brief, **not present in the export** (missing templates)

These §15 rows have no designed screen. Per §15 they are decisions, not guesses — they go
on the Phase 2 gap list (`gap-list.md`). Where the design gives a strong precedent, it is
noted; none of these may be invented ahead of a gap resolution.

| §15 row | Status | Design precedent to extend from |
|---|---|---|
| Blog index `src/pages/blog/index.astro` | **Not designed** | Blog section grid (PostCard). Pagination behaviour undefined. |
| Blog post `src/layouts/Post.astro` | **Not designed** | Nothing — no article layout exists. Giscus placement (below fold) is a brief requirement, not a design one. |
| Tag archive `src/pages/tags/[tag].astro` | **Not designed** | PostCard grid; tags appear on cards as display strings ("Games · AI"). |
| App detail `src/pages/apps/[slug].astro` | **Not designed — and possibly not wanted.** The designed app cards link *out* (GitHub releases / demo / repo / info page) with no internal detail page. The brief's §5.1 URL scheme and Phase 6 expect `/apps/{slug}/` with version + platform badges; the design contradicts this. **Gap-list item, Jan decides.** | AppCard, ScrumFeature banner. |
| Books index `src/pages/books/index.astro` | **Not designed** as a standalone page | Bookstore section is effectively the index design. |
| Book detail `src/pages/books/[slug].astro` | **Not designed — and possibly not wanted.** Book cards link straight to Amazon/preview. Same tension with §5.1 as app detail. **Gap-list item, Jan decides.** | BookCard. |
| Static page `src/layouts/Page.astro` | **Not designed** | Nothing — no prose layout exists (needed for About, SPL, Artist pages… pending Phase 2 classification). |
| 404 `src/pages/404.astro` | **Not designed** | Arcade visual language ("GAME OVER") is an obvious fit but is an invention — decide in Phase 2/3. |

### Deferred (in the export, not in v1 scope)

Nothing. Every section of the exported screen is mapped above. The only export behaviour
**dropped deliberately** is the eager-loading Spotify iframe (replaced by click-to-load per
§8.1) — noted in the mapping table, not a deferral.

---

## Implied IA (Phase 0 step 5 — supersedes §2's WordPress IA)

The design presents the site as **four numbered "levels" plus two satellites**, all
reachable from a one-page home:

```
Home
├─ 01 Apps    — "THE STORE"      → filters: All · Music · Games · Fun · Lab
├─ 02 Artist  — "THE ARTIST"     → Spotify/SoundCloud links + player, About-the-artist page
├─ 03 Books   — "THE BOOKSTORE"  → grouped by series (Children · Reimagining · Coming soon)
├─ 04 Blog    — "FIELD NOTES"    → latest 4 cards + "All posts →" index
├─ Scrum      — featured banner  → SPL page (flagship, also an app card in the store, cat "lab")
└─ About      — footer statement → About page
```

Consequences confirmed against §2's open question:

- **Games and Fun are store filters, not sections.** The old WordPress top-level nav
  (Blog / Music / Games / Books / Fun / SCRUM / About) collapses into the level structure
  above.
- **Music splits in two:** music *apps* live in the store under the Music filter;
  the *artist* identity (Spotify, SoundCloud, About-the-artist) is its own section.
- **The store is flat**: 14 app cards, one grid, category filter chips. No sort order UI,
  no search, no pagination in the design.
- **Books are outbound-first**: Buy on Amazon and Preview are the only CTAs.
- **Nav order** = Apps, Artist, Books, Blog, Scrum, About (levels 01–04 + 2 unnumbered).
- **Footer IA**: Explore (Apps store, Bookstore, Blog, Scrum Programming) · Music
  (The Artist, mITyStudio, SoundCloud, Spotify) · Connect (Instagram, LinkedIn, Twitter,
  About).
- **Theme**: dark default with a light alternative, user-toggleable, persisted.
- **Instagram** is a home section (toggleable), not a page.

The full field-level derivation is in [implied-schema.md](implied-schema.md).
