// Coach & starterswizard: helpt wie het spel niet kent. Twee delen:
//  1. de wizard — een korte, stapsgewijze uitleg per spel (content in i18n);
//  2. de coach — contextuele tips tijdens het spel, afgeleid van de spelstand.
// DOM-vrij en los testbaar; main.ts vertaalt de tip-id naar een i18n-sleutel.

import type { Card } from './engine/cards';
import type { Gift } from './engine/game';
import type { ManilleGift } from './engine/manille';
import type { BiedenGift } from './engine/bieden';

const COACH_KEY = 'carts.coach';

/** Aantal stappen in de wizard, per spel (de teksten staan in i18n als
 *  `wizard.<spel>.<n>.title` / `.body`). */
export const WIZARD_STEPS: Record<'wiezen' | 'manille' | 'bieden', number> = {
  wiezen: 5,
  manille: 4,
  bieden: 4,
};

export function loadCoachEnabled(): boolean {
  try {
    // Standaard aan: wie het spel al kent, zet hem in twee tikken uit.
    return localStorage.getItem(COACH_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveCoachEnabled(on: boolean): void {
  try {
    localStorage.setItem(COACH_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

export interface CoachTip {
  /** Vertaalt naar i18n-sleutel `coach.tip.<id>`. */
  id: string;
  params?: Record<string, string | number>;
}

/** Ruwe handsterkte in honneurs (A=4, H=3, V=2, B=1) — zelfde maatstaf als de bots. */
export function handStrength(hand: Card[]): number {
  return hand.reduce((sum, c) => sum + Math.max(0, c.rank - 10), 0);
}

function suitCount(hand: Card[], suit: Card['suit']): number {
  return hand.filter((c) => c.suit === suit).length;
}

/** Tip voor wiezen, op basis van de fase en de hand van de speler. */
export function wiezenTip(gift: Gift, player: number): CoachTip | null {
  const hand = gift.deal.hands[player] ?? [];
  switch (gift.phase) {
    case 'bidding': {
      if (gift.bidding.toAct !== player) return null;
      if (gift.bidding.troel) return { id: 'troel' };
      if (gift.bidding.canJoin(player)) {
        const hp = handStrength(hand);
        return hp >= 7 ? { id: 'joinYes' } : { id: 'joinNo' };
      }
      const hp = handStrength(hand);
      const trumps = suitCount(hand, gift.bidding.turnedSuit);
      if (hp >= 9 || (trumps >= 4 && hp >= 6)) {
        return { id: 'askStrong', params: { hp, trumps } };
      }
      return { id: 'askWeak', params: { hp } };
    }
    case 'alleen-choice':
      return { id: 'alone' };
    case 'trump-choice':
      return { id: 'chooseTrump' };
    case 'play': {
      if (gift.toPlay !== player) return null;
      const legal = gift.legalCards(player);
      if (legal.length === 0) return null;
      if (gift.trick.length === 0) {
        if (
          gift.contract?.contract.trump === 'first-card-led' &&
          gift.contract.trumpSuit === null
        ) {
          return { id: 'leadSetsTrump' };
        }
        return { id: 'lead' };
      }
      const ledSuit = gift.trick[0]?.card.suit;
      const canFollow = hand.some((c) => c.suit === ledSuit);
      return canFollow ? { id: 'mustFollow' } : { id: 'cannotFollow' };
    }
    default:
      return null;
  }
}

export function manilleTip(gift: ManilleGift, player: number): CoachTip | null {
  if (gift.phase === 'trump-choice') {
    return gift.trumpChooser === player ? { id: 'manilleTrump' } : null;
  }
  if (gift.phase !== 'play' || gift.toPlay !== player) return null;
  const hand = gift.hands[player] ?? [];
  if (gift.trick.length === 0) return { id: 'manilleLead' };
  const ledSuit = gift.trick[0]?.card.suit;
  const canFollow = hand.some((c) => c.suit === ledSuit);
  return canFollow ? { id: 'mustFollow' } : { id: 'manilleMustTrump' };
}

export function biedenTip(gift: BiedenGift, player: number): CoachTip | null {
  if (gift.phase === 'bidding') {
    if (gift.bidding.toAct !== player) return null;
    const hp = handStrength(gift.hands[player] ?? []);
    return hp >= 12
      ? { id: 'biedenBidYes', params: { hp } }
      : { id: 'biedenBidNo', params: { hp } };
  }
  if (gift.phase !== 'play' || gift.toPlay !== player) return null;
  if (gift.trick.length === 0 && gift.trumpSuit === null) return { id: 'biedenLeadSetsTrump' };
  if (gift.trick.length === 0) return { id: 'lead' };
  return { id: 'biedenFollowOrTrump' };
}
