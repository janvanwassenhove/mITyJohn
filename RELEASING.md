# Releasen

Werkafspraak voor releases in deze repo. Kort: **elke release toont wat er veranderd is,
en screenshots horen daar altijd bij.**

## Vaste regel: screenshots in elke release note

Een release note zonder beeld dwingt de lezer om de app te openen om te zien wat er nieuw
is. Daarom:

1. Bij elke release van `cards/` **altijd minstens één screenshot** in de release note,
   en bij UI-wijzigingen een **voor/na**-paar.
2. Dezelfde beelden staan in `cards/README.md`, zodat de repo-pagina meteen laat zien
   waar het over gaat.
3. Ze staan ook op **mityjohn.com**: `node scripts/fetch-screenshots.mjs` schaalt
   `cards/docs/screenshots/**` naar kaartformaat (de storetegel op de homepage) en
   paginaformaat (de app-detailpagina). Draai daarna
   `node scripts/build-image-dims.mjs`, anders rendert markdown de nieuwe beelden
   zonder afmetingen en schuift de pagina bij het laden.
4. De beelden zijn **gegenereerd, niet met de hand geknipt** — zo blijven ze consistent
   in formaat, taal en thema, en zijn ze reproduceerbaar.

## Screenshots vernieuwen

```bash
cd cards
npm ci
npm run build        # de screenshots draaien tegen dist/, niet tegen de dev-server
npm run screenshots  # schrijft naar cards/docs/screenshots/
```

Dat levert vier scènes — `start`, `wizard`, `spel`, `scorebord` — telkens als
`mobile`/`desktop` × `light`/`dark`, in het Nederlands. De generator
(`cards/scripts/screenshots.mjs`) serveert `dist/` op `/cards/` en stuurt een lokale
Chromium; er wordt nooit een browser gedownload (`PLAYWRIGHT_BROWSERS_PATH` of
`CHROMIUM_PATH` wijst naar de bestaande installatie).

Een nieuwe scène toevoegen: één entry bijzetten in de `SCENES`-lijst in dat script.

Commit de vernieuwde `cards/docs/screenshots/**` mee met de wijziging die ze toont.

## Release note schrijven

Structuur die we aanhouden:

```markdown
## Cards <versie> — <korte titel>

<één alinea: wat kan je nu dat je daarvoor niet kon>

![Startscherm](…/start-mobile-light.png) ![Aan tafel](…/spel-mobile-dark.png)

### Nieuw

- …

### Verbeterd

- …

### Regels & documentatie

- verwijzingen naar `docs/REGELS*.md` bij regelwijzigingen, met de aannames die nog
  openstaan
```

Verwijs naar de beelden met een URL die blijft werken buiten de repo (raw-link op de
release-tag, of upload ze bij de release zelf) — relatieve paden werken niet in
GitHub-release-notes.

## Vóór je release

- [ ] `cards/`: `npm run lint`, `npm run test`, `npm run build` groen
- [ ] root: `npm run check`, `npm run build` groen
- [ ] screenshots vernieuwd en mee gecommit
- [ ] `cards/README.md` toont de actuele beelden
- [ ] site-beelden vernieuwd (`scripts/fetch-screenshots.mjs` + `build-image-dims.mjs`)
      en `src/content/apps/cards.md` beschrijft nog wat de app nú doet
- [ ] regelwijzigingen staan in `docs/REGELS*.md` **vóór** ze in `rulesets/*.json` en de
      engine zitten (zie `CLAUDE.md`)
