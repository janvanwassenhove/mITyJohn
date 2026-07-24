// Heuristische bots met drie niveaus. Niveau 'sterk' gebruikt de
// slaghistoriek van de gift als kaartgeheugen (Fase 3); de engine bewaakt
// de legaliteit van elke zet.

import { ACE, type Card, type Suit } from './engine/cards';
import type { Bidding, BidAction } from './engine/bidding';
import type { Gift } from './engine/game';
import { cardPoints, strength, teamOf, type ManilleGift } from './engine/manille';
import {
  biedenCardPoints,
  biedenStrength,
  teamOf as biedenTeamOf,
  MIN_BID,
  MAX_BID,
  type BiedenGift,
} from './engine/bieden';
import { SUITS } from './engine/cards';

export const BOT_LEVELS = ['easy', 'normal', 'strong'] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];

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

interface BidThresholds {
  vraagHp: number;
  vraagTrumpHp: number;
  joinHp: number;
  joinTrumpHp: number;
  abondance: boolean;
  miserie: boolean;
}

const BID_THRESHOLDS: Record<BotLevel, BidThresholds> = {
  easy: {
    vraagHp: 12,
    vraagTrumpHp: 9,
    joinHp: 9,
    joinTrumpHp: 7,
    abondance: false,
    miserie: false,
  },
  normal: {
    vraagHp: 9,
    vraagTrumpHp: 6,
    joinHp: 7,
    joinTrumpHp: 5,
    abondance: true,
    miserie: true,
  },
  strong: {
    vraagHp: 8,
    vraagTrumpHp: 6,
    joinHp: 6,
    joinTrumpHp: 5,
    abondance: true,
    miserie: true,
  },
};

export function chooseBid(
  bidding: Bidding,
  player: number,
  hand: Card[],
  level: BotLevel = 'normal',
): BidAction {
  const th = BID_THRESHOLDS[level];
  const bids = bidding.legalBids(player);
  const trump = bidding.turnedSuit;
  const hp = honourPoints(hand);
  const trumps = suitCount(hand, trump);
  const longest = longestSuit(hand);
  const longestLen = suitCount(hand, longest);

  // Abondance: zeer sterke lange kleur.
  if (
    th.abondance &&
    bids.some((c) => c.id === 'abondance-9') &&
    longestLen >= 7 &&
    hp >= (level === 'strong' ? 11 : 12) &&
    hand.filter((c) => c.suit === longest && c.rank >= 12).length >= 3
  ) {
    return { type: 'bid', contractId: 'abondance-9' };
  }
  // Miserie: uitgesproken zwakke hand.
  if (th.miserie && bids.some((c) => c.id === 'miserie') && miserieScore(hand) >= 8 && hp <= 1) {
    return { type: 'bid', contractId: 'miserie' };
  }
  // Meegaan of mede-miserie.
  if (bidding.canJoin(player)) {
    const current = bidding.current?.contract.id;
    if (current === 'vraag-en-mee' && (hp >= th.joinHp || (trumps >= 3 && hp >= th.joinTrumpHp))) {
      return { type: 'join' };
    }
    if (th.miserie && current === 'miserie' && miserieScore(hand) >= 8 && hp <= 1) {
      return { type: 'join' };
    }
  }
  // Vragen: degelijke hand met troefsteun.
  if (
    bids.some((c) => c.id === 'vraag-en-mee') &&
    (hp >= th.vraagHp || (trumps >= 4 && hp >= th.vraagTrumpHp))
  ) {
    return { type: 'bid', contractId: 'vraag-en-mee' };
  }
  return { type: 'pass' };
}

/** §5.2: alleen doorspelen met een stevige hand. */
export function chooseAlleen(hand: Card[], trump: Suit, level: BotLevel = 'normal'): boolean {
  const need = level === 'easy' ? 13 : level === 'strong' ? 10 : 11;
  return honourPoints(hand) >= need && suitCount(hand, trump) >= 4;
}

export function chooseTrumpSuit(hand: Card[]): Suit {
  return longestSuit(hand);
}

export function chooseCard(gift: Gift, player: number, level: BotLevel = 'normal'): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const contract = gift.contract;
  const trumpSuit = contract?.trumpSuit ?? null;
  const isMiserie = contract?.contract.target.tricks === 0;
  const isDeclarer = contract?.declarers.includes(player) ?? false;
  const trick = gift.trick;

  const lowest = [...legal].sort((a, b) => a.rank - b.rank)[0] as Card;

  // Troel (§5.4): de uitkomer bepaalt met zijn eerste kaart de troef —
  // kies de langste kleur en kom hoog uit.
  if (contract?.contract.trump === 'first-card-led' && trumpSuit === null && trick.length === 0) {
    const suit = longestSuit(legal);
    return legal.filter((c) => c.suit === suit).sort((a, b) => b.rank - a.rank)[0] as Card;
  }

  // Miserie-bieder: blijf zo laag mogelijk onder de slag.
  if (isMiserie && isDeclarer) {
    if (trick.length === 0) return lowest;
    const winning = currentWinning(gift, trumpSuit);
    const under = legal
      .filter((c) => c.suit === winning.suit && c.rank < winning.rank)
      .sort((a, b) => b.rank - a.rank)[0];
    return under ?? lowest;
  }

  // Makkelijk niveau: speelt gewoon de laagste legale kaart.
  if (level === 'easy') return lowest;

  if (trick.length === 0) {
    // Sterk niveau: kaartgeheugen — kom uit met een 'master' (hoogste nog
    // uitstaande kaart van een kleur) als die er is.
    if (level === 'strong') {
      const master = legal
        .filter((c) => isMaster(gift, player, c, trumpSuit))
        .sort((a, b) => b.rank - a.rank)[0];
      if (master) return master;
    }
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
  const eager = level === 'strong';
  if (winners.length > 0 && (lastToPlay || eager || (winners[0] as Card).rank >= 11)) {
    return winners[0] as Card;
  }
  return lowest;
}

/** Kaartgeheugen: is deze kaart de hoogste die in haar kleur nog uitstaat? */
function isMaster(gift: Gift, player: number, card: Card, trumpSuit: Suit | null): boolean {
  if (trumpSuit !== null && card.suit === trumpSuit) return false; // troef apart houden
  const seen = new Set<string>();
  for (const play of gift.history.flat()) seen.add(`${play.card.suit}${play.card.rank}`);
  for (const play of gift.trick) seen.add(`${play.card.suit}${play.card.rank}`);
  for (const own of gift.deal.hands[player] ?? []) seen.add(`${own.suit}${own.rank}`);
  for (let rank = card.rank + 1; rank <= 14; rank++) {
    if (!seen.has(`${card.suit}${rank}`)) return false;
  }
  return true;
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

/* ---------- manillen (REGELS-MANILLEN.md) ---------- */

/** Deler kiest troef: langste kleur, bij gelijke lengte de sterkste. */
export function chooseManilleTrump(hand: Card[]): Suit {
  let best: Suit = 'S';
  let bestScore = -1;
  for (const suit of SUITS) {
    const cards = hand.filter((c) => c.suit === suit);
    const score = cards.length * 10 + cards.reduce((sum, c) => sum + strength(c.rank), 0);
    if (score > bestScore) {
      bestScore = score;
      best = suit;
    }
  }
  return best;
}

export function chooseManilleCard(gift: ManilleGift, player: number, level: BotLevel): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const trumpSuit = gift.trumpSuit; // null bij "zonder troef"
  const trick = gift.trick;
  const byStrengthAsc = [...legal].sort((a, b) => strength(a.rank) - strength(b.rank));
  const cheapest = [...legal].sort(
    (a, b) => cardPoints(a) - cardPoints(b) || strength(a.rank) - strength(b.rank),
  )[0] as Card;
  if (level === 'easy') return byStrengthAsc[0] as Card;

  if (trick.length === 0) {
    // Uitkomen: sterkste kaart van de langste niet-troefkleur, anders troef.
    const suit = longestSuit(legal.filter((c) => c.suit !== trumpSuit)) ?? trumpSuit ?? 'S';
    const inSuit = legal.filter((c) => c.suit === suit);
    const pool = inSuit.length > 0 ? inSuit : legal;
    return [...pool].sort((a, b) => strength(b.rank) - strength(a.rank))[0] as Card;
  }

  const winning = manilleWinning(trick, trumpSuit);
  const partnerWinning = teamOf(winning.player) === teamOf(player);
  const winners = legal
    .filter((c) => manilleBeats(c, winning.card, trumpSuit, (trick[0] as TrickRef).card.suit))
    .sort((a, b) => strength(a.rank) - strength(b.rank));
  if (partnerWinning && level !== 'normal') {
    // Sterk: maat ligt — smeer punten of gooi goedkoop af.
    const smear = [...legal].sort((a, b) => cardPoints(b) - cardPoints(a))[0] as Card;
    return trick.length === 3 && cardPoints(smear) > 0 ? smear : cheapest;
  }
  if (winners.length > 0) return winners[0] as Card;
  return cheapest;
}

interface TrickRef {
  player: number;
  card: Card;
}

function manilleWinning(trick: TrickRef[], trumpSuit: Suit | null): TrickRef {
  let best = trick[0] as TrickRef;
  for (const play of trick.slice(1)) {
    if (manilleBeats(play.card, best.card, trumpSuit, (trick[0] as TrickRef).card.suit)) {
      best = play;
    }
  }
  return best;
}

function manilleBeats(
  candidate: Card,
  target: Card,
  trumpSuit: Suit | null,
  ledSuit: Suit,
): boolean {
  const cTrump = trumpSuit !== null && candidate.suit === trumpSuit;
  const tTrump = trumpSuit !== null && target.suit === trumpSuit;
  if (cTrump && !tTrump) return true;
  if (!cTrump && tTrump) return false;
  if (candidate.suit === target.suit) return strength(candidate.rank) > strength(target.rank);
  return candidate.suit === ledSuit && target.suit !== ledSuit;
}

/* ---------- bieden (REGELS-BIEDEN.md) ---------- */

/** Schat de haalbare punten van een hand: hoge troefkaarten + azen/tienen. */
function biedenHandValue(hand: Card[]): number {
  // beste kleur als troef veronderstellen
  let best = 0;
  for (const suit of SUITS) {
    const trumpVal = hand.reduce(
      (s, c) => s + biedenCardPoints(c, c.suit === suit ? suit : ('X' as Suit)),
      0,
    );
    const lengthBonus = hand.filter((c) => c.suit === suit).length * 6;
    best = Math.max(best, trumpVal + lengthBonus);
  }
  return best;
}

export function chooseBiedenBid(gift: BiedenGift, player: number): number | null {
  const legal = gift.bidding.legalBids(player);
  if (legal.length === 0) return null;
  const value = biedenHandValue(gift.hands[player] as Card[]);
  // Bied conservatief: ruw geschatte waarde afgerond, enkel als het minimum haalbaar lijkt.
  const target = Math.min(MAX_BID, Math.max(MIN_BID, Math.round(value / 10) * 10));
  if (value < MIN_BID - 10) return null;
  const pick = legal.filter((b) => b <= target).at(-1);
  return pick ?? null;
}

export function chooseBiedenCard(gift: BiedenGift, player: number, level: BotLevel): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const trumpSuit = gift.trumpSuit;
  const trick = gift.trick;
  const str = (c: Card): number => biedenStrength(c.rank, c.suit, trumpSuit);
  const lowest = [...legal].sort((a, b) => str(a) - str(b))[0] as Card;

  // Declarer komt uit met zijn langste kleur (die wordt troef), hoog.
  if (trick.length === 0 && gift.trumpSuit === null) {
    const suit = longestSuit(legal);
    return legal.filter((c) => c.suit === suit).sort((a, b) => b.rank - a.rank)[0] as Card;
  }
  if (level === 'easy') return lowest;

  if (trick.length === 0) {
    return [...legal].sort((a, b) => str(b) - str(a))[0] as Card;
  }

  const led = (trick[0] as { card: Card }).card.suit;
  let bestPlay = trick[0] as { player: number; card: Card };
  for (const p of trick.slice(1)) {
    const cT = trumpSuit !== null && p.card.suit === trumpSuit;
    const bT = trumpSuit !== null && bestPlay.card.suit === trumpSuit;
    const wins =
      cT && !bT
        ? true
        : cT === bT && p.card.suit === bestPlay.card.suit && str(p.card) > str(bestPlay.card);
    if (wins) bestPlay = p;
  }
  const partnerWinning = biedenTeamOf(bestPlay.player) === biedenTeamOf(player);
  const beatsBest = (c: Card): boolean => {
    const cT = trumpSuit !== null && c.suit === trumpSuit;
    const bT = trumpSuit !== null && bestPlay.card.suit === trumpSuit;
    if (cT && !bT) return true;
    if (!cT && bT) return false;
    if (c.suit === bestPlay.card.suit) return str(c) > str(bestPlay.card);
    return false;
  };
  if (partnerWinning) {
    // Maat ligt: smeer punten of gooi goedkoop.
    const rich = [...legal].sort(
      (a, b) => biedenCardPoints(b, trumpSuit) - biedenCardPoints(a, trumpSuit),
    )[0] as Card;
    return trick.length === 3 && biedenCardPoints(rich, trumpSuit) > 0 ? rich : lowest;
  }
  const winners = legal.filter(beatsBest).sort((a, b) => str(a) - str(b));
  void led;
  return winners.length > 0 ? (winners[0] as Card) : lowest;
}
