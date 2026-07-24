import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, initTheme, resolveTheme } from './theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    delete document.documentElement.dataset['themeSetting'];
  });

  it('zet data-theme op html en bewaart de keuze', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('carts.theme')).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('herstelt de opgeslagen voorkeur bij init', () => {
    localStorage.setItem('carts.theme', 'dark');
    expect(initTheme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('valt terug op systeem bij ontbrekende of ongeldige voorkeur', () => {
    localStorage.setItem('carts.theme', 'paars');
    expect(initTheme()).toBe('system');
    expect(['light', 'dark']).toContain(resolveTheme('system'));
  });
});
