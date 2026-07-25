// Eenmalige sleutelmigratie: de app heette vroeger "Carts" en bewaarde alles
// onder `carts.*`. Zonder deze stap zou iedereen na de hernoeming zijn lopende
// sessie, scorebord, statistieken en instellingen kwijt zijn.
//
// Draait vóór de rest van de app (import in main.ts). Bestaande `cards.*`-waarden
// winnen altijd; oude sleutels blijven staan zodat een terugrol niets stukmaakt.

const OLD_PREFIX = 'carts.';
const NEW_PREFIX = 'cards.';

export function migrateStorageKeys(): number {
  let moved = 0;
  try {
    const oldKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(OLD_PREFIX)) oldKeys.push(key);
    }
    for (const key of oldKeys) {
      const target = NEW_PREFIX + key.slice(OLD_PREFIX.length);
      if (localStorage.getItem(target) !== null) continue;
      const value = localStorage.getItem(key);
      if (value === null) continue;
      localStorage.setItem(target, value);
      moved += 1;
    }
  } catch {
    /* localStorage kan geblokkeerd zijn */
  }
  return moved;
}
