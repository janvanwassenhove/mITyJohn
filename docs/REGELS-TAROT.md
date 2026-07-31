# RÈGLES / REGELS — Frans tarot (*jeu de tarot*)

> **Status:** onderzoeksdocument, opgesteld zoals `REGELS.md`. Keuzes waar bronnen
> uiteenlopen of waar de app bewust vereenvoudigt, staan gemarkeerd met
> **⚠️ AANNAME**. Machineleesbaar in [`rulesets/tarot.json`](../rulesets/tarot.json).
>
> Tarot is het apart traject dat bij de spelkeuze van 2026-07-29 al werd aangekondigd:
> het is het eerste spel in deze app met een **eigen kaartset van 78 kaarten** en met
> een **variabel aantal spelers** (3, 4 of 5). Alle andere spellen zitten vast op vier
> stoelen en 32 of 52 kaarten.
>
> Geraadpleegde bronnen (via zoekresultaten): fftarot.fr (Règlement officiel en
> Règlement officiel à 5 joueurs), regles.com, bordeauxgames.com, letarot.net,
> le-tarot.fr, exoty.com.

## 1. Scope

- **Spel:** *tarot français*, met **3, 4 of 5 spelers**.
- **Ruleset-id:** `tarot`.
- Eén speler — de **preneur** — neemt het op tegen alle anderen. Bij vijf spelers
  roept hij een heer en krijgt hij daarmee een verborgen partner (§7).
- Niet in deze eerste versie: **poignée**, **aangekondigde chelem**, **misère** en de
  officiële toernooitelling met meerdere gevers. Zie de open vragen.

## 2. De kaarten

Het tarotspel telt **78 kaarten**, in drie soorten:

| Soort | Aantal | Volgorde (hoog → laag) |
|---|---|---|
| **Kleuren** (♠ ♥ ♦ ♣) | 4 × 14 = 56 | Roi – Dame – Cavalier – Valet – 10 – 9 – … – 1 |
| **Atouts** (troeven) | 21, genummerd 1 t.e.m. 21 | 21 is de hoogste, 1 de laagste |
| **Excuse** | 1 | staat buiten de rangorde (§6.3) |

De kleuren hebben dus **vier** pop-kaarten in plaats van drie: tussen de boer en de
vrouw zit de **cavalier** (ruiter).

### 2.1 De bouts

Drie kaarten heten **bouts** (of *oudlers*): de **1 van atout** ("le petit"), de
**21** en de **excuse**. Ze zijn elk 4,5 punt waard én ze bepalen hoeveel de preneur
moet halen (§8). ✅ *Standaardregel.*

### 2.2 Kaartwaarden

Er wordt geteld **per twee kaarten**, want elke waarde eindigt op een halve punt:

| Kaart | Punten |
|---|---|
| Bout of **Roi** | 4,5 |
| **Dame** | 3,5 |
| **Cavalier** | 2,5 |
| **Valet** | 1,5 |
| elke andere kaart | 0,5 |

Samen **91 punten**. ✅ *Standaardregel.* De app rekent intern in **halve punten**
(dus ×2: 9, 7, 5, 3, 1 — samen 182) zodat er nooit met kommagetallen gerekend wordt,
en toont de gewone waarden.

## 3. Delen

| Spelers | Kaarten per speler | Chien |
|---|---|---|
| 3 | 24 | 6 |
| 4 | 18 | 6 |
| 5 | 15 | 3 |

Er wordt **per drie kaarten** gedeeld, tegen de klok in; de **chien** (het talon)
wordt er kaart per kaart uit opgebouwd. De chien mag niet met de eerste of de laatste
kaart van het spel gevuld worden. ✅ *Standaardregel.*

**⚠️ AANNAME** — de app deelt met de klok mee, zoals alle andere spellen; het
Franse tarot deelt traditioneel tegen de klok in. Op het resultaat heeft dat geen
invloed, wel op wie er naast wie zit.

## 4. Bieden

Vanaf links van de deler mag elke speler één keer bieden, hoger dan wat er ligt:

| Contract | Chien | Factor |
|---|---|---|
| **Passe** | — | — |
| **Petite** (of *prise*) | de preneur ziet de chien en maakt een écart | ×1 |
| **Garde** | idem | ×2 |
| **Garde sans** (le chien) | de chien blijft dicht en telt **voor de preneur** | ×4 |
| **Garde contre** (le chien) | de chien blijft dicht en telt **voor de verdediging** | ×6 |

Past iedereen, dan worden de kaarten binnengegooid en deelt de volgende speler
opnieuw. ✅ *Standaardregel.*

## 5. De chien en de écart

Bij **petite** en **garde** wordt de chien **open** op tafel gelegd, de preneur neemt
hem in zijn hand en legt er evenveel kaarten voor terug — de **écart**. Die kaarten
tellen aan het eind mee voor de preneur.

Wat mag je **niet** in de écart leggen:

1. geen **heren**;
2. geen **bouts**;
3. **atouts** enkel als het niet anders kan, en dan **open** op tafel. ✅ *Standaardregel.*

**⚠️ AANNAME** — de app laat atouts in de écart alleen toe wanneer de hand anders
geen geldige écart oplevert, en toont ze dan; de verplichting om ze te *tonen* is in
een spel tegen bots enkel informatief.

## 6. Het spel

1. Links van de deler komt uit. ✅ *Standaardregel.*
2. **Kleur bekennen is verplicht.**
3. Kan je de gevraagde kleur niet volgen, dan **moet je een atout spelen**
   (*obligation de couper*).
4. Ligt er al een atout, dan moet je **hoger** gaan als je kan (*monter à l'atout*).
   Kan je niet hoger, dan moet je toch een atout leggen; heb je er geen, dan gooi je
   vrij bij. ✅ *Standaardregel.*
5. Wordt er een **atout gevraagd**, dan geldt dezelfde stijgplicht.

### 6.3 De excuse

De excuse is de vrijbuiter van het spel:

- Je mag hem **altijd** spelen, ook als je zou moeten volgen of troeven.
- Hij **wint nooit** een slag.
- Hij blijft in de **slagen van je eigen kamp**: wie de slag wint krijgt in ruil een
  waardeloze kaart (0,5 punt) terug. ✅ *Standaardregel.*
- Speel je hem in de **laatste slag**, dan gaat hij wél naar de winnaar van die slag.
  **⚠️ AANNAME** — behalve bij een chelem; die uitzondering zit er niet in.

## 7. Vijf spelers: de geroepen heer

Bij vijf spelers roept de preneur meteen na zijn bod een **heer**. Wie die kaart heeft,
is zijn partner — maar dat blijft **geheim** tot de geroepen heer valt.

- Roept de preneur een heer die hij **zelf** heeft, dan speelt hij alleen tegen vier.
- Heeft hij alle vier de heren, dan mag hij een **dame** roepen. ✅ *Standaardregel.*

Bij drie en vier spelers is er geen partner: de preneur staat altijd alleen.

## 8. Wat moet de preneur halen?

Het doel hangt af van het aantal **bouts** in zijn slagen:

| Bouts | Nodig |
|---|---|
| 0 | **56** |
| 1 | **51** |
| 2 | **41** |
| 3 | **36** |

✅ *Standaardregel.* Van de 91 punten moet hij er dus meer halen naarmate hij minder
bouts heeft.

## 9. Punten tellen

Het resultaat van één gift, voor de preneur:

```
resultaat = ( 25 + |verschil| + petit au bout ) × factor
```

- **verschil** = zijn punten − het doel uit §8. Is dat ≥ 0, dan is het contract
  gehaald en wint hij; anders verliest hij hetzelfde bedrag.
- **25** is het vaste basisbedrag.
- **petit au bout**: wie de 1 van atout in de **laatste slag** binnenhaalt, krijgt er
  **10** bij — voor de preneur als hij hem haalt, tegen hem als de verdediging hem
  haalt. ✅ *Standaardregel.*
- **factor**: petite ×1, garde ×2, garde sans ×4, garde contre ×6.

### 9.1 Verdeling over de spelers

Het spel is **zero-sum**: wat de preneur wint, betalen de anderen samen.

| Spelers | Preneur | Partner | Elke verdediger |
|---|---|---|---|
| 3 | +2 | — | −1 |
| 4 | +3 | — | −1 |
| 5 | +2 | +1 | −1 (drie verdedigers) |

✅ *Bij vijf: twee derde voor de preneur, één derde voor de geroepene.*

### 9.2 Chelem

Wint de preneur **alle** slagen zonder het aan te kondigen, dan komt er **200** bij.
✅ *Standaardregel voor een niet-aangekondigde chelem.* De aangekondigde chelem
(+400, of −200 bij mislukken) zit **niet** in deze versie.

## 10. Verschillen met de andere spellen in deze app

| | Tarot | De andere spellen |
|---|---|---|
| Kaarten | **78**, met atouts en excuse | 32 of 52 |
| Spelers | **3, 4 of 5** | altijd 4 |
| Pop-kaarten | vier: valet, cavalier, dame, roi | drie |
| Troefplicht | troeven **en** stijgen verplicht | per spel verschillend |
| Doel | hangt af van je **bouts** | vast |
| Ploegen | preneur alleen (of +1 bij vijf) | vaste ploegen, of ieder voor zich |

## Open regelvragen

1. **Poignée** — de aankondiging van tien/dertien/vijftien atouts (10/20/30 punten)
   toevoegen?
2. **Aangekondigde chelem** — met de knop "chelem" vóór de eerste slag, +400 of −200?
3. **Misère** — sommige clubs spelen een misère d'atout of misère de tête; nodig?
4. **Speelrichting** — de app speelt met de klok mee; tarot gaat traditioneel tegen
   de klok in. Storend?
5. **Aantal giften** — de app speelt standaard één gift per speler (dus 3, 4 of 5).
   Of liever een vast aantal, of tot een puntendoel?
