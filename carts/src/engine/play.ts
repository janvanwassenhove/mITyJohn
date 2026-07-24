// Slagen spelen — REGELS.md §6: kleur bekennen verplicht, geen (over)troefplicht;
// hoogste troef wint, anders hoogste kaart in de gevraagde kleur.

import { sameCard, type Card, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';

export interface TrickPlay {
  player: number;
  card: Card;
}

export function legalPlays(
  hand: Card[],
  trick: TrickPlay[],
  forcedLead?: Card | undefined,
): Card[] {
  if (trick.length === 0) {
    if (forcedLead) {
      const forced = hand.filter((c) => sameCard(c, forcedLead));
      if (forced.length > 0) return forced;
    }
    return hand;
  }
  const ledSuit = (trick[0] as TrickPlay).card.suit;
  const follow = hand.filter((c) => c.suit === ledSuit);
  return follow.length > 0 ? follow : hand;
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
