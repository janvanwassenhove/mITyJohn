import { beforeEach, describe, expect, it } from 'vitest';
import { migrateStorageKeys } from './migrate';

describe('sleutelmigratie carts.* → cards.*', () => {
  beforeEach(() => localStorage.clear());

  it('neemt oude sleutels over', () => {
    localStorage.setItem('carts.theme', 'dark');
    localStorage.setItem('carts.session.v1', '{"v":1}');
    expect(migrateStorageKeys()).toBe(2);
    expect(localStorage.getItem('cards.theme')).toBe('dark');
    expect(localStorage.getItem('cards.session.v1')).toBe('{"v":1}');
  });

  it('overschrijft een bestaande nieuwe waarde nooit', () => {
    localStorage.setItem('carts.theme', 'dark');
    localStorage.setItem('cards.theme', 'light');
    expect(migrateStorageKeys()).toBe(0);
    expect(localStorage.getItem('cards.theme')).toBe('light');
  });

  it('laat de oude sleutels staan, zodat terugrollen niets kost', () => {
    localStorage.setItem('carts.lang', 'fr');
    migrateStorageKeys();
    expect(localStorage.getItem('carts.lang')).toBe('fr');
  });

  it('doet niets zonder oude sleutels', () => {
    localStorage.setItem('cards.lang', 'nl');
    localStorage.setItem('iets.anders', 'x');
    expect(migrateStorageKeys()).toBe(0);
  });
});
