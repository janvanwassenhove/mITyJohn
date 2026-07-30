# RÈGLES / REGELS — Belote (Frankrijk)

> **Status:** onderzoeksdocument, opgesteld zoals `REGELS.md`. Waar bronnen elkaar
> tegenspreken of geen uitsluitsel geven, is een keuze gemaakt en gemarkeerd met
> **⚠️ AANNAME**. Machineleesbaar in [`rulesets/belote.json`](../rulesets/belote.json).
>
> Belote is het meest gespeelde kaartspel van Frankrijk. Het deelt zijn kaartwaarden
> met het Nederlandse klaverjassen en met het Vlaamse bieden — het verschil zit in
> hoe de troef bepaald wordt, en in de **annonces** (combinaties in de hand).
>
> Geraadpleegde bronnen (via zoekresultaten; volledige pagina's waren binnen de
> sandbox-netwerkpolicy niet ophaalbaar): fr.wikipedia.org (Belote, Belote coinchée),
> pagat.com (Belote), regles-de-jeux.com.

## 1. Scope

- **Spel:** *belote classique* (ook "belote à la découverte"), 4 spelers in **twee vaste
  ploegen**; maten zitten tegenover elkaar.
- **Ruleset-id:** `belote`.
- De **coinche/contrée** (bieden op een puntenaantal met verdubbeling) is een aparte
  variant en zit **niet** in deze eerste versie — zie de open vragen.

## 2. Basis

| Onderwerp | Regel |
|---|---|
| Spelers | 4, in 2 vaste ploegen. |
| Kaarten | **32** (7 t.e.m. aas). |
| Delen | **3-2-3** in twee rondes rond de troefkaart heen (zie §4). |
| Speelrichting | **Met de klok mee**. **⚠️ AANNAME** — in Frankrijk speelt men traditioneel *tegen* de klok in; de app houdt alle spellen consistent met de klok mee. |
| Ronde | 8 slagen. Een partij loopt tot **501** punten. **⚠️ AANNAME** (ook 1000 komt voor). |

## 3. Kaartwaarden

Identiek aan klaverjassen: in troef is de boer (*valet*) de hoogste kaart.

| | Troef (*atout*) | Andere kleuren |
|---|---|---|
| Volgorde (hoog → laag) | V, 9, A, 10, H, D, 8, 7 | A, 10, H, D, V, 9, 8, 7 |
| Valet (boer) | **20** | 2 |
| Neuf (negen) | **14** | 0 |
| As (aas) | 11 | 11 |
| Dix (tien) | 10 | 10 |
| Roi (heer) | 4 | 4 |
| Dame (vrouw) | 3 | 3 |
| 8 / 7 | 0 | 0 |

- Samen **152 kaartpunten** + **10 voor de laatste slag** (*dix de der*) = **162**.

## 4. Troef bepalen — het verschil met klaverjassen

Bij belote wordt de troef **niet vrij gekozen** maar via een omgedraaide kaart aangeboden:

1. Elke speler krijgt eerst **5 kaarten** (3 + 2). De volgende kaart komt **open** op tafel.
2. **Eerste ronde:** vanaf links van de deler mag elke speler die kaart *"prendre"* —
   de kleur ervan wordt dan troef en de nemer neemt de open kaart in zijn hand. Wie niet
   wil, past.
3. **Tweede ronde:** past iedereen, dan mag men in dezelfde volgorde een **andere kleur**
   noemen. Die wordt dan troef; de nemer neemt de open kaart alsnog op.
   **⚠️ AANNAME** — of de open kaart ook bij een andere troefkleur wordt opgenomen,
   verschilt per streek; de app laat de nemer ze opnemen.
4. Neemt niemand, dan worden de kaarten **binnengegooid** en deelt de volgende speler
   opnieuw (*carte redistribuée*). Er wordt niet gescoord.
5. Na het nemen krijgt iedereen de rest: de nemer 2 kaarten, de anderen 3 — samen 8.
   **⚠️ AANNAME** over de exacte verdeling; het eindresultaat (8 kaarten elk) staat vast.

## 5. Spelregels tijdens de slagen

Dezelfde plichten als bij klaverjassen (Rotterdamse strengheid):

1. **Kleur volgen is verplicht.**
2. Kan je niet volgen, dan **moet je troeven**.
3. Ligt er al troef, dan moet je **oversteken** als je kan; kan je dat niet, dan moet je
   toch troef bijleggen (**ondertroeven verplicht**).
4. **Uitzondering:** ligt de slag al bij je **maat**, dan hoef je niet te troeven en mag je
   vrij bijgooien. ✅ *Dit is bij belote de standaardregel, anders dan bij het Rotterdamse
   klaverjassen.*
5. Wie geen troef meer heeft, gooit vrij bij.

## 6. Belote-rebelote

- Heeft één speler **heer én vrouw van troef** in de hand, dan meldt hij *"belote"* bij de
  eerste van de twee en *"rebelote"* bij de tweede. Dat levert zijn ploeg **20 punten** op.
- Beide kaarten moeten daadwerkelijk **gespeeld** worden, en de melding moet op het juiste
  moment gebeuren. **⚠️ AANNAME** — de app meldt het automatisch zodra de tweede kaart valt;
  vergeten aankondigen (en dus je punten verliezen) zit er niet in.
- Belote-rebelote telt **altijd** mee, ook als de ploeg de ronde verliest.
  **⚠️ AANNAME** — hierover lopen de reglementen uiteen.

## 7. Annonces (combinaties in de hand)

Anders dan bij klaverjassen — waar roem in **één slag** moet vallen — gaat het bij belote
om combinaties **in je hand**, aangekondigd bij de eerste slag.

| Combinatie | Punten |
|---|---|
| **Tierce** — 3 kaarten op volgorde in dezelfde kleur | 20 |
| **Cinquante** — 4 op volgorde | 50 |
| **Cent** — 5 op volgorde | 100 |
| **Carré** van boeren | 200 |
| **Carré** van negens | 150 |
| **Carré** van azen, tienen, heren of dames | 100 |
| Carré van 8 of 7 | telt niet |

- De volgorde voor annonces is de **gewone** volgorde (7-8-9-10-V-D-H-A), ook in troef.
- **Alleen de beste annonce telt** — en wel voor de héle ploeg: de ploeg met de hoogste
  combinatie scoort al haar annonces, de andere ploeg niets.
  **⚠️ AANNAME** — dit is de gangbare Franse regel; elders telt iedereen zijn eigen.
- Bij gelijke combinaties wint de hoogste kaart; blijft het gelijk, dan wint de ploeg van
  de speler die het dichtst na de deler zit. **⚠️ AANNAME**.
- Belote-rebelote staat **buiten** deze vergelijking en telt altijd apart.

## 8. Punten tellen

- De **nemende ploeg** (die de troef vastlegde) moet **meer** punten halen dan de
  tegenpartij, annonces meegerekend.
- **Dedans** (nat): haalt ze het niet, dan gaat **alles** naar de tegenpartij.
- **Capot**: wint de nemende ploeg alle acht slagen, dan komt er **100** bij.
  **⚠️ AANNAME** (de waarde).
- Bij een **gelijkstand** blijven de punten van de nemende ploeg "liggen" (*litige*) en
  gaan ze naar de winnaar van de volgende ronde. **⚠️ AANNAME** — de app telt ze
  eenvoudigweg toe aan de tegenpartij; litige zit er nog niet in.
- Eerste ploeg aan **501** punten wint.

## 9. Verschillen met klaverjassen

| | Belote | Klaverjassen |
|---|---|---|
| Troef | via een **omgedraaide kaart**, in twee biedronden | de speler **kiest** vrij een kleur |
| Iedereen past | opnieuw delen | de deler **moet** kiezen |
| Combinaties | **annonces uit de hand**, enkel de beste ploeg telt | **roem** binnen één slag, beide ploegen tellen |
| Heer + vrouw troef | **belote-rebelote**, 20, altijd geldig | **stuk**, 20, als roem in één slag |
| Ondertroeven | verplicht, behalve als je maat de slag heeft | per telwijze verschillend |
| Doel | 501 | boompje van 16 ronden of 1500 |

## Open regelvragen

1. **Speelrichting** — de app speelt overal met de klok mee; traditioneel is belote
   tegen de klok in. Storend, of laten we het consistent?
2. **Coinche / contrée** — de biedvariant (op punten bieden, verdubbelen) als aparte
   ruleset toevoegen?
3. **Litige** bij gelijkstand — punten laten liggen voor de volgende ronde, of gewoon
   naar de tegenpartij?
4. **Belote-rebelote bij verlies** — telt het altijd, of enkel als de ploeg binnen is?
5. **Partijlengte** — 501 of 1000?
