# REGELS — Boerenbridge (ook "Chinees poepen" / Oh Hell)

> **Status:** onderzoeksdocument, opgesteld zoals `REGELS.md`. Keuzes waar bronnen
> uiteenlopen staan gemarkeerd met **⚠️ AANNAME**. Machineleesbaar in
> [`rulesets/boerenbridge.json`](../rulesets/boerenbridge.json).
>
> Boerenbridge is het tweede spel in deze app zonder vaste ploegen — en het enige
> waarin het **aantal kaarten per ronde verandert**. Je wint niet door zo veel
> mogelijk slagen te halen, maar door **exact** te halen wat je voorspeld hebt.
>
> Geraadpleegde bronnen (via zoekresultaten): nl.wikipedia.org (Boerenbridge),
> nl.wikibooks.org (Kaartspel/Boerenbridge), spelscout.nl, identitygames.nl,
> leukstebordspellen.nl, boerenbridge.com (WK-reglement).

## 1. Scope

- **Spel:** boerenbridge, in deze app met **4 spelers**, **ieder voor zich**.
  (Aan tafel speelt men het met 3 tot 8; de app heeft vier stoelen.)
- **Ruleset-id:** `boerenbridge`.
- Doel: elke ronde **precies** het aantal slagen halen dat je voorspeld hebt.
  Wie na de laatste ronde het meeste punten heeft, wint.

## 2. Basis

| Onderwerp | Regel |
|---|---|
| Spelers | 4, elk voor zich. |
| Kaarten | 52, geen jokers. |
| Kaartrangorde | A (hoog) – H – V – B – 10 – … – 2 (laag). |
| Kaarten per ronde | **Wisselt** — zie §3. |
| Troef | De kaart die na het delen wordt **omgedraaid** (§4). |
| Speelrichting | Met de klok mee; de deler schuift elke ronde door. |

## 3. De rondestructuur — het hart van dit spel

Het aantal kaarten loopt eerst **op**, blijft even op zijn hoogtepunt en loopt dan
weer **af**. Het WK-reglement speelt zeventien rondes:

```
1 2 3 4 5 6 7 8 8 8 7 6 5 4 3 2 1
```

Dat zijn drie rondes op acht kaarten (rondes 8, 9 en 10). ✅ *Deze structuur staat
in meerdere bronnen.*

In de app is de vorm instelbaar, want zeventien rondes duurt lang aan tafel:

| Vorm | Rondes | Beschrijving |
|---|---|---|
| `klassiek` | 17 | 1…8, 8, 8, 8…1 — het WK-reglement hierboven. **Standaard.** |
| `op-en-neer` | 15 | 1…8, 8…1, zonder de extra herhalingen. |
| `aflopend` | 8 | 8, 7, … , 1 — een korte partij. |

**⚠️ AANNAME** — dat de app een kortere vorm aanbiedt is een toevoeging, geen
regelwijziging; `klassiek` blijft de standaard.

Met 4 spelers en 8 kaarten liggen er 32 kaarten op tafel; er blijft dus altijd een
stok over om de troefkaart uit om te draaien.

## 4. Delen en troef

1. De deler geeft iedereen het aantal kaarten van deze ronde.
2. De **volgende kaart van de stok** wordt omgedraaid: die kleur is troef.
   ✅ *Standaardregel.*
3. Is er geen kaart meer over (alle 52 gedeeld), dan speelt men **zonder troef**.
   **⚠️ AANNAME** — komt in de app enkel voor als je de rondes tot 13 laat lopen.

## 5. Voorspellen

1. Iedereen kijkt naar zijn kaarten en voorspelt, **vanaf links van de deler**,
   hoeveel slagen hij zal halen. De deler voorspelt als laatste.
2. Een voorspelling van **0** mag: die is vaak juist het moeilijkst.
3. **Deler klemzetten** (*screw the dealer*): sommige tafels verbieden de deler het
   getal waarmee het totaal van alle voorspellingen exact gelijk wordt aan het aantal
   slagen — dan kan niet iedereen slagen. **⚠️ AANNAME** — deze regel staat niet in de
   Nederlandse bronnen; in de app staat ze standaard **uit** en is ze aan te zetten.

## 6. Het spel

1. Links van de deler komt uit. **⚠️ AANNAME** — sommige tafels laten de winnaar van
   de vorige ronde uitkomen.
2. **Kleur bekennen is verplicht.** Kan je niet volgen, dan mag je alles bijgooien,
   troef inbegrepen — troeven is nooit verplicht. ✅ *Standaardregel.*
3. De hoogste troef wint de slag; ligt er geen troef, dan de hoogste kaart in de
   gevraagde kleur. De winnaar komt uit in de volgende slag.

## 7. Punten tellen

| Uitkomst | Punten |
|---|---|
| **Precies** je voorspelling gehaald | **10** + **3** per gehaalde slag |
| Ernaast | **−3** per slag verschil |

✅ *Beide staan zo in de Nederlandse bronnen.* Een juiste voorspelling van drie
slagen levert dus 10 + 9 = **19** punten op; wie er twee naast zit verliest er **6**.

- Een juiste voorspelling van **0** levert **10** punten op — het minimum voor wie
  het goed heeft.
- Na de laatste ronde wint wie het **hoogste** totaal heeft.

## 8. Verschillen met de andere spellen in deze app

| | Boerenbridge | De andere spellen |
|---|---|---|
| Handgrootte | **wisselt per ronde** | vast |
| Ploegen | ieder voor zich | vaste ploegen (behalve hartenjagen) |
| Doel | **exact** je voorspelling halen | zo veel mogelijk slagen of punten |
| Troefplicht | nooit | per spel verschillend |
| Te veel halen | **straft**, net als te weinig | is bijna overal goed |

## Open regelvragen

1. **Partijvorm** — blijft `klassiek` (17 rondes) de standaard, of liever korter?
2. **Deler klemzetten** — standaard aanzetten, of aan-uit laten zoals nu?
3. **Uitkomst** — links van de deler (nu), of de winnaar van de vorige ronde?
4. **Puntentelling** — 10 + 3 per slag (nu), of de internationale variant
   10 + 1 per slag en niets bij een fout?
5. **Meer dan vier spelers** — de app heeft vier stoelen; is 3–6 spelers ooit nodig?
