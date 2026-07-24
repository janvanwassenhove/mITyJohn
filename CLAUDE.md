# CLAUDE.md

Werkafspraken voor agents in deze repo. Twee subprojecten, één Pages-deploy.

## Structuur

- **Root** = de Astro-site voor mityjohn.com. Canonieke spec: `MIGRATION_BRIEF.md`
  (bij conflict wint de brief). Cutover-checklist: `CUTOVER.md`.
- **`carts/`** = de Carts-kaartspellenapp (Vite + TS). Canonieke spec: `docs/BRIEF.md`
  (⚠️ gereconstrueerd voorstel — zie de statuswaarschuwing daarin); spelregels:
  `docs/REGELS.md`; machineleesbare regels: `rulesets/*.json`.

## Bouwen & checken

| Waar | Commando's |
|---|---|
| root | `npm ci`, `npm run check` (astro check), `npm run build` |
| `carts/` | `npm ci`, `npm run lint`, `npm run test`, `npm run build` |

Vóór elke push: de checks van elk aangeraakt subproject lokaal groen draaien.

## Regels die je niet mag breken

- `public/wp-content/uploads/**` is een byte-identieke spiegel — nooit herstructureren
  (social posts hotlinken die paden).
- GitHub Actions: third-party actions **gepind op commit-SHA's**; `pull_request_target`
  is verboden (zie commentaar in `ci.yml`).
- Geen secrets in de repo; de Instagram-integratie loopt via de Worker in
  `workers/instagram`.
- Engine-code in `carts/src/engine/` blijft DOM-vrij en deterministisch (PRNG injecteren,
  geen `Date.now()`/`Math.random()` in de engine zelf).
- Spelregelwijzigingen: eerst `docs/REGELS.md` (met ⚠️ AANNAME-markering waar onzeker),
  dan `rulesets/*.json`, dan pas engine/tests — in die volgorde, zodat regels en code niet
  uiteenlopen.
- UI-teksten in `carts/` altijd via i18n (`nl`/`en`/`fr` alle drie aanvullen; een test
  dwingt sleutelpariteit af).

## Deploy

`deploy.yml` bouwt site + carts en deployt naar GitHub Pages bij push naar `main`
(omgeving `github-pages` laat alleen `main` toe). Carts verschijnt onder
`https://mityjohn.com/carts/`. CI (`ci.yml`) is de PR-gate: sitecheck + carts-job.
