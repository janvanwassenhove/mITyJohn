import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, isLocale, setLocale, t } from './index';
import nl from './locales/nl.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale(DEFAULT_LOCALE);
  });

  it('heeft dezelfde sleutels in elke locale', () => {
    const nlKeys = Object.keys(nl).sort();
    expect(Object.keys(en).sort()).toEqual(nlKeys);
    expect(Object.keys(fr).sort()).toEqual(nlKeys);
  });

  // Sleutelpariteit alleen volstaat niet: een vergeten vertaling is een sleutel
  // die er wél is maar nog de Nederlandse tekst bevat. Eigennamen (spelnamen,
  // contracten) en woorden die in de drie talen hetzelfde zijn, staan hieronder.
  const MAG_GELIJK = new Set([
    'app.title',
    'placeholder.heading',
    'play.contract',
    'coach.title',
    'controls.menu',
    'ruleset.vlaams-cafe',
    'ruleset.kleurenwiezen',
    'game.wiezen',
    'game.bieden',
    'guide.kleurenwiezen.title',
    'guide.bieden.title',
    'guide.manillen.title',
    'guide.gewoon-wiezen.troel.title',
    'scorebord.modeWiezen',
    'scorebord.contract',
    'stats.contract',
    'contract.troel',
    'contract.solo',
    'contract.piccolo',
    'contract.abondance-9',
    'contract.abondance-10',
    'contract.abondance-11',
    'contract.abondance-12',
    // Klaverjastermen blijven Nederlands in de drie talen, net als 'troel' en
    // 'abondance' bij wiezen — het zijn de namen van het spel zelf.
    'game.klaverjassen',
    'guide.klaverjassen.title',
    'guide.klaverjassen.roem.title',
    'klaverjas.roemTotal',
    'klaverjas.roemLine',
    'klaverjas.roem.stuk',
    // Belotetermen zijn Frans en blijven in de drie talen staan.
    'game.belote',
    'guide.belote.title',
    'guide.belote.annonces.title',
    'wizard.belote.4.title',
    'belote.annonceTotal',
    'belote.beloteTotal',
    'belote.annonceLine',
    'belote.annonce.tierce',
    'belote.annonce.cinquante',
    'belote.annonce.cent',
    'belote.annonce.carreOther',
    // Tarottermen zijn Frans en blijven overal staan; 'partner' is bovendien in
    // het Nederlands en het Engels hetzelfde woord.
    'tarot.partner',
    'tarot.bouts',
    'tarot.atout',
    'tarot.contract.petite',
    'tarot.contract.garde',
    'tarot.contract.garde-sans',
    'tarot.contract.garde-contre',
    'tarot.rank.11',
    'tarot.rank.12',
    'tarot.rank.13',
    'tarot.opt.exact',
    'tarot.poignee.simple',
    'tarot.poigneeChip',
    // Scorebord: dezelfde Franse tarot- en belotetermen.
    'scorebord.bl.belote',
    'scorebord.tt.preneur',
    'scorebord.tt.bouts',
    'scorebord.tt.petitAuBout',
    'scorebord.tt.poignee',
    'scorebord.tt.chelem',
  ]);

  it.each([
    ['en', en],
    ['fr', fr],
  ])('heeft geen onvertaalde Nederlandse tekst in %s', (_locale, bundle) => {
    const nlText = nl as Record<string, string>;
    const other = bundle as Record<string, string>;
    const onvertaald = Object.keys(nlText).filter(
      (k) => !MAG_GELIJK.has(k) && other[k] === nlText[k],
    );
    expect(onvertaald).toEqual([]);
  });

  it('vertaalt per actieve locale', () => {
    setLocale('nl');
    expect(t('theme.light')).toBe('Licht');
    setLocale('en');
    expect(t('theme.light')).toBe('Light');
    setLocale('fr');
    expect(t('theme.light')).toBe('Clair');
  });

  it('interpoleert placeholders', () => {
    setLocale('en');
    expect(t('placeholder.ruleset', { name: 'X', version: '1.0', contracts: 11 })).toBe(
      'Loaded ruleset: X (v1.0, 11 contracts)',
    );
  });

  it('zet document.lang en bewaart de keuze', () => {
    setLocale('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(localStorage.getItem('cards.lang')).toBe('fr');
  });

  it('valideert locales', () => {
    for (const locale of LOCALES) expect(isLocale(locale)).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
