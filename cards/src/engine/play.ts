// Slagen spelen — REGELS.md §6: kleur bekennen verplicht. Standaard geen
// (over)troefplicht; varianten (vlaams-cafe) kunnen die via de ruleset
// aanzetten. Hoogste troef wint, anders hoogste kaart in de gevraagde kleur.

import { type Card, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';

export interface TrickPlay {
  player: number;
  card: Card;
}

export interface PlayRules {
  mustTrump?: boolean;
  mustOvertrump?: boolean;
}

export function legalPlays(
  hand: Card[],
  trick: TrickPlay[],
  trumpSuit: Suit | null = null,
  rules: PlayRules = {},
): Card[] {
  if (trick.length === 0) return hand;
  const ledSuit = (trick[0] as TrickPlay).card.suit;
  const follow = hand.filter((c) => c.suit === ledSuit);
  if (follow.length > 0) return follow;
  // Niet kunnen volgen: variant met troefplicht (REGELS.md §9-variant vlaams-cafe)
  if (trumpSuit !== null && (rules.mustTrump || rules.mustOvertrump)) {
    const trumps = hand.filter((c) => c.suit === trumpSuit);
    if (trumps.length > 0) {
      if (rules.mustOvertrump) {
        const highestPlayed = trick
          .filter((p) => p.card.suit === trumpSuit)
          .reduce((max, p) => Math.max(max, p.card.rank), 0);
        const over = trumps.filter((c) => c.rank > highestPlayed);
        if (over.length > 0) return over;
      }
      return trumps;
    }
  }
  return hand;
}

export function trickWinner(trick: TrickPlay[], trumpSuit: Suit | null): number {
  if (trick.length !== PLAYER_COUNT) throw new Error('Slag is niet compleet');
  let best = trick[0] as TrickPlay;
  for (const play of trick.slice(1)) {
    const c = play.card;
    const b = best.card;
    const cTrump = trumpSuit !== null && c.suit === trumpSuit;
    const bTrump = trumpSuit !== null && b.suit === trumpSuit;
    if (cTrump && !bTrump) best = play;
    else if (cTrump === bTrump && c.suit === b.suit && c.rank > b.rank) best = play;
  }
  return best.player;
}

/** Volgorde van spelers in een slag, beginnend bij de uitkomer. */
export function trickOrder(leader: number): number[] {
  const order: number[] = [];
  let p = leader;
  for (let i = 0; i < PLAYER_COUNT; i++) {
    order.push(p);
    p = nextPlayer(p);
  }
  return order;
}
