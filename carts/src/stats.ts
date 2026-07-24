// Statistieken & historiek (Fase 3): persistente tellers per contract en
// per sessie in localStorage. Puur UI-domein — de engine weet hier niets van.

import type { BotLevel } from './bots';

const STORAGE_KEY = 'carts.stats.v1';

export interface ContractStats {
  played: number; // keren dat dit contract gespeeld werd
  declared: number; // keren dat de mens (mee) speelde
  declaredWon: number; // waarvan gehaald
  points: number; // totaal punten van de mens over deze giften
}

export interface SessionStat {
  ts: number;
  rulesetId: string;
  level: BotLevel;
  totals: number[];
  won: boolean;
}

export interface Stats {
  v: 1;
  contracts: Record<string, ContractStats>;
  sessions: SessionStat[];
}

const empty = (): Stats => ({ v: 1, contracts: {}, sessions: [] });

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const stats = JSON.parse(raw) as Stats;
    if (stats.v !== 1) return empty();
    return stats;
  } catch {
    return empty();
  }
}

function saveStats(stats: Stats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

export function recordGiftStat(
  contractId: string,
  humanDeclared: boolean,
  humanWon: boolean,
  humanPoints: number,
): void {
  const stats = loadStats();
  const c = (stats.contracts[contractId] ??= {
    played: 0,
    declared: 0,
    declaredWon: 0,
    points: 0,
  });
  c.played++;
  if (humanDeclared) {
    c.declared++;
    if (humanWon) c.declaredWon++;
  }
  c.points += humanPoints;
  saveStats(stats);
}

export function recordSessionStat(
  rulesetId: string,
  level: BotLevel,
  totals: number[],
  humanIndex = 0,
): void {
  const stats = loadStats();
  const max = Math.max(...totals);
  stats.sessions.push({
    ts: Date.now(),
    rulesetId,
    level,
    totals: [...totals],
    won: (totals[humanIndex] ?? 0) === max,
  });
  if (stats.sessions.length > 100) stats.sessions.splice(0, stats.sessions.length - 100);
  saveStats(stats);
}

export function clearStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
