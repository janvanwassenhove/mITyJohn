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
    expect(localStorage.getItem('carts.lang')).toBe('fr');
  });

  it('valideert locales', () => {
    for (const locale of LOCALES) expect(isLocale(locale)).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
