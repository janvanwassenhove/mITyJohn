import nl from './locales/nl.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const LOCALES = ['nl', 'en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'nl';

export type MessageKey = keyof typeof nl;

const messages: Record<Locale, Record<string, string>> = { nl, en, fr };

const STORAGE_KEY = 'carts.lang';
let current: Locale = DEFAULT_LOCALE;
const listeners = new Set<(locale: Locale) => void>();

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Bepaal de startlocale: opgeslagen voorkeur > browsertaal > nl. */
export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* localStorage kan geblokkeerd zijn */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : '';
  return isLocale(nav) ? nav : DEFAULT_LOCALE;
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
  listeners.forEach((fn) => fn(locale));
}

export function onLocaleChange(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Vertaal een sleutel, met {placeholder}-interpolatie en nl als fallback. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template = messages[current][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
