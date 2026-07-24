// Scorebord voor een fysiek kaartspel (Fase 5): houd handmatig de punten bij
// van een spel dat aan de echte tafel wordt gespeeld. Geen bots, geen engine —
// puur een teller met rondes en lopende totalen, persistent in localStorage.
// De functies zijn puur/immutable zodat ze los testbaar zijn.

const STORAGE_KEY = 'carts.scorebord.v1';

/** 'manueel' = zelf punten intypen; 'wiezen' = contract + slagen + team ingeven,
 *  de app berekent de punten via de wiezen-scoring (zie main.ts). */
export type ScorebordMode = 'manueel' | 'wiezen';

export interface Scorebord {
  v: 1;
  mode: ScorebordMode;
  participants: string[];
  /** Optioneel puntendoel; null = geen doel. */
  target: number | null;
  /** Hoger totaal wint (default) of lager totaal wint (bv. aftelspel). */
  lowWins: boolean;
  /** Eén rij per ronde: punten per deelnemer (zelfde lengte als participants). */
  rounds: number[][];
  /** Optioneel label per ronde (bv. "Troel — Jan + Rita"), parallel aan rounds. */
  labels: string[];
}

export function newScorebord(
  participants: string[],
  target: number | null = null,
  lowWins = false,
  mode: ScorebordMode = 'manueel',
): Scorebord {
  return { v: 1, mode, participants: [...participants], target, lowWins, rounds: [], labels: [] };
}

export function totals(sb: Scorebord): number[] {
  return sb.participants.map((_, i) => sb.rounds.reduce((sum, r) => sum + (r[i] ?? 0), 0));
}

/** Index van de deelnemer aan de leiding (hoogste of laagste totaal). −1 als er
 *  nog geen rondes zijn of het gelijk staat aan de top. */
export function leader(sb: Scorebord): number {
  if (sb.rounds.length === 0) return -1;
  const t = totals(sb);
  const best = sb.lowWins ? Math.min(...t) : Math.max(...t);
  if (t.filter((v) => v === best).length > 1) return -1;
  return t.indexOf(best);
}

/** Wie het doel bereikt heeft (winnaar), of null zolang niemand er is. */
export function winner(sb: Scorebord): number | null {
  if (sb.target === null || sb.rounds.length === 0) return null;
  const t = totals(sb);
  const reached = t
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => (sb.lowWins ? v <= (sb.target as number) : v >= (sb.target as number)));
  if (reached.length === 0) return null;
  const best = sb.lowWins
    ? Math.min(...reached.map((r) => r.v))
    : Math.max(...reached.map((r) => r.v));
  const winners = reached.filter((r) => r.v === best);
  return winners.length === 1 ? (winners[0] as { i: number }).i : null;
}

export function addRound(sb: Scorebord, points: number[], label = ''): Scorebord {
  const row = sb.participants.map((_, i) => points[i] ?? 0);
  return { ...sb, rounds: [...sb.rounds, row], labels: [...sb.labels, label] };
}

export function removeRound(sb: Scorebord, index: number): Scorebord {
  return {
    ...sb,
    rounds: sb.rounds.filter((_, i) => i !== index),
    labels: sb.labels.filter((_, i) => i !== index),
  };
}

export function resetRounds(sb: Scorebord): Scorebord {
  return { ...sb, rounds: [], labels: [] };
}

/* ---------- persistentie ---------- */

export function save(sb: Scorebord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sb));
  } catch {
    /* ignore */
  }
}

export function load(): Scorebord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const sb = JSON.parse(raw) as Scorebord;
    if (
      sb.v !== 1 ||
      !Array.isArray(sb.participants) ||
      sb.participants.length < 2 ||
      !Array.isArray(sb.rounds)
    ) {
      return null;
    }
    // Migratie van oudere borden zonder mode/labels.
    if (sb.mode !== 'wiezen') sb.mode = 'manueel';
    if (!Array.isArray(sb.labels) || sb.labels.length !== sb.rounds.length) {
      sb.labels = sb.rounds.map(() => '');
    }
    return sb;
  } catch {
    return null;
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
