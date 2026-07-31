// Heuristische bots met drie niveaus. Niveau 'sterk' gebruikt de
// slaghistoriek van de gift als kaartgeheugen (Fase 3); de engine bewaakt
// de legaliteit van elke zet.

import { ACE, sameCard, type Card, type Suit } from './engine/cards';
import type { Bidding, BidAction } from './engine/bidding';
import type { Gift } from './engine/game';
import {
  beloteCardPoints,
  beloteStrength,
  beloteTrickWinner,
  teamOf as beloteTeamOf,
  type BeloteGift,
} from './engine/belote';
import {
  klaverjasCardPoints,
  klaverjasStrength,
  klaverjasTrickWinner,
  teamOf as klaverjasTeamOf,
  type KlaverjasGift,
} from './engine/klaverjassen';
import { PASS_COUNT, QUEEN_OF_SPADES, trickPenalty, type HartenGift } from './engine/hartenjagen';
import type { BoerenGift } from './engine/boerenbridge';
import type { ContractId, TarotGift, TarotPlay } from './engine/tarot';
import { isBout, tarotHalfPoints, type TarotCard } from './engine/tarot-cards';
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
  const hp = honourPoints(hand);
  const longest = longestSuit(hand);
  const longestLen = suitCount(hand, longest);
  // Kleurenwiezen (REGELS.md §3bis): er ligt geen troef open. Meegaan beoordeel je op
  // de kleur die de vrager noemde; zelf vragen doe je in je eigen langste kleur.
  const announces = bidding.ruleset.contracts.some(
    (c) => c.id === 'vraag-en-mee' && c.trump === 'announced',
  );
  const askSuit = announces ? longest : bidding.turnedSuit;
  const joinSuit = announces ? (bidding.announcedSuit ?? longest) : bidding.turnedSuit;
  const trumps = suitCount(hand, joinSuit);
  const askTrumps = suitCount(hand, askSuit);

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
    (hp >= th.vraagHp || (askTrumps >= 4 && hp >= th.vraagTrumpHp))
  ) {
    return announces
      ? { type: 'bid', contractId: 'vraag-en-mee', suit: askSuit }
      : { type: 'bid', contractId: 'vraag-en-mee' };
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

  // Troel (§5.4): de uitkomer hoort zijn vierde aas te leggen — die bepaalt de
  // troef. Iets anders uitkomen kost een slag, dus dat doet een bot niet.
  if (contract?.contract.trump === 'first-card-led' && trumpSuit === null && trick.length === 0) {
    const required = gift.requiredLeadCard;
    const match = required && legal.find((c) => sameCard(c, required));
    if (match) return match;
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

/* ---------- klaverjassen ---------- */

/** Troefkeuze: de kleur waarin je het sterkst zit. De troefboer en -negen wegen
 *  zwaar door (20 en 14 punten), dus die tellen extra mee. */
export function chooseKlaverjasTrump(hand: Card[]): { suit: Suit; score: number } {
  let best: Suit = 'S';
  let bestScore = -1;
  for (const suit of SUITS) {
    const cards = hand.filter((c) => c.suit === suit);
    const score = cards.reduce(
      (sum, c) => sum + klaverjasCardPoints({ suit, rank: c.rank }, suit),
      cards.length * 6,
    );
    if (score > bestScore) {
      bestScore = score;
      best = suit;
    }
  }
  return { suit: best, score: bestScore };
}

/** Past de bot, of kiest hij? De laatste (deler) móét kiezen (REGELS §4). */
export function chooseKlaverjasPass(gift: KlaverjasGift, hand: Card[], level: BotLevel): boolean {
  if (gift.mustChoose) return false;
  const { score } = chooseKlaverjasTrump(hand);
  const drempel = level === 'easy' ? 44 : level === 'strong' ? 34 : 38;
  return score < drempel;
}

export function chooseKlaverjasCard(gift: KlaverjasGift, player: number, level: BotLevel): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const trump = gift.trumpSuit as Suit;
  const trick = gift.trick;
  const punten = (c: Card) => klaverjasCardPoints(c, trump);
  const kracht = (c: Card) => klaverjasStrength(c.rank, c.suit, trump);
  const goedkoopst = [...legal].sort(
    (a, b) => punten(a) - punten(b) || kracht(a) - kracht(b),
  )[0] as Card;

  if (level === 'easy') return goedkoopst;

  if (trick.length === 0) {
    // Uitkomen: met de troefboer eerst troef trekken, anders een hoge kaart in
    // een lange kleur.
    const boer = legal.find((c) => c.suit === trump && c.rank === 11);
    if (boer && level === 'strong') return boer;
    const nonTrump = legal.filter((c) => c.suit !== trump);
    const pool = nonTrump.length > 0 ? nonTrump : legal;
    return [...pool].sort((a, b) => kracht(b) - kracht(a))[0] as Card;
  }

  const winnaar = klaverjasTrickWinner(trick, trump);
  const maatLigt = klaverjasTeamOf(winnaar) === klaverjasTeamOf(player);
  const hoogste = trick.find((p) => p.player === winnaar)?.card as Card;
  const ledSuit = (trick[0] as { card: Card }).card.suit;
  const winnend = legal
    .filter((c) => {
      const cTrump = c.suit === trump;
      const tTrump = hoogste.suit === trump;
      if (cTrump && !tTrump) return true;
      if (!cTrump && tTrump) return false;
      if (c.suit === hoogste.suit) return kracht(c) > kracht(hoogste);
      return c.suit === ledSuit && hoogste.suit !== ledSuit;
    })
    .sort((a, b) => kracht(a) - kracht(b));

  // Ligt de slag bij je maat, dan smeer je er punten op; anders neem je hem
  // zo goedkoop mogelijk, of gooi je het goedkoopste weg.
  if (maatLigt) {
    return [...legal].sort((a, b) => punten(b) - punten(a) || kracht(a) - kracht(b))[0] as Card;
  }
  return winnend.length > 0 ? (winnend[0] as Card) : goedkoopst;
}

/* ---------- belote ---------- */

/** Neemt de bot de open kaart (of noemt hij in ronde 2 een kleur)? Hij rekent op
 *  de kaartpunten die hij in die kleur zou hebben, plus de troefkaart zelf. */
export function chooseBeloteTake(gift: BeloteGift, player: number): Suit | null {
  const hand = gift.hands[player] as Card[];
  const opties = gift.legalTakes();
  let beste: Suit | null = null;
  let besteScore = 0;
  for (const suit of opties) {
    const extra = suit === gift.turnedCard.suit ? [gift.turnedCard] : [];
    const kaarten = [...hand, ...extra];
    const score = kaarten.reduce(
      (sum, c) => sum + (c.suit === suit ? beloteCardPoints(c, suit) + 4 : 0),
      0,
    );
    if (score > besteScore) {
      besteScore = score;
      beste = suit;
    }
  }
  // Drempel: pas als je er te weinig aan hebt. In ronde 2 ligt hij lager, want
  // anders wordt er eindeloos opnieuw gedeeld.
  const drempel = gift.biddingRound === 1 ? 42 : 34;
  return besteScore >= drempel ? beste : null;
}

export function chooseBeloteCard(gift: BeloteGift, player: number, level: BotLevel): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const trump = gift.trumpSuit as Suit;
  const punten = (c: Card) => beloteCardPoints(c, trump);
  const kracht = (c: Card) => beloteStrength(c.rank, c.suit, trump);
  const goedkoopst = [...legal].sort(
    (a, b) => punten(a) - punten(b) || kracht(a) - kracht(b),
  )[0] as Card;
  if (level === 'easy') return goedkoopst;

  const trick = gift.trick;
  if (trick.length === 0) {
    const boer = legal.find((c) => c.suit === trump && c.rank === 11);
    if (boer && level === 'strong') return boer;
    const nonTrump = legal.filter((c) => c.suit !== trump);
    const pool = nonTrump.length > 0 ? nonTrump : legal;
    return [...pool].sort((a, b) => kracht(b) - kracht(a))[0] as Card;
  }

  const winnaar = beloteTrickWinner(trick, trump);
  const maatLigt = beloteTeamOf(winnaar) === beloteTeamOf(player);
  const hoogste = trick.find((p) => p.player === winnaar)?.card as Card;
  const ledSuit = (trick[0] as { card: Card }).card.suit;
  const winnend = legal
    .filter((c) => {
      const cT = c.suit === trump;
      const tT = hoogste.suit === trump;
      if (cT && !tT) return true;
      if (!cT && tT) return false;
      if (c.suit === hoogste.suit) return kracht(c) > kracht(hoogste);
      return c.suit === ledSuit && hoogste.suit !== ledSuit;
    })
    .sort((a, b) => kracht(a) - kracht(b));

  if (maatLigt) {
    return [...legal].sort((a, b) => punten(b) - punten(a) || kracht(a) - kracht(b))[0] as Card;
  }
  return winnend.length > 0 ? (winnend[0] as Card) : goedkoopst;
}

/* ---------- hartenjagen ---------- */

/** Hoe gevaarlijk is deze kaart om te hóuden? De schoppenvrouw en de kaarten
 *  waarmee je haar vangt (schoppenaas en -heer) wegen het zwaarst; daarna hoge
 *  harten (REGELS-HARTENJAGEN.md §3). */
function hartenRisico(card: Card): number {
  if (sameCard(card, QUEEN_OF_SPADES)) return 100;
  if (card.suit === 'S' && card.rank > 12) return 90;
  if (card.suit === 'H') return 40 + card.rank;
  return card.rank;
}

/** §4 — welke drie kaarten geeft de bot door? */
export function chooseHartenPass(gift: HartenGift, player: number, level: BotLevel): Card[] {
  const hand = gift.hands[player] ?? [];
  const sorted =
    level === 'easy'
      ? [...hand].sort((a, b) => b.rank - a.rank)
      : [...hand].sort((a, b) => hartenRisico(b) - hartenRisico(a));
  return sorted.slice(0, PASS_COUNT);
}

export function chooseHartenCard(gift: HartenGift, player: number, level: BotLevel): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const laagst = [...legal].sort((a, b) => a.rank - b.rank)[0] as Card;
  const hoogst = [...legal].sort((a, b) => b.rank - a.rank)[0] as Card;
  if (level === 'easy') return laagst;

  const trick = gift.trick;
  if (trick.length === 0) {
    // Uitkomen: laag, en niet in schoppen zolang de dame nog rondgaat.
    const veilig = legal.filter((c) => !(c.suit === 'S' && c.rank >= 12));
    const pool = veilig.length > 0 ? veilig : legal;
    return [...pool].sort((a, b) => a.rank - b.rank)[0] as Card;
  }

  const ledSuit = (trick[0] as { card: Card }).card.suit;
  if (legal.some((c) => c.suit === ledSuit)) {
    const hoogsteInSlag = Math.max(
      ...trick.filter((p) => p.card.suit === ledSuit).map((p) => p.card.rank),
    );
    // Zo hoog mogelijk blijven zonder de slag te pakken: je raakt een grote
    // kaart kwijt en de punten blijven bij iemand anders.
    const onder = [...legal].filter((c) => c.rank < hoogsteInSlag).sort((a, b) => b.rank - a.rank);
    if (onder.length > 0) return onder[0] as Card;
    // Je moet de slag nemen. Ligt er niets in en ben je als laatste aan zet,
    // dan is dat gratis — gooi dan net je hoogste weg.
    const laatste = trick.length === 3;
    if (laatste && trickPenalty(trick) === 0 && level === 'strong') return hoogst;
    return laagst;
  }

  // Bijgooien: je gevaarlijkste kaart de deur uit.
  const dame = legal.find((c) => sameCard(c, QUEEN_OF_SPADES));
  if (dame) return dame;
  const hogeSchoppen = [...legal]
    .filter((c) => c.suit === 'S' && c.rank > 12)
    .sort((a, b) => b.rank - a.rank);
  if (hogeSchoppen.length > 0) return hogeSchoppen[0] as Card;
  const harten = [...legal].filter((c) => c.suit === 'H').sort((a, b) => b.rank - a.rank);
  if (harten.length > 0) return harten[0] as Card;
  return hoogst;
}

/* ---------- boerenbridge ---------- */

/** Ruwe schatting van het aantal slagen in deze hand — de basis voor het bod.
 *  Troefkaarten wegen zwaarder, en met een lege troefkleur (§4.3) valt alles terug
 *  op azen en heren. */
export function boerenExpectedTricks(hand: Card[], trump: Suit | null): number {
  let verwacht = 0;
  for (const c of hand) {
    if (trump !== null && c.suit === trump) {
      verwacht += c.rank >= 13 ? 0.9 : c.rank >= 11 ? 0.65 : 0.35;
    } else {
      verwacht += c.rank === 14 ? 0.85 : c.rank === 13 ? 0.5 : c.rank === 12 ? 0.25 : 0.05;
    }
  }
  return verwacht;
}

/** §5 — het bod van de bot, altijd uit de legale getallen gekozen. */
export function chooseBoerenBid(gift: BoerenGift, player: number, level: BotLevel): number {
  const legaal = gift.legalBids(player);
  if (legaal.length === 0) throw new Error('Bot is niet aan de beurt');
  const verwacht = boerenExpectedTricks(gift.hands[player] as Card[], gift.trumpSuit);
  // Makkelijk speelt voorzichtig en biedt naar beneden af; sterk mikt op de
  // dichtstbijzijnde waarde en durft dus vaker een hoog bod aan.
  const doel = level === 'easy' ? Math.floor(verwacht) : Math.round(verwacht);
  return [...legaal].sort((a, b) => Math.abs(a - doel) - Math.abs(b - doel) || a - b)[0] as number;
}

export function chooseBoerenCard(gift: BoerenGift, player: number, level: BotLevel): Card {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as Card;
  const trump = gift.trumpSuit;
  const laag = [...legal].sort((a, b) => a.rank - b.rank);
  const laagst = laag[0] as Card;
  if (level === 'easy') return laagst;

  // Hoeveel slagen heeft deze bot nog nodig? Dát bepaalt alles: te veel halen is
  // even duur als te weinig (§7).
  const nodig = (gift.bids[player] ?? 0) - (gift.tricksWon[player] ?? 0);
  const hoogst = laag[laag.length - 1] as Card;

  if (gift.trick.length === 0) {
    if (nodig <= 0) return laagst;
    // Slagen nodig: kom uit met je sterkste kaart, troef eerst.
    const troeven = legal.filter((c) => trump !== null && c.suit === trump);
    const pool = troeven.length > 0 && level === 'strong' ? troeven : legal;
    return [...pool].sort((a, b) => b.rank - a.rank)[0] as Card;
  }

  const ledSuit = (gift.trick[0] as { card: Card }).card.suit;
  const beste = gift.trick.reduce((best, p) => {
    const bT = trump !== null && best.card.suit === trump;
    const cT = trump !== null && p.card.suit === trump;
    if (cT && !bT) return p;
    if (cT === bT && p.card.suit === best.card.suit && p.card.rank > best.card.rank) return p;
    return best;
  });
  const wint = (c: Card): boolean => {
    const cT = trump !== null && c.suit === trump;
    const bT = trump !== null && beste.card.suit === trump;
    if (cT && !bT) return true;
    if (!cT && bT) return false;
    if (c.suit === beste.card.suit) return c.rank > beste.card.rank;
    return c.suit === ledSuit && beste.card.suit !== ledSuit;
  };
  const winnend = laag.filter(wint);
  const verliezend = laag.filter((c) => !wint(c));

  if (nodig > 0) {
    // Zo goedkoop mogelijk winnen; lukt dat niet, gooi je goedkoopste weg.
    return (winnend[0] ?? laagst) as Card;
  }
  // Niets meer nodig: de duurste kaart die de slag niét pakt. Moet je toch winnen,
  // dan doe je dat met je hoogste — die kaart kan je later alleen maar dwarszitten.
  return (verliezend[verliezend.length - 1] ?? hoogst) as Card;
}

/* ---------- frans tarot ---------- */

/** Ruwe handsterkte voor het bod (REGELS-TAROT.md §4): atouts en bouts wegen het
 *  zwaarst, daarna de heren. Dit is de klassieke "punten tellen" van aan tafel. */
export function tarotHandStrength(hand: TarotCard[]): number {
  let score = 0;
  const atouts = hand.filter((c) => c.kind === 'trump');
  score += atouts.length * 2;
  // De hoge atouts sturen het spel; het petit is juist een risico dat je moet
  // kunnen dekken, dus die telt maar half mee.
  for (const c of atouts) {
    if (c.value >= 15) score += 2;
    if (c.value === 21) score += 6;
    if (c.value === 1) score += 2;
  }
  if (hand.some((c) => c.kind === 'excuse')) score += 4;
  for (const c of hand) {
    if (c.kind !== 'suit') continue;
    if (c.rank === 14) score += 3;
    else if (c.rank === 13) score += 1;
  }
  return score;
}

/** Drempels **per kaart**, want een hand van 24 (drie spelers) is nu eenmaal
 *  sterker dan een van 15 (vijf spelers). Zonder die normalisatie past bij vijf
 *  spelers zowat iedereen en wordt er eindeloos herdeeld. */
const TAROT_BID_THRESHOLDS: [ContractId, number][] = [
  ['garde-contre', 2.1],
  ['garde-sans', 1.8],
  ['garde', 1.5],
  ['petite', 1.25],
];

export function chooseTarotBid(
  gift: TarotGift,
  player: number,
  level: BotLevel,
): ContractId | 'pass' {
  const legaal = gift.legalBids(player);
  if (legaal.length === 0) return 'pass';
  const hand = gift.hands[player] as TarotCard[];
  const perKaart = tarotHandStrength(hand) / hand.length;
  // Makkelijk speelt terughoudend, sterk durft meer.
  const schuif = level === 'easy' ? 0.15 : level === 'strong' ? -0.1 : 0;
  for (const [id, nodig] of TAROT_BID_THRESHOLDS) {
    if (perKaart >= nodig + schuif && legaal.includes(id)) return id;
  }
  return 'pass';
}

/** §7 — welke kleur roept de preneur? De kleur waarin hij zelf het langst zit,
 *  zonder de heer die hij al heeft. */
export function chooseTarotCall(gift: TarotGift): Suit {
  const hand = gift.hands[gift.taker as number] as TarotCard[];
  const rank = gift.callRank();
  let beste: Suit = 'S';
  let besteScore = -1;
  for (const suit of SUITS) {
    const inKleur = hand.filter((c) => c.kind === 'suit' && c.suit === suit);
    if (inKleur.some((c) => c.kind === 'suit' && c.rank === rank)) continue; // zichzelf roepen
    const score = inKleur.length;
    if (score > besteScore) {
      besteScore = score;
      beste = suit;
    }
  }
  return beste;
}

/** §5 — de écart: leg de kleur weg waar je het kortst zit, hoogste kaarten eerst
 *  weg zolang het geen heer of bout is. */
export function chooseTarotDiscard(gift: TarotGift): TarotCard {
  const mag = gift.legalDiscards();
  const hand = gift.hands[gift.taker as number] as TarotCard[];
  const lengte = (card: TarotCard): number =>
    card.kind === 'suit'
      ? hand.filter((c) => c.kind === 'suit' && c.suit === card.suit).length
      : 99;
  // Korte kleuren eerst leegmaken (dan kan je daar troeven), en binnen een kleur
  // de duurste kaart weg — behalve atouts, die hou je zolang het kan.
  return [...mag].sort((a, b) => {
    const atoutA = a.kind === 'trump' ? 1 : 0;
    const atoutB = b.kind === 'trump' ? 1 : 0;
    if (atoutA !== atoutB) return atoutA - atoutB;
    return lengte(a) - lengte(b) || tarotHalfPoints(b) - tarotHalfPoints(a);
  })[0] as TarotCard;
}

export function chooseTarotCard(gift: TarotGift, player: number, level: BotLevel): TarotCard {
  const legal = gift.legalCards(player);
  if (legal.length === 1) return legal[0] as TarotCard;
  const goedkoop = [...legal].sort(
    (a, b) => tarotHalfPoints(a) - tarotHalfPoints(b) || tarotRank(a) - tarotRank(b),
  );
  const goedkoopst = goedkoop[0] as TarotCard;
  if (level === 'easy') return goedkoopst;

  // De excuse hou je zo lang mogelijk vast: hij is 4,5 punt waard en je verliest
  // hem nooit, behalve in de laatste slag (§6.3).
  const zonderExcuse = legal.filter((c) => c.kind !== 'excuse');
  const pool = zonderExcuse.length > 0 ? zonderExcuse : legal;

  if (gift.trick.length === 0) {
    // Uitkomen: als preneur trek je atouts, als verdediger speel je kleur.
    const atouts = pool.filter((c) => c.kind === 'trump');
    if (gift.onTakerSide(player) && atouts.length > 0 && level === 'strong') {
      return [...atouts].sort((a, b) => tarotRank(b) - tarotRank(a))[0] as TarotCard;
    }
    const kleuren = pool.filter((c) => c.kind === 'suit');
    const keuze = kleuren.length > 0 ? kleuren : pool;
    return [...keuze].sort((a, b) => tarotHalfPoints(a) - tarotHalfPoints(b))[0] as TarotCard;
  }

  const winnaar = tarotTrickWinnerSoFar(gift.trick);
  const vriend = winnaar !== null && gift.onTakerSide(winnaar) === gift.onTakerSide(player);
  const potHalf = gift.trick.reduce((sum, p) => sum + tarotHalfPoints(p.card), 0);

  if (vriend) {
    // Je kamp ligt: smeer er punten op, maar geef je bouts niet weg.
    const veilig = pool.filter((c) => !isBout(c));
    const keuze = veilig.length > 0 ? veilig : pool;
    return [...keuze].sort((a, b) => tarotHalfPoints(b) - tarotHalfPoints(a))[0] as TarotCard;
  }

  // Je moet hem pakken als het loont: de goedkoopste kaart die wint.
  const winnend = [...pool]
    .filter((c) => wintSlag(gift.trick, c))
    .sort((a, b) => tarotRank(a) - tarotRank(b));
  if (winnend.length > 0 && (potHalf >= 8 || level === 'strong')) return winnend[0] as TarotCard;
  return [...pool].sort(
    (a, b) => tarotHalfPoints(a) - tarotHalfPoints(b) || tarotRank(a) - tarotRank(b),
  )[0] as TarotCard;
}

/** Ordeningswaarde binnen één slag: atouts boven kleuren, de excuse onderaan. */
function tarotRank(card: TarotCard): number {
  if (card.kind === 'excuse') return -1;
  return card.kind === 'trump' ? 100 + card.value : card.rank;
}

/** Wie ligt er op dit moment? Null zolang er enkel een excuse ligt. */
function tarotTrickWinnerSoFar(trick: TarotPlay[]): number | null {
  const echt = trick.filter((p) => p.card.kind !== 'excuse');
  if (echt.length === 0) return null;
  const troeven = echt.filter((p) => p.card.kind === 'trump');
  if (troeven.length > 0) {
    return troeven.reduce((best, p) =>
      (p.card as { value: number }).value > (best.card as { value: number }).value ? p : best,
    ).player;
  }
  const kleur = (echt[0] as TarotPlay).card as { suit: Suit };
  const inKleur = echt.filter((p) => p.card.kind === 'suit' && p.card.suit === kleur.suit);
  return inKleur.reduce((best, p) =>
    (p.card as { rank: number }).rank > (best.card as { rank: number }).rank ? p : best,
  ).player;
}

function wintSlag(trick: TarotPlay[], card: TarotCard): boolean {
  if (card.kind === 'excuse') return false;
  const echt = trick.filter((p) => p.card.kind !== 'excuse');
  if (echt.length === 0) return true;
  const hoogsteAtout = echt.reduce(
    (max, p) => (p.card.kind === 'trump' ? Math.max(max, p.card.value) : max),
    0,
  );
  if (card.kind === 'trump') return card.value > hoogsteAtout;
  if (hoogsteAtout > 0) return false;
  const led = (echt[0] as TarotPlay).card as { kind: 'suit'; suit: Suit; rank: number };
  if (card.suit !== led.suit) return false;
  const hoogste = echt.reduce(
    (max, p) =>
      p.card.kind === 'suit' && p.card.suit === led.suit ? Math.max(max, p.card.rank) : max,
    0,
  );
  return card.rank > hoogste;
}
