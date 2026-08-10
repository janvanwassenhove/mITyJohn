# CLAUDE.md

Werkafspraken voor agents in deze repo. Twee subprojecten, één Pages-deploy.

## Structuur

- **Root** = de Astro-site voor mityjohn.com. Canonieke spec: `MIGRATION_BRIEF.md`
  (bij conflict wint de brief). Cutover-checklist: `CUTOVER.md`.
- **`cards/`** = de Cards-kaartspellenapp (Vite + TS). Canonieke spec: `docs/BRIEF.md`
  (⚠️ gereconstrueerd voorstel — zie de statuswaarschuwing daarin); spelregels:
  `docs/REGELS.md`; machineleesbare regels: `rulesets/*.json`.

## Bouwen & checken

| Waar | Commando's |
|---|---|
| root | `npm ci`, `npm run check` (astro check), `npm run build` |
| `cards/` | `npm ci`, `npm run lint`, `npm run test`, `npm run build` |

Vóór elke push: de checks van elk aangeraakt subproject lokaal groen draaien.

## Publiceren gaat via staging

Content met `draft: true` (blog, apps, books, pages) komt **nooit** in een
productiebuild. Twee manieren om te bekijken: lokaal met `npm run preview:drafts`
(start op `/preview/`), of de volledige site op de afgeschermde staging-omgeving
door naar de branch `staging` te pushen. **Alleen een merge naar `main`
publiceert.** Zie `PREVIEW.md`.

De regel staat op één plek: `src/lib/drafts.ts` — filter altijd via `published`,
nooit met een eigen `!p.data.draft`. Staging draagt sitebreed `noindex` plus een
blokkerende `robots.txt`; de workflow weigert te deployen als die weg zijn.

## Regels die je niet mag breken

- `public/wp-content/uploads/**` is een byte-identieke spiegel — nooit herstructureren
  (social posts hotlinken die paden).
- GitHub Actions: third-party actions **gepind op commit-SHA's**; `pull_request_target`
  is verboden (zie commentaar in `ci.yml`).
- Geen secrets in de repo; de Instagram-integratie loopt via de Worker in
  `workers/instagram`.
- Engine-code in `cards/src/engine/` blijft DOM-vrij en deterministisch (PRNG injecteren,
  geen `Date.now()`/`Math.random()` in de engine zelf).
- Spelregelwijzigingen: eerst `docs/REGELS.md` (met ⚠️ AANNAME-markering waar onzeker),
  dan `rulesets/*.json`, dan pas engine/tests — in die volgorde, zodat regels en code niet
  uiteenlopen.
- UI-teksten in `cards/` altijd via i18n (`nl`/`en`/`fr` alle drie aanvullen; een test
  dwingt sleutelpariteit af).
- Bij een UI-wijziging in `cards/`: `npm run build && npm run screenshots` en de
  vernieuwde `cards/docs/screenshots/**` mee committen. Daarna in de root
  `node scripts/fetch-screenshots.mjs && node scripts/build-image-dims.mjs`, zodat
  de storetegel en de app-pagina op mityjohn.com meelopen. Elke release note krijgt
  screenshots — zie `RELEASING.md`.

## Deploy

`deploy.yml` bouwt site + cards en deployt naar GitHub Pages bij push naar `main`
(omgeving `github-pages` laat alleen `main` toe). Cards verschijnt onder
`https://mityjohn.com/cards/`. CI (`ci.yml`) is de PR-gate: sitecheck + cards-job.
