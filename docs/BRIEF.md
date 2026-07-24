# BRIEF — Carts (Vlaamse kaartspellen)

> **⚠️ Statuswaarschuwing:** de oorspronkelijke, besproken projectbrief stond **niet** in deze
> repository. Dit document is een **gereconstrueerd voorstel**, opgesteld tijdens Fase 0/1 op
> basis van de opdrachtomschrijving en de uitgevoerde bouw. De sectienummering volgt de in de
> opdracht gebruikte verwijzingen (§6 repo & tooling, §8 i18n & thema, §11 deploy).
> **Te valideren door Jan**; wijkt de echte brief af, dan wint de echte brief.

## §1 Doel

Een webapp met Vlaamse kaartspellen — te beginnen met **wiezen (kleurenwiezen)** — die je in
de browser tegen botspelers (en later online tegen anderen) kunt spelen. Regels zijn
data-gedreven zodat regionale varianten als configuratie kunnen worden toegevoegd.

## §2 Doelgroep & platform

Casual spelers uit Vlaanderen en nieuwsgierige anderstaligen. Browser-first (desktop en
mobiel), geen installatie, geen accounts in de eerste fases.

## §3 Spellen & scope

1. **Wiezen** (kleurenwiezen, Vlaams standaard) — eerst.
2. Kandidaten daarna: manillen, solo whist, … — beslissing via open vraag 13 in
   [REGELS.md](REGELS.md).

## §4 Regels & rulesets

- [`docs/REGELS.md`](REGELS.md) is de canonieke regelbeschrijving; aannames staan er
  gemarkeerd met **⚠️ AANNAME**, open punten onderaan.
- [`rulesets/*.json`](../rulesets/) is de machineleesbare vertaling; de engine voert
  uitsluitend uit wat daar staat. Eén ruleset = één coherente variant
  (nu: `vlaams-standaard`).

## §5 Architectuur

- **Engine** (`carts/src/engine/`): framework-agnostische TypeScript, geen DOM. Delen,
  bieden, slagen, scoring; deterministisch via injecteerbare PRNG (reproduceerbaar & testbaar).
- **Bots** (`carts/src/bots.ts`): heuristieken bovenop de engine; de engine bewaakt legaliteit.
- **UI** (`carts/src/main.ts` + `styles.css`): lichtgewicht vanilla-TS rendering. Een
  framework wordt pas overwogen als de UI-complexiteit dat afdwingt.

## §6 Repo-structuur & tooling

De carts-app leeft als subproject in de mityjohn.com-monorepo:

```
carts/            Vite + TypeScript (strict), Vitest, ESLint (flat + typescript-eslint), Prettier
docs/REGELS.md    canonieke spelregels + aannames
rulesets/*.json   machineleesbare rulesets (gedeeld repo-niveau)
```

Commando's in `carts/`: `dev` / `build` (typecheck + bundel) / `test` / `lint` / `format`.

## §7 Testen & kwaliteit

- Vitest: engine-gedrag (delen, volgplicht, slagwinnaar, troel, biedladder, scoretabellen),
  ruleset-validatie, i18n-sleutelpariteit, themapersistentie.
- Bots-simulatie: tientallen volledige sessies zonder illegale zetten, zero-sum-invariant.
- CI (`ci.yml`, job `carts`): lint + test + build op elke PR.

## §8 i18n & thema

- **Talen:** `nl` (standaard én fallback), `en`, `fr`. Alle UI-teksten via
  `carts/src/i18n/locales/*.json`; sleutelpariteit wordt door een test afgedwongen. Keuze
  persistent (`localStorage: carts.lang`), `<html lang>` volgt.
- **Thema:** licht / donker / systeem via `data-theme` op `<html>` en CSS custom properties;
  persistent (`carts.theme`); inline script voorkomt een themaflits bij het laden.

## §9 UX-principes

Tafelmetafoor (jij onderaan, bots links/boven/rechts), duidelijke beurten en biedlog, geen
verborgen automatiek: verplichte zetten (troel, gedwongen uitkomst) zichtbaar gemaakt.
Toegankelijk: knoppen i.p.v. drag-and-drop, aria-labels op kaarten.

## §10 Bots & moeilijkheid

Fase 1: conservatieve heuristieken (bieden op handsterkte, goedkoop winnen/laag bijgooien,
miserie-ontwijkgedrag). Later: niveaus, kaartgeheugen, partnersignalen.

## §11 Deploy

Meegebouwd in de bestaande GitHub Pages-deploy van mityjohn.com (`deploy.yml`): Vite-build
met `base: '/carts/'`, gekopieerd naar `dist/carts` → live op **https://mityjohn.com/carts/**
bij elke push naar `main` (plus de nachtelijke rebuild). De `github-pages`-omgeving laat
alleen `main` deployen.

## §12 Fasering

| Fase | Inhoud | Status |
|---|---|---|
| 0 | Regels onderzoeken (REGELS.md), ruleset-JSON, repo/tooling, i18n- & themafundering, Pages-deploy met placeholder | ✅ |
| 1 | Speelbare wiezen: engine, bots, spel-UI, browser-smoketest | ✅ |
| 2 | Regelvalidatie met echte spelers; antwoorden op open vragen verwerken; varianten als vlaggen | ◻ |
| 3 | Verfijning: animaties, geluid, statistieken, opgeslagen sessies, bot-niveaus | ◻ |
| 4 | Tweede spel (manillen?) op hetzelfde ruleset-formaat | ◻ |
| 5 | Online multiplayer (aparte beslissing: vereist backend/workers) | ◻ |

## §13 Open punten

Zie [REGELS.md — Open regelvragen](REGELS.md#open-regelvragen); die dertien antwoorden zijn
de belangrijkste input voor Fase 2.
