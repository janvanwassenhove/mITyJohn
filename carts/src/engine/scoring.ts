// Puntentelling — REGELS.md §5 en §7. Zero-sum per gift:
// solocontracten verrekenen met elk van de drie tegenspelers,
// teamcontracten per teamlid met één tegenspeler. Miseries worden
// per bieder afzonderlijk gescoord (§5.5).

import { PLAYER_COUNT } from './deal';
import type { Contract } from '../ruleset';

const TOTAL_TRICKS = 13;

export interface GiftScoreInput {
  contract: Contract;
  declarers: number[];
  /** Aantal gewonnen slagen per speler (index 0..3). */
  tricksWon: number[];
}

export interface GiftScore {
  /** Puntenmutatie per speler, sommeert tot 0. */
  points: number[];
  /** Is (elk team-/solocontract van) de spelende partij geslaagd? Per declarer. */
  success: boolean[];
}

function contractPoints(contract: Contract, tricks: number): { points: number; success: boolean } {
  const target = contract.target.tricks;
  const exact = contract.target.exact ?? false;
  const success = exact ? tricks === target : tricks >= target;
  const { base, perOvertrick = 0, perUndertrick = 0, voleBonus = 0 } = contract.score;
  if (success) {
    let points = base + perOvertrick * (tricks - target);
    if (voleBonus > 0 && tricks === TOTAL_TRICKS) points += voleBonus;
    return { points, success };
  }
  const short = exact ? 1 : target - tricks;
  return { points: -(base + perUndertrick * Math.max(0, short - 0)), success };
}

export function scoreGift({ contract, declarers, tricksWon }: GiftScoreInput): GiftScore {
  const points = new Array<number>(PLAYER_COUNT).fill(0);
  const success: boolean[] = [];

  if (contract.team === 2) {
    // Team van 2 (vraag & mee, troel): gezamenlijke slagen; elk teamlid
    // verrekent met één tegenspeler → teamleden en tegenspelers krijgen ±p.
    const teamTricks = declarers.reduce((sum, d) => sum + (tricksWon[d] ?? 0), 0);
    const { points: p, success: ok } = contractPoints(contract, teamTricks);
    for (let player = 0; player < PLAYER_COUNT; player++) {
      points[player] = declarers.includes(player) ? p : -p;
    }
    success.push(ok, ok);
    return { points, success };
  }

  // Solocontracten; meerdere afzonderlijke bieders mogelijk (miseries).
  for (const declarer of declarers) {
    const { points: p, success: ok } = contractPoints(contract, tricksWon[declarer] ?? 0);
    success.push(ok);
    for (let player = 0; player < PLAYER_COUNT; player++) {
      if (player === declarer) points[player] = (points[player] ?? 0) + 3 * p;
      else points[player] = (points[player] ?? 0) - p;
    }
  }
  return { points, success };
}
