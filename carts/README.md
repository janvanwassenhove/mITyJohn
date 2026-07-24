# Carts

Vlaamse kaartspellen (wiezen, …) in de browser — Fase 1: speelbaar wiezen tegen drie bots. Onderdeel van de mityjohn.com-monorepo,
gedeployed als subpad **https://mityjohn.com/carts/** via de bestaande GitHub Pages-workflow.

## Structuur (§6)

```
carts/                  # deze app (Vite + TypeScript, strict)
├── index.html          # placeholderpagina Fase 0 (taal- + themaswitch)
├── src/
│   ├── main.ts         # spel-UI (tafel, biedronde, scorebord) + rendering
│   ├── engine/         # DOM-vrije game-engine: delen, bieden, slagen, scoring
│   ├── bots.ts         # heuristische botspelers
│   ├── i18n/           # i18n-fundering (§8): nl / en / fr, nl = fallback
│   ├── theme.ts        # themafundering (§8): licht / donker / systeem
│   ├── ruleset.ts      # laadt rulesets/*.json (repo-niveau)
│   └── **/*.test.ts    # Vitest-tests (engine, bots-simulatie, i18n, thema, ruleset)
├── vite.config.ts      # base: /carts/
└── eslint.config.js    # ESLint + typescript-eslint; Prettier voor formattering

../docs/REGELS.md               # spelregels + gemarkeerde aannames (Fase 0)
../rulesets/vlaams-standaard.json  # machineleesbare ruleset
```

## Commando's

| Commando         | Doel                                    |
| ---------------- | --------------------------------------- |
| `npm run dev`    | dev-server                              |
| `npm run build`  | typecheck + productiebuild naar `dist/` |
| `npm run test`   | Vitest (i18n, thema, ruleset-validatie) |
| `npm run lint`   | ESLint + Prettier-check                 |
| `npm run format` | Prettier write                          |

## i18n & thema (§8)

- **Talen:** `nl` (standaard/fallback), `en`, `fr`. Berichten in `src/i18n/locales/*.json`;
  sleutelpariteit wordt door een test afgedwongen. Keuze persistente in `localStorage`
  (`carts.lang`), `<html lang>` volgt.
- **Thema:** licht / donker / systeem via `data-theme` op `<html>` en CSS custom properties;
  persistent in `localStorage` (`carts.theme`), inline script in `index.html` voorkomt
  een themaflits bij het laden.

## Deploy (§11)

De workflow `.github/workflows/deploy.yml` bouwt de Astro-site én deze app en kopieert
`carts/dist` naar `dist/carts`, zodat alles in één GitHub Pages-deploy live gaat.
CI (`ci.yml`) draait lint, tests en build voor elke pull request.
