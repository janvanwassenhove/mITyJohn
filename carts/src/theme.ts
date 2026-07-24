export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'carts.theme';
let current: Theme = 'system';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function getTheme(): Theme {
  return current;
}

/** Effectief thema: 'system' volgt prefers-color-scheme. */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/** Zet data-theme op <html>; CSS custom properties doen de rest. */
export function applyTheme(theme: Theme): void {
  current = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.dataset['theme'] = resolveTheme(theme);
    document.documentElement.dataset['themeSetting'] = theme;
  }
}

export function initTheme(): Theme {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const theme = isTheme(stored) ? stored : 'system';
  applyTheme(theme);
  if (typeof matchMedia !== 'undefined') {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (current === 'system') applyTheme('system');
    });
  }
  return theme;
}
