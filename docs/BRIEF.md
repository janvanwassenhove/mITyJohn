# BRIEF — Cards (Vlaamse kaartspellen)

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
2. Daarna, in volgorde (bevestigd 2026-07-24): een **kleurenwiezen-variant**,
   **manillen** en **bieden** — alle drie geïmplementeerd.
3. Traditionele spellen uit de buurlanden (bevestigd 2026-07-29): **klaverjassen** (NL),
   **belote** (FR), **hartenjagen** en **boerenbridge** — alle vier geïmplementeerd.
   **Frans tarot** volgt als apart traject, want dat vraagt 3–5 spelers en een eigen
   kaartset.

## §4 Regels & rulesets

- [`docs/REGELS.md`](REGELS.md) is de canonieke regelbeschrijving; aannames staan er
  gemarkeerd met **⚠️ AANNAME**, open punten onderaan.
- [`rulesets/*.json`](../rulesets/) is de machineleesbare vertaling; de engine voert
  uitsluitend uit wat daar staat. Eén ruleset = één coherente variant:
  `vlaams-standaard` (gewoon wiezen), `kleurenwiezen`, `vlaams-cafe`, `manillen`, `bieden`,
  `klaverjassen`, `belote`, `hartenjagen`, `boerenbridge`.

## §5 Architectuur

- **Engine** (`cards/src/engine/`): framework-agnostische TypeScript, geen DOM. Delen,
  bieden, slagen, scoring; deterministisch via injecteerbare PRNG (reproduceerbaar & testbaar).
- **Bots** (`cards/src/bots.ts`): heuristieken bovenop de engine; de engine bewaakt legaliteit.
- **UI** (`cards/src/main.ts` + `styles.css`): lichtgewicht vanilla-TS rendering. Een
  framework wordt pas overwogen als de UI-complexiteit dat afdwingt.

## §6 Repo-structuur & tooling

De cards-app leeft als subproject in de mityjohn.com-monorepo:

```
cards/            Vite + TypeScript (strict), Vitest, ESLint (flat + typescript-eslint), Prettier
docs/REGELS.md    canonieke spelregels + aannames
rulesets/*.json   machineleesbare rulesets (gedeeld repo-niveau)
```

Commando's in `cards/`: `dev` / `build` (typecheck + bundel) / `test` / `lint` / `format`.

## §7 Testen & kwaliteit

- Vitest: engine-gedrag (delen, volgplicht, slagwinnaar, troel, biedladder, scoretabellen),
  ruleset-validatie, i18n-sleutelpariteit, themapersistentie.
- Bots-simulatie: tientallen volledige sessies zonder illegale zetten, zero-sum-invariant.
- CI (`ci.yml`, job `cards`): lint + test + build op elke PR.

## §8 i18n & thema

- **Talen:** `nl` (standaard én fallback), `en`, `fr`. Alle UI-teksten via
  `cards/src/i18n/locales/*.json`; sleutelpariteit wordt door een test afgedwongen. Keuze
  persistent (`localStorage: cards.lang`), `<html lang>` volgt.
- **Thema:** licht / donker / systeem via `data-theme` op `<html>` en CSS custom properties;
  persistent (`cards.theme`); inline script voorkomt een themaflits bij het laden.

## §9 UX-principes

Tafelmetafoor (jij onderaan, bots links/boven/rechts), duidelijke beurten en biedlog, geen
verborgen automatiek: verplichte zetten (troel, gedwongen uitkomst) zichtbaar gemaakt.
Toegankelijk: knoppen i.p.v. drag-and-drop, aria-labels op kaarten.

## §10 Bots & moeilijkheid

Fase 1: conservatieve heuristieken (bieden op handsterkte, goedkoop winnen/laag bijgooien,
miserie-ontwijkgedrag). Later: niveaus, kaartgeheugen, partnersignalen.

## §11 Deploy

Meegebouwd in de bestaande GitHub Pages-deploy van mityjohn.com (`deploy.yml`): Vite-build
met `base: '/cards/'`, gekopieerd naar `dist/cards` → live op **https://mityjohn.com/cards/**
bij elke push naar `main` (plus de nachtelijke rebuild). De `github-pages`-omgeving laat
alleen `main` deployen.

## §12 Fasering

| Fase | Inhoud | Status |
|---|---|---|
| 0 | Regels onderzoeken (REGELS.md), ruleset-JSON, repo/tooling, i18n- & themafundering, Pages-deploy met placeholder | ✅ |
| 1 | Speelbare wiezen: engine, bots, spel-UI, browser-smoketest | ✅ |
| 2 | Regelbevestiging verwerkt (klok mee, troel via eerste kaart, volgplicht, herdeel, punten); botniveaus; sessiepersistentie (localStorage, actielog-replay); PWA-installatie; animaties & geluid; vermelding op de homepage | ✅ |
| 3 | Statistieken & historiek; sterke bots met kaartgeheugen. Restvragen (troel 8/9, overbieden, rangorde-details) blijven open | ✅ |
| 4a | Kleurenwiezen-variant `vlaams-cafe` (piccolo + troefplicht) met rulesetkeuze in de app | ✅ |
| 4b | Manillen speelbaar: eigen engine (10 boven aas, kaartpunten, vaste teams, troefkeuze deler, troefplicht, tot 101), spelkeuze in de app, persistentie — op de aannames uit [REGELS-MANILLEN.md](REGELS-MANILLEN.md) | ✅ |
| 4c | Regelvarianten als **sessie-opties** op het startscherm: wiezen (troel-doel 8/9, troel overbiedbaar/onoverbiedbaar, kleine+grote miserie) en manille (puntenmodel 60/68, troefbepaling deler/laatste-kaart/maat, multiplicators, "maat ligt", sessiedoel 101/61); opties in de persistentie | ✅ |
| 4d | Bieden speelbaar: eigen engine (32 kaarten, troef-/niet-troefwaarden, biedveiling om punten, hoogste bieder komt uit en bepaalt troef, troefvrijheid, 151 punten, zero-sum ±bod tot 500), spelkeuze in de app, persistentie — op de aannames uit [REGELS-BIEDEN.md](REGELS-BIEDEN.md) | ✅ |
| 5 | ~~Online multiplayer~~ — door de opdrachtgever afgewezen (app blijft serverloos). In de plaats: **scorebord voor een fysiek kaartspel** — houd per ronde de punten bij. Twee modi: **manueel** (2–4 deelnemers, vrije punten) en **wiezen (auto)** — duid contract (incl. troel), speler + maat en aantal slagen aan, de app berekent de punten via de scoring-engine. Persistent in localStorage | ✅ |
| 6 | **GUI-redesign + onboarding**: mobile-first designsysteem (spelkeuze als tegels, één primaire CTA, ingeklapte instellingen, echte kaartgezichten, actiepaneel als bottom sheet), **starterswizard** per spel en een **coach** die tijdens het spel contextuele tips geeft; screenshotgenerator (`cards/scripts/screenshots.mjs`) met beelden in de README en, als vaste werkafspraak, in elke release note ([RELEASING.md](../RELEASING.md)) | ✅ |
| 7 | **Speeltypes en regelgids**: wiezen splitst in **gewoon wiezen** (troef = omgedraaide kaart) en **kleurenwiezen** (de vrager noemt de kleur bij zijn bod) — nieuwe ruleset `kleurenwiezen`, biedactie met kleur, bots die zelf een kleur kiezen, en een zichtbare speeltypekeuze op het startscherm ([REGELS.md §3bis](REGELS.md#3bis-gewoon-wiezen-vs-kleurenwiezen)). Daarnaast een **regelgids**: zes hoofdstukken (basis, gewoon wiezen, kleurenwiezen, manillen, bieden, scorebord) die je in wizardstijl stap voor stap door de regels loodsen | ✅ |
| 8 | **Troel: de aas moet vallen** (REGELS.md §5.4) — de houder van de vierde aas (of de hartenheer bij vier azen in één hand) komt uit met díé kaart en bepaalt zo de troef; komt hij iets anders uit, dan schuift het doel van 8 naar 9 slagen. Engine, bots, coach, regelgids en de scorebord-automodus volgen. Het **scorebord toont voortaan het aantal slagen** per ronde ("Troel — Jan + Jappe · 8/9 slagen"), zodat een rij achteraf na te rekenen valt | ✅ |
| 9 | **Klaverjassen (NL)** — eerste spel buiten de Vlaamse familie, volgens dezelfde principes: [REGELS-KLAVERJASSEN.md](REGELS-KLAVERJASSEN.md) met gemarkeerde aannames, `rulesets/klaverjassen.json`, eigen DOM-vrije engine (troefkeuze met passen, verplicht spelen voor de deler, **roem**, Rotterdams/Amsterdams, nat, pit), bots, persistentie, coach, gidshoofdstuk en wizard, in nl/en/fr | ✅ |
| 10 | **Belote (FR)** — [REGELS-BELOTE.md](REGELS-BELOTE.md), `rulesets/belote.json` en een eigen engine: troef via een **omgedraaide kaart in twee biedronden** (neemt niemand, dan opnieuw delen), **annonces uit de hand** (tierce/cinquante/cent/carrés, waarbij enkel de ploeg met de beste combinatie telt), **belote-rebelote**, dedans en capot, tot 501. De slagregels zijn gedeeld met klaverjassen via `trickLegalPlays` — belote verschilt daar enkel in dat ondertroeven verplicht is maar je vrij mag bijgooien als je maat de slag heeft | ✅ |
| 11 | **Hartenjagen (Hearts / Chasse au cœur)** — het buitenbeentje: geen ploegen, geen bieden, geen troef, en punten die je juist *wil vermijden*. [REGELS-HARTENJAGEN.md](REGELS-HARTENJAGEN.md), `rulesets/hartenjagen.json` en een eigen engine met de **doorgeeffase** (drie kaarten naar links/rechts/tegenover/niet), de strafkaarten (elke harten 1, schoppenvrouw 13), de verplichte uitkomst met klaveren 2, het **breken van harten** en **alles halen** (26 → 0 voor de schutter, 26 voor de rest). Bots die hun gevaarlijkste kaarten doorgeven en onder de slag blijven, plus coach, gidshoofdstuk en wizard in nl/en/fr | ✅ |
| 12 | **Boerenbridge (Chinees poepen / Oh Hell)** — het eerste spel met een **wisselende handgrootte**: 1…8, drie rondes op acht, en weer af tot 1 (zeventien rondes, WK-reglement). [REGELS-BOERENBRIDGE.md](REGELS-BOERENBRIDGE.md), `rulesets/boerenbridge.json` en een eigen engine: troef via de omgedraaide kaart (of géén troef als de stok leeg is), voorspellen vanaf links van de deler met de deler als laatste, optioneel *screw the dealer*, kleur bekennen verplicht en troeven nooit. Scoring: juist = 10 + 3 per slag, fout = −3 per slag verschil. Bots die hun slagen schatten en daarna sturen op wat ze nog nodig hebben, plus coach, gidshoofdstuk en wizard in nl/en/fr | ✅ |

## §13 Open punten

Zie [REGELS.md — Open regelvragen](REGELS.md#open-regelvragen); die dertien antwoorden zijn
de belangrijkste input voor Fase 2.
