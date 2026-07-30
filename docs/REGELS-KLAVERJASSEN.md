# REGELS — Klaverjassen (Nederland)

> **Status:** onderzoeksdocument, opgesteld zoals `REGELS.md`: waar bronnen elkaar
> tegenspreken of geen uitsluitsel geven, is een keuze gemaakt en gemarkeerd met
> **⚠️ AANNAME**. De machineleesbare vertaling staat in
> [`rulesets/klaverjassen.json`](../rulesets/klaverjassen.json).
>
> Klaverjassen is het meest gespeelde kaartspel van Nederland en kent — net als
> wiezen in Vlaanderen — sterke regionale variatie. De twee grote telwijzen
> (**Rotterdams** en **Amsterdams**) staan allebei in de app; je kiest bij de start.
>
> Geraadpleegde bronnen (via zoekresultaten; volledige pagina's waren binnen de
> sandbox-netwerkpolicy niet ophaalbaar): nl.wikipedia.org (Klaverjassen, Roem),
> klaverjasedelweiss.nl, denksport.nl, pagat.com (Klaverjas).

## 1. Scope

- **Spel:** klaverjassen, 4 spelers in **twee vaste ploegen** (je zit tegenover je maat).
- **Ruleset-id:** `klaverjassen`.
- Verwant aan het al aanwezige **bieden** en aan het Franse **belote**: exact dezelfde
  kaartwaarden en dezelfde 8 slagen per ronde. Het verschil zit in het bieden (hier:
  troefkleur kiezen), de **roem** en de telwijze.

## 2. Basis

| Onderwerp | Regel |
|---|---|
| Spelers | 4, in 2 vaste ploegen; maten zitten tegenover elkaar. |
| Kaarten | **32** (7 t.e.m. aas), geen jokers. Elke speler krijgt er **8**. |
| Delen | In pakjes van **3-2-3** of **4-4**. **⚠️ AANNAME** — beide komen voor; heeft geen invloed op het spel. |
| Speelrichting | **Met de klok mee**. |
| Deler | Wisselt elke ronde, met de klok mee. |
| Ronde | 8 slagen; een partij is een afgesproken aantal **boompjes** (zie §7). |

## 3. Kaartwaarden

In de **troefkleur** telt de boer het hoogst, daarna de negen — precies zoals bij bieden.

| | Troefkleur | Andere kleuren |
|---|---|---|
| Volgorde (hoog → laag) | B, 9, A, 10, H, V, 8, 7 | A, 10, H, V, B, 9, 8, 7 |
| Boer | **20** | 2 |
| Negen | **14** | 0 |
| Aas | 11 | 11 |
| Tien | 10 | 10 |
| Heer | 4 | 4 |
| Vrouw | 3 | 3 |
| Acht / zeven | 0 | 0 |

- Samen **152 kaartpunten**, plus **10 voor de laatste slag** = **162 punten** per ronde.
- ⚠️ Let op het verschil met het Vlaamse *bieden* in deze app: daar tellen heer, vrouw en
  de gewone boer 3, 2 en 1 (samen 151). Klaverjassen gebruikt 4, 3 en 2 — samen 152.

## 4. Troef kiezen

- De speler **links van de deler** krijgt als eerste de kans en kiest een troefkleur,
  of past. Bij passen schuift de beurt met de klok mee door.
- **Verplicht spelen:** past iedereen, dan **moet** de laatste speler (de deler) toch
  een kleur kiezen. **⚠️ AANNAME** — elders wordt er dan opnieuw gedeeld, of geldt
  "de eerste speler moet". De app volgt de gangbare "deler is verplicht"-regel.
- Wie de troef kiest, vormt met zijn maat de **spelende ploeg**; die moet meer punten
  halen dan de tegenpartij (§7).
- De speler links van de deler **komt uit** in de eerste slag.

## 5. Spelregels tijdens de slagen

1. **Kleur bekennen is verplicht.**
2. Kan je de gevraagde kleur niet volgen, dan **moet je troeven**.
3. Ligt er al troef en kan je hoger troeven, dan **moet je oversteken** (overtroeven).
4. Kan je enkel lager troeven ("ondertroeven"), dan hangt het van de telwijze af:

| | **Rotterdams** | **Amsterdams** |
|---|---|---|
| Ondertroeven wanneer je niet kan oversteken | **Verplicht** — je moet troef bijspelen, ook al is die lager | **Niet verplicht** — je mag dan een andere kaart bijgooien |
| Als je maat de slag al heeft | Je moet nog steeds volgen/troeven volgens dezelfde regels | **Je hoeft niet te troeven**: ligt de slag bij je maat, dan mag je vrij bijgooien |

  ✅ *Beide telwijzen zitten in de app en zijn bij de start te kiezen.*
  **⚠️ AANNAME** — de exacte afbakening tussen "Rotterdams" en "Amsterdams" verschilt
  per streek; bovenstaande is de meest gerapporteerde invulling.

5. Wie geen troef meer heeft, mag altijd vrij bijgooien.
6. De hoogste troef wint de slag; zonder troef de hoogste kaart in de gevraagde kleur.

## 6. Roem

**Roem** zijn extra punten voor combinaties die in **één slag** op tafel komen. Ze tellen
mee voor de ploeg die de slag wint.

| Combinatie | Punten |
|---|---|
| Drie kaarten op volgorde in dezelfde kleur (bv. 8-9-10) | **20** |
| Vier kaarten op volgorde in dezelfde kleur | **50** |
| Vier dezelfde kaarten (vier heren, vier azen …) | **100** |
| Vier boeren | **200** |
| **Stuk**: heer én vrouw van troef, door dezelfde speler in dezelfde slag gespeeld | **20** |

- De volgorde voor roem is de **gewone** volgorde (7-8-9-10-B-V-H-A), **ook in troef**.
  **⚠️ AANNAME** — dit is de gangbare regel; dat de troefvolgorde zou gelden komt zelden voor.
- Een reeks van vier telt **50** en niet ook nog eens 20 voor de reeks van drie erin.
- Stuk telt apart en kan bij een reeks komen.
- ⚠️ **AANNAME** — vier boeren als 200 (i.p.v. 100) is gangbaar maar niet universeel;
  in de app instelbaar via de ruleset.

## 7. Punten tellen

- Aan het eind van de ronde telt elke ploeg haar **kaartpunten + roem**. Samen 162 + roem.
- De spelende ploeg is **binnen** wanneer ze **meer** punten heeft dan de tegenpartij
  (dus minstens 82 bij 162 zonder roem).
- **Nat**: haalt de spelende ploeg het niet, dan gaan **alle** punten (162 + alle roem
  van beide ploegen) naar de tegenpartij, en de spelende ploeg krijgt **0**.
- **Pit**: wint de spelende ploeg **alle acht** slagen, dan krijgt ze 162 + roem
  **plus 100 bonus**. ⚠️ **AANNAME** — de bonus van 100 is gangbaar; sommige kringen
  spelen zonder pitbonus.
- Een partij loopt over een afgesproken aantal ronden (**boompje** = 16 ronden), of tot
  een puntendoel. In de app kies je bij de start: **16 ronden** of **spelen tot 1500**.
  **⚠️ AANNAME** (het doel; 16 ronden is de klassieke boom).

## 8. Verschillen met de andere spellen in deze app

| | Klaverjassen | Bieden (VL) | Manillen |
|---|---|---|---|
| Kaarten | 32, 8 per speler | 32, 8 per speler | 32, 8 per speler |
| Troef | gekozen door één speler vóór de eerste slag | de kleur van de eerste uitgekomen kaart | gekozen door de deler |
| Heer / vrouw | 4 / 3 | 3 / 2 | 3 / 2 |
| Totaal | 162 (152 + 10 laatste slag) | 151 | 60 |
| Extra combinaties | **roem** | geen | geen |
| Doel | meer dan de tegenpartij | het geboden aantal punten | meer dan 30 |

## Open regelvragen

1. **Telwijze als standaard** — staat de app standaard op Rotterdams of Amsterdams?
   (Nu: Rotterdams, omdat die het strengst is en het vaakst gerapporteerd wordt.)
2. **Verplicht spelen** — is de deler verplicht te kiezen als iedereen past, of wordt er
   opnieuw gedeeld?
3. **Pitbonus** — 100 punten, of speelt jouw tafel zonder?
4. **Vier boeren** — 200 of 100 roem?
5. **Partijlengte** — een boompje van 16 ronden, of tot 1500 punten?
