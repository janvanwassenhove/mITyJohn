# REGELS — Wiezen (kleurenwiezen), Vlaams standaard

> **Status:** Fase 0 — onderzoeksdocument. Dit is de regelbasis voor de Carts-app.
> De machineleesbare vertaling staat in [`rulesets/vlaams-standaard.json`](../rulesets/vlaams-standaard.json).
>
> **Belangrijk:** wiezen kent sterke regionale variatie (per café, club en familie).
> Waar bronnen elkaar tegenspreken of geen uitsluitsel geven, is een keuze gemaakt en
> gemarkeerd met **⚠️ AANNAME**. Alle openstaande punten staan onderaan in
> [Open regelvragen](#open-regelvragen).
>
> Geraadpleegde bronnen (via zoekresultaten; volledige pagina's waren binnen de
> sandbox-netwerkpolicy niet ophaalbaar): nl.wikipedia.org (Wiezen, Kleurenwiezen),
> whisthub.com/nl/rules, nl.wikibooks.org (Kaartspel/Wiezen), kaartclub-the-whiskies.webnode.be,
> rijkvanafdronk.be (puntentelling), top-casino.nl/drank-gokspellen/wiezen,
> users.belgacom.net/megascore/kleurenwiezen.htm.

## 1. Scope

- **Spel:** kleurenwiezen (de in Vlaanderen gangbare vorm van wiezen).
- **Ruleset-id:** `vlaams-standaard` — één coherente, speelbare standaard.
  Regionale varianten worden later als aparte rulesets of variantvlaggen toegevoegd.
- Andere kaartspellen (manillen, …) volgen in latere fases; dit document dekt enkel wiezen.

## 2. Basis

| Onderwerp | Regel |
|---|---|
| Spelers | 4, elk voor zich; per spel (gift) ontstaan tijdelijke bondgenootschappen via het bieden. |
| Kaarten | Standaard 52 kaarten, geen jokers. |
| Kaartrangorde | A (hoog) – K – Q – J – 10 – … – 2 (laag), in elke kleur. |
| Speelrichting | **Met de klok mee** (delen, bieden en spelen). ✅ *Bevestigd door de opdrachtgever (2026-07-24).* |
| Deler | Wisselt elke gift, met de klok mee. |

## 3. Delen en troefbepaling

1. De deler schudt; de speler rechts van de deler coupeert. **⚠️ AANNAME** (gangbaar gebruik).
2. Elke speler krijgt **13 kaarten**, gedeeld in pakjes van **4 – 4 – 5**.
   **⚠️ AANNAME** — ook 4-5-4 en 13-ineens komen voor; de verdeling heeft geen invloed op het spel zelf.
3. De **laatste kaart** (die aan de deler toekomt) wordt **open gedraaid**: die kleur is **troef**
   voor de gift. De deler neemt de kaart daarna in de hand op.
4. Bij **troel** wordt de troefkleur anders bepaald (zie §5.4).

## 4. Biedronde

- Het bieden start bij de speler **links van de deler** en gaat met de klok mee.
- Een bod moet altijd **hoger** zijn dan het hoogste bod tot dan toe (zie biedladder §5).
- **Passen** mag altijd (behalve de verplichte troel, §5.4). Wie gepast heeft, doet niet meer mee
  in de biedronde. **⚠️ AANNAME** — in sommige kringen mag men later alsnog hoger bieden.
- **Vragen en meegaan:** de eerste die wil spelen zegt *"ik vraag"*. Een volgende speler kan
  *"meegaan"* (samen 8 slagen). Gaat niemand mee, dan kan de vrager **alleen** spelen (§5.2)
  of alsnog passen.
- **Iedereen past:** de kaarten worden binnengegooid en de volgende deler deelt een nieuwe gift.
  Er wordt niet gescoord. ✅ *Bevestigd door de opdrachtgever (2026-07-24).*

## 5. Contracten (biedladder)

Van laag naar hoog. "Punten" = basispunten per tegenspeler; verrekening in §7.

| # | Contract | Wie | Doel (slagen) | Troef | Punten | Overslag |
|---|---|---|---|---|---|---|
| 1 | **Vraag & mee** | 2 (vrager + meegaander) | ≥ 8 samen | gedraaide kleur | 2 | +1 per overslag / −1 per onderslag |
| 2 | **Alleen** | 1 | ≥ 5 | gedraaide kleur | 3 | +1 / −1 |
| 3 | **Troel** (verplicht) | 2 | ≥ 8 samen | eerste kaart partner (§5.4) | 4 | +2 / −2 |
| 4 | **Abondance 9** | 1 | ≥ 9 | eigen keuze | 6 | vast |
| 5 | **Miserie** | 1 (meerdere mogelijk) | 0 | geen | 7 | vast |
| 6 | **Abondance 10** | 1 | ≥ 10 | eigen keuze | 7 | vast |
| 7 | **Abondance 11** | 1 | ≥ 11 | eigen keuze | 8 | vast |
| 8 | **Abondance 12** | 1 | ≥ 12 | eigen keuze | 9 | vast |
| 9 | **Open miserie** | 1 | 0 (kaarten open) | geen | 14 | vast |
| 10 | **Solo** | 1 | 13 | eigen keuze | 20 | vast |
| 11 | **Soloslim** | 1 | 13 | geen | 30 | vast |

✅ *Puntenwaarden bevestigd door de opdrachtgever (2026-07-24).* **⚠️ AANNAME** blijft voor
de exacte rangorde (vooral de positie van miserie tussen de abondances, en abondance 12
t.o.v. open miserie). De
abondance-reeks volgt hier de progressie 9→6, 10→7, 11→8, 12→9 punten (cf. gerapporteerde
tabellen "elf slagen 8 punten, twaalf slagen 9 punten"); troel = dubbele vraag; miserie 7 en
open miserie 14 (dubbel). Solo (13 met eigen troef, 20 ptn) en soloslim (13 zonder troef,
30 ptn per tegenspeler) volgen de "WK wiezen"-lijn.

### 5.1 Vraag & mee

- Vrager en meegaander vormen een team en moeten **samen minstens 8** slagen halen.
- Meerdere spelers kunnen willen meegaan: de **eerste in biedvolgorde** krijgt voorrang.
  **⚠️ AANNAME**.
- Alle 13 slagen samen halen ("**vole**") levert een bonus op — waarde nog te bepalen
  (open vraag); in deze standaard: 13 slagen = basispunten + 5 overslagen + **vole-bonus 3**.
  **⚠️ AANNAME**.

### 5.2 Alleen

- Kan enkel ontstaan wanneer iemand vroeg en **niemand meeging**.
- De vrager speelt alleen tegen drie en moet **minstens 5** slagen halen.

### 5.3 Abondance

- De bieder kiest **zelf de troefkleur** en maakt die pas bekend nadat het bieden is afgerond.
- De bieder komt uit in de **eerste slag**. **⚠️ AANNAME** — elders komt links van de deler uit.
- **Abondance in de gedraaide troefkleur** ("in troef") gaat boven een gewone abondance van
  hetzelfde niveau. **⚠️ AANNAME** (gangbare regel, niet in alle reglementen).
- Overslagen tellen niet: wie meer haalt dan geboden, krijgt de punten van het **geboden**
  niveau. Wie een hoger niveau haalde, had hoger moeten bieden.

### 5.4 Troel (verplicht bod)

- Wie **exact 3 azen** in de hand heeft, **moet** *"troel"* roepen.
- De houder van de **vierde aas** is automatisch partner en **komt uit** in de eerste
  slag. **De kleur van zijn eerste (vrij gekozen) kaart wordt troef.**
  ✅ *Bevestigd door de opdrachtgever (2026-07-24); vervangt de eerdere aanname
  "vierde aas wordt troef en moet uitgespeeld worden".*
- Doel: **samen ≥ 8 slagen**. **⚠️ AANNAME** — veel gezelschappen spelen 9.
- **4 azen in één hand:** de houder van de **hartenheer** is partner (heeft de troelbieder
  die zelf, dan de hoogste harten buiten zijn hand); ook die partner komt uit en bepaalt
  met zijn eerste kaart de troef. **⚠️ AANNAME** (enkel de partnerregel; de
  troefbepaling volgt de bevestigde regel hierboven).
- Troel kan enkel **overboden** worden door contracten vanaf **abondance 9** (nr. 4 en hoger).
  **⚠️ AANNAME** — elders is troel onoverbiedbaar of enkel door soloslim te overbieden.

### 5.5 Miserie en open miserie

- Doel: **geen enkele slag** halen; er is **geen troef**.
- **Meerdere spelers** mogen tegelijk (open) miserie spelen; elk wordt afzonderlijk
  gescoord. **⚠️ AANNAME**.
- Bij **open miserie** legt de bieder zijn kaarten **open na de eerste slag**.
- Zodra een miseriespeler een slag haalt, is zijn contract verloren; er wordt wel
  **uitgespeeld** zolang andere contracten (of miseries) lopen. **⚠️ AANNAME**.

### 5.6 Piccolo (variant, standaard uit)

- Exact **1 slag**, geen troef. Komt niet in alle reglementen voor; in `vlaams-standaard`
  **uitgeschakeld** via variantvlag (`variants.piccolo = false`).

## 6. Het spel (slagen)

1. De speler **links van de deler** komt uit in de eerste slag (uitzonderingen: abondance
   §5.3 en troel §5.4).
2. **Kleur bekennen is verplicht.** Wie niet kan volgen, mag **naar keuze** troeven of een
   andere kleur bijgooien — er is **geen troefplicht en geen overtroefplicht**.
   ✅ *Bevestigd door de opdrachtgever (2026-07-24)*; verplicht (over)troeven blijft als
   variantvlag beschikbaar (`variants.verplichtTroeven = false`).
3. De slag gaat naar de hoogste troef, of zonder troef naar de hoogste kaart in de
   gevraagde kleur. De winnaar van de slag komt uit in de volgende slag.

## 7. Puntentelling en verrekening

- Scoreverrekening is **zero-sum** per gift: wat de winnaars krijgen, betalen de verliezers.
- **Solocontracten** (alleen, abondance, miserie, open miserie, solo, soloslim): de bieder
  verrekent de (basis)punten **met elk van de drie tegenspelers** (×3 in eigen saldo).
- **Teamcontracten** (vraag & mee, troel): elk teamlid verrekent de punten met **één**
  tegenspeler.
- Contract **gehaald** → punten positief voor de spelende partij; **niet gehaald** →
  hetzelfde bedrag negatief (symmetrisch). **⚠️ AANNAME** — sommige tabellen laten een
  mislukt contract dubbel betalen.
- Bij vraag & mee en alleen tellen **overslagen** (+1) en **onderslagen** (−1) per slag
  boven of onder het doel; troel telt dubbel (±2). Vaste contracten (abondance en hoger)
  kennen geen overslagpunten.
- Er wordt gespeeld in **punten** (abstract). Omrekening naar inzet/gewin per punt is aan
  de spelers; de app rekent in punten.

## 8. Einde van een sessie

- Een sessie bestaat uit een afgesproken aantal giften (bv. een veelvoud van 4 zodat
  iedereen even vaak deelt) of een afgesproken eindtijd. **⚠️ AANNAME** — geen vaste norm;
  de app maakt dit configureerbaar (`session.giften`, standaard 16).

## Open regelvragen

**Beantwoord door de opdrachtgever (2026-07-24):** speelrichting met de klok mee;
troel: partner met de vierde aas komt uit en zijn eerste kaart bepaalt de troef; enkel
volgplicht (geen troefplicht); iedereen past → herdeel zonder gevolg; puntentabel
akkoord; volgende spellen: kleurenwiezen-variant, manillen en bieden.

Nog open voor Fase 3+:

1. **Troel — doel:** samen 8 (huidige keuze) of 9 slagen?
2. **Troel — overbieden:** vanaf welk contract mag troel overboden worden (huidige keuze:
   abondance 9), of is troel onoverbiedbaar?
3. **Rangorde biedladder:** klopt de positie van miserie (tussen abondance 9 en 10) en van
   open miserie (boven abondance 12)? Bestaan kleine én grote miserie apart?
4. **Mislukt contract:** enkelvoudig (huidige keuze) of dubbel betalen?
5. **Piccolo:** opnemen in de standaard of enkel als variant?
6. **4 azen in één hand:** bevestig de partnerregel (hartenheer).
7. **Meerdere miseries tegelijk:** toegelaten (huidige keuze) of maximaal één bieder?
