// Eenvoudige heuristische bots voor Fase 1: conservatief bieden,
// pragmatisch spelen. Geen kaartgeheugen of partnersignalen — dat is
// latere-fase-werk; de engine bewaakt de legaliteit.

import { ACE, type Card, type Suit } from './engine/cards';
import type { Bidding, BidAction } from './engine/bidding';
import type { Gift } from './engine/game';
import { SUITS } from './engine/cards';

/** Ruwe handsterkte: honneurs + lengte in de (kandidaat-)troefkleur. */
function honourPoints(hand: Card[]): number {
  return hand.reduce((sum, c) => sum + Math.max(0, c.rank - 10), 0);
}

function suitCount(hand: Card[], suit: Suit): number {
  return hand.filter((c) => c.suit === suit).length;
}

export function longestSuit(hand: Card[]): Suit {
  let best: Suit = 'S';
  for (const suit of SUITS) {
    if (suitCount(hand, suit) > suitCount(hand, best)) best = suit;
  }
  return best;
}

/** Is de hand geschikt voor miserie: veel lage kaarten, geen azen/heren. */
function miserieScore(hand: Card[]): number {
  return hand.filter((c) => c.rank <= 7).length - hand.filter((c) => c.rank >= 13).length * 2;
}

export function chooseBid(bidding: Bidding, player: number, hand: Card[]): BidAction {
  const bids = bidding.legalBids(player);
  const trump = bidding.turnedSuit;
  const hp = honourPoints(hand);
  const trumps = suitCount(hand, trump);
  const longest = longestSuit(hand);
  const longestLen = suitCount(hand, longest);

  // Abondance: zeer sterke lange kleur.
  if (
    bids.some((c) => c.id === 'abondance-9') &&
    longestLen >= 7 &&
    hp >= 12 &&
    hand.filter((c) => c.suit === longest && c.rank >= 12).length >= 3
  ) {
    return { type: 'bid', contractId: 'abondance-9' };
  }
  // Miserie: uitgesproken zwakke hand.
  if (bids.some((c) => c.id === 'miserie') && miserieScore(hand) >= 8 && hp <= 1) {
    return { type: 'bid', contractId: 'miserie' };
  }
  // Meegaan of mede-miserie.
  if (bidding.canJoin(player)) {
    const current = bidding.current?.contract.id;
    if (current === 'vraag-en-mee' && (hp >= 7 || (trumps >= 3 && hp >= 5))) {
      return { type: 'join' };
    }
    if (current === 'miserie' && miserieScore(hand) >= 8 && hp <= 1) {
      return { type: 'join' };
    }
  }
  // Vragen: degelijke hand met troefsteun.
  if (bids.some((c) => c.id === 'vraag-en-mee') && (hp >= 9 || (trumps >= 4 && hp >= 6))) {
    return { type: 'bid', contractId: 'vraag-en-mee' };
  }
  return { type: 'pass' };
}

/** §5.2: alleen doorspelen met een stevige hand. */
export function chooseAlleen(hand: Card[], trump: Suit): boolean {
  return honourPoints(hand) >= 11 && suitCount(hand, trump) >= 4;
}

export function chooseTrumpSuit(hand: Card[]): Suit {
  return longestSuit(hand);
}

export function chooseCard(gift: Gift, player: number): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const contract = gift.contract;
  const trumpSuit = contract?.trumpSuit ?? null;
  const isMiserie = contract?.contract.target.tricks === 0;
  const isDeclarer = contract?.declarers.includes(player) ?? false;
  const trick = gift.trick;

  const lowest = [...legal].sort((a, b) => a.rank - b.rank)[0] as Card;

  // Miserie-bieder: blijf zo laag mogelijk onder de slag.
  if (isMiserie && isDeclarer) {
    if (trick.length === 0) return lowest;
    const winning = currentWinning(gift, trumpSuit);
    const under = legal
      .filter((c) => c.suit === winning.suit && c.rank < winning.rank)
      .sort((a, b) => b.rank - a.rank)[0];
    return under ?? lowest;
  }

  if (trick.length === 0) {
    // Uitkomen: hoogste van de langste kleur (aas eerst als die er is).
    const ace = legal.find((c) => c.rank === ACE && (trumpSuit === null || c.suit !== trumpSuit));
    if (ace) return ace;
    const suit = longestSuit(legal);
    return legal.filter((c) => c.suit === suit).sort((a, b) => b.rank - a.rank)[0] as Card;
  }

  // Volgen: win zo goedkoop mogelijk, anders gooi de laagste bij.
  const winning = currentWinning(gift, trumpSuit);
  const winners = legal
    .filter((c) => beats(c, winning, trumpSuit, (trick[0] as { card: Card }).card.suit))
    .sort((a, b) => a.rank - b.rank);
  const lastToPlay = trick.length === 3;
  if (winners.length > 0 && (lastToPlay || (winners[0] as Card).rank >= 11)) {
    return winners[0] as Card;
  }
  return lowest;
}

function currentWinning(gift: Gift, trumpSuit: Suit | null): Card {
  let best = (gift.trick[0] as { card: Card }).card;
  for (const play of gift.trick.slice(1)) {
    if (beats(play.card, best, trumpSuit, (gift.trick[0] as { card: Card }).card.suit)) {
      best = play.card;
    }
  }
  return best;
}

function beats(candidate: Card, target: Card, trumpSuit: Suit | null, ledSuit: Suit): boolean {
  const cTrump = trumpSuit !== null && candidate.suit === trumpSuit;
  const tTrump = trumpSuit !== null && target.suit === trumpSuit;
  if (cTrump && !tTrump) return true;
  if (!cTrump && tTrump) return false;
  if (candidate.suit === target.suit) return candidate.rank > target.rank;
  return candidate.suit === ledSuit && target.suit !== ledSuit;
}
