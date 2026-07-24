# REGELS — Bieden (Fase 4d)

> **Status:** **geïmplementeerd** (Fase 4d) op de hieronder gemarkeerde aannames —
> machineleesbaar in [`rulesets/bieden.json`](../rulesets/bieden.json), engine in
> `carts/src/engine/bieden.ts`. De open vragen onderaan blijven te valideren door de
> opdrachtgever; antwoorden worden regels-eerst doorgevoerd (REGELS → ruleset → engine).
>
> Bronnen (via zoekresultaten; volledige pagina's binnen de sandbox-netwerkpolicy niet
> ophaalbaar): nl.wikipedia.org (Bieden (kaartspel)), nl.wikibooks.org (Kaartspel/Bieden),
> docplayer.nl, ktsinthubert.com (reglement bieden, PDF).

## 1. Basis

| Onderwerp | Regel |
|---|---|
| Spelers | 4, in **twee vaste teams van 2** (partners tegenover elkaar). |
| Kaarten | **32 kaarten** (7 t/m aas per kleur). |
| Delen | Elke speler **8 kaarten**, in **4-4**, met de klok mee. |
| Speelrichting | Met de klok mee (bevestigd, consistent met de andere spellen). |

## 2. Kaartwaarden (punten)

De waarde hangt af van of de kaart **troef** is of niet.

| Kaart | Troef | Niet-troef |
|---|---|---|
| Boer (B) | **20** | 1 |
| Negen (9) | **14** | 0 |
| Aas (A) | 11 | 11 |
| Tien (10) | 10 | 10 |
| Heer (H) | 3 | 3 |
| Vrouw (V) | 2 | 2 |
| Acht / Zeven | 0 | 0 |

- Troefkleur: 60 punten; elke niet-troefkleur: 27 punten (×3 = 81).
- **Laatste slag:** +10 punten voor het winnende team.
- **Totaal: 151 punten** in het spel.

## 3. Kaartrangorde (slagkracht)

- **Troef (hoog → laag):** Boer – 9 – Aas – 10 – Heer – Vrouw – 8 – 7.
- **Niet-troef (hoog → laag):** Aas – 10 – Heer – Vrouw – Boer – 9 – 8 – 7.

## 4. Bieden

- De speler **links van de deler** begint; daarna met de klok mee.
- Een bod = het **aantal punten** dat je met je partner denkt te halen. **Minimum 100**,
  telkens een **veelvoud van 10**, tot maximaal **150**. **⚠️ AANNAME** (bovengrens 150).
- **Elke speler krijgt één kans**: hoger bieden dan het staande bod, of passen.
- De **hoogste bieder** wordt "de speler" en zijn team het **spelende team**.
- **Iedereen past:** herdeel, volgende deler. **⚠️ AANNAME.**

## 5. Troef en spel

- De hoogste bieder **komt uit**; zijn **eerste kaart bepaalt de troefkleur**.
- **Volgen of troeven:** kan je de gevraagde kleur volgen, dan mag je **volgen óf troeven**
  (vrije keuze — "men mag altijd troeven, zelfs als men nog kan volgen"). Kan je niet
  volgen, dan mag je **alles** spelen. **⚠️ AANNAME** — geen verplichte overtroef.
- De slag gaat naar de hoogste troef, anders naar de hoogste kaart in de gevraagde kleur.
  Winnaar van de slag komt uit.

## 6. Score en einde

- Het **spelende team** haalt zijn bod als zijn kaartpunten (inclusief 10 voor de laatste
  slag) **≥ het geboden aantal** zijn.
- **App-scoring (⚠️ AANNAME — te bevestigen):** zero-sum in punten.
  - **Gehaald:** spelend team **+bod**, tegenpartij **−bod**.
  - **Nat:** spelend team **−bod**, tegenpartij **+bod**.
- **Sessie:** het eerste team dat het **puntendoel** (default **500**) bereikt, wint.
  **⚠️ AANNAME** — traditioneel gebruikt bieden een aftel-"boom" (van 15 of 12 naar 0);
  een puntendoel is hier gekozen voor consistentie met de andere spellen en is instelbaar
  (`session.targetPoints`).

## Open vragen voor de opdrachtgever

1. **Scoring:** het "boom"-systeem (aftellen van 15/12 naar 0) i.p.v. het huidige
   zero-sum ±bod tot een puntendoel?
2. **Punten voor het spelende team bij gehaald bod:** het **bod** (huidige keuze) of de
   **werkelijk gehaalde punten**?
3. **Bovengrens bod:** tot 150 (huidige keuze), of hoger ("pandoer"/alle slagen)?
4. **Troeven:** klopt "altijd mogen troeven, ook als je kan volgen", en geen overtroefplicht?
5. **Meerdere biedronden** of één kans per speler (huidige keuze)?
6. **Iedereen past:** herdeel (huidige keuze) of verplicht spel voor de deler?
