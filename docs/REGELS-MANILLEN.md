# REGELS — Manillen (Fase 4-voorbereiding)

> **Status:** **geïmplementeerd** (Fase 4b) op de hieronder gemarkeerde aannames —
> machineleesbaar in [`rulesets/manillen.json`](../rulesets/manillen.json), engine in
> `carts/src/engine/manille.ts`. De zes open vragen onderaan blijven te valideren door
> de opdrachtgever; antwoorden worden regels-eerst doorgevoerd (REGELS → ruleset → engine).
>
> Bronnen (via zoekresultaten; volledige pagina's binnen de sandbox-netwerkpolicy niet
> ophaalbaar): whisthub.com/nl/manille/rules, nl.wikibooks.org (Kaartspel/Manillen),
> thegameroom.org/manillen, kaartspellen.blogspot.com, stayandplay.cards.

## 1. Basis

| Onderwerp | Regel |
|---|---|
| Spelers | 4, in **twee vaste teams van 2** (partners zitten tegenover elkaar). |
| Kaarten | **32 kaarten** (piket): 7 t/m aas per kleur. |
| Kaartrangorde | **10 ("manille", hoog) – A ("manillon") – K – Q – J – 9 – 8 – 7** per kleur. |
| Delen | Elke speler 8 kaarten, in **2-3-3** of 3-3-2. **⚠️ AANNAME** — bronnen noemen ook 2-3-2-varianten voor minder spelers. |
| Speelrichting | Met de klok mee. **⚠️ AANNAME** — consistent met wiezen in deze app; manillen wordt ook vaak in tegenwijzerzin gespeeld. |

## 2. Kaartpunten

| Kaart | Punten |
|---|---|
| 10 (manille) | 5 |
| Aas (manillon) | 4 |
| Heer | 3 |
| Dame | 2 |
| Zot (boer) | 1 |
| 9 / 8 / 7 | 0 |

- Per kleur 15 punten → **60 kaartpunten** in het spel.
- **⚠️ AANNAME — slagpunten:** sommige reglementen tellen daarbovenop 1 punt per slag
  (8 slagen → totaal 68); andere tellen enkel kaartpunten en vergelijken met de helft
  (> 30 wint). Keuze voor de app: **enkel kaartpunten, meer dan 30 wint de gift**;
  het verschil met 30 is de score van de winnende ploeg.

## 3. Troef

- De **deler bepaalt troef** (na het bekijken van zijn kaarten) — of speelt "zonder troef".
  **⚠️ AANNAME** — varianten: laatste kaart draaien, of de maat van de deler kiest;
  "zonder" en "op tafel" (deler legt open) verdubbelen de score in veel reglementen.
- Voorstel voor de app (fase 4a): deler kiest troef, geen multiplicators; multiplicators
  ("zonder", "op tafel", dubbel na verloren gift) als latere variantvlaggen.

## 4. Het spel

1. De speler **links van de deler** komt uit.
2. **Kleur bekennen verplicht.** Kun je niet volgen, dan **moet je troeven**.
3. **Overtroeven verplicht**; **ondertroeven verboden** zolang je een andere keuze hebt.
   **⚠️ AANNAME** — exacte invulling ("kan je enkel ondertroeven, dan moet dat" vs.
   "dan gooi je af") verschilt per bron; de engine-ondersteuning hiervoor bestaat al
   (`mustTrump`/`mustOvertrump`, gebouwd voor de wiezen-cafévariant).
4. **⚠️ AANNAME — meezitten:** in veel Vlaamse reglementen hoef je niet te troeven als je
   maat de slag al aan het winnen is ("de maat ligt"). Te bevestigen; dit vergt een extra
   engine-regel (partnerbewuste troefplicht).
5. Hoogste troef wint, anders hoogste kaart in de gevraagde kleur. Winnaar komt uit.

## 5. Score en einde

- Gift: winnende ploeg scoort **(kaartpunten − 30)**; bij 30-30 ("gedeeld") scoort niemand.
  **⚠️ AANNAME.**
- Sessie: eerste ploeg aan **101 punten** wint. **⚠️ AANNAME** — ook 61 of vrij af te
  spreken totalen komen voor; in de app configureerbaar (`session.targetPoints`).

## 6. Impact op het ruleset-formaat

Manillen vereist uitbreidingen die wiezen niet nodig had — door te voeren vóór de
engine-bouw:

1. **Andere kaartrangorde** per ruleset (10 boven aas) → `deck.rankOrder` moet de
   effectieve vergelijking sturen (nu is A>K>… hardcoded in de engine).
2. **Kaartpunten** (`deck.cardPoints`) en **puntgebaseerde scoring** i.p.v. slaggebaseerd.
3. **Vaste teams** i.p.v. per-gift-bondgenootschappen (geen biedronde).
4. **32-kaarten-deck** (`deck.cards: 32`, `handSize: 8`, `dealPattern` aanpasbaar). 
5. **Troefkeuze door de deler** als aparte spelfase.
6. Doorspelen tot een **puntendoel** i.p.v. een vast aantal giften.

## Open vragen voor de opdrachtgever

1. Slagpunten meetellen (68-model) of enkel kaartpunten (60-model, huidige keuze)?
2. Troefbepaling: deler kiest (huidige keuze), laatste kaart, of maat van de deler?
3. Multiplicators ("zonder troef" ×2, "op tafel" ×4, …) meteen of later?
4. Niet moeten troeven als je maat al ligt — ja/nee?
5. Sessie tot 101 (huidige keuze), 61, of instelbaar?
6. Speelrichting: klok mee (huidige keuze) of tegenwijzerzin?
