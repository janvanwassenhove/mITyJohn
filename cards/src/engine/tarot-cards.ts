// Tarotkaarten — REGELS-TAROT.md §2. Het eerste spel in deze app met een eigen
// kaartset: 78 kaarten in drie soorten. Dat past niet in `Card` uit cards.ts
// (die kent geen atouts, geen excuse en geen cavalier), dus krijgt tarot een
// eigen model. De PRNG en de shuffle komen wél uit cards.ts — die zijn generiek.

import type { Suit } from './cards';
import { SUITS } from './cards';

export { SUITS };
export type { Suit };

/** 1..10, 11 = valet, 12 = cavalier, 13 = dame, 14 = roi. */
export type TarotRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export const TAROT_RANKS: readonly TarotRank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const VALET = 11;
export const CAVALIER = 12;
export const DAME = 13;
export const ROI = 14;

export type TarotCard =
  | { kind: 'suit'; suit: Suit; rank: TarotRank }
  | { kind: 'trump'; value: number }
  | { kind: 'excuse' };

export const TRUMP_COUNT = 21;
export const DECK_SIZE = 78;

export function makeTarotDeck(): TarotCard[] {
  const deck: TarotCard[] = [];
  for (const suit of SUITS) {
    for (const rank of TAROT_RANKS) deck.push({ kind: 'suit', suit, rank });
  }
  for (let value = 1; value <= TRUMP_COUNT; value++) deck.push({ kind: 'trump', value });
  deck.push({ kind: 'excuse' });
  return deck;
}

/** Stabiele sleutel, ook voor persistentie in het actielog. */
export function tarotKey(card: TarotCard): string {
  if (card.kind === 'excuse') return 'EX';
  if (card.kind === 'trump') return `T${card.value}`;
  return `${card.suit}${card.rank}`;
}

export function sameTarotCard(a: TarotCard, b: TarotCard): boolean {
  return tarotKey(a) === tarotKey(b);
}

export function parseTarotCard(key: string): TarotCard {
  if (key === 'EX') return { kind: 'excuse' };
  if (key.startsWith('T')) return { kind: 'trump', value: Number(key.slice(1)) };
  const suit = key[0] as Suit;
  return { kind: 'suit', suit, rank: Number(key.slice(1)) as TarotRank };
}

/** §2.1 — de 1 van atout, de 21 en de excuse. */
export function isBout(card: TarotCard): boolean {
  if (card.kind === 'excuse') return true;
  return card.kind === 'trump' && (card.value === 1 || card.value === 21);
}

export function isPetit(card: TarotCard): boolean {
  return card.kind === 'trump' && card.value === 1;
}

/**
 * §2.2 — kaartwaarde in **halve punten** (×2), zodat er nergens met 4,5 gerekend
 * wordt. Samen 182 halve punten = 91 punten.
 */
export function tarotHalfPoints(card: TarotCard): number {
  if (isBout(card)) return 9;
  if (card.kind === 'trump' || card.kind === 'excuse') return 1;
  switch (card.rank) {
    case ROI:
      return 9;
    case DAME:
      return 7;
    case CAVALIER:
      return 5;
    case VALET:
      return 3;
    default:
      return 1;
  }
}

export function halfPointsOf(cards: TarotCard[]): number {
  return cards.reduce((sum, c) => sum + tarotHalfPoints(c), 0);
}

/** Halve punten → de waarde die de speler kent ("41,5", "-25,5"). */
export function formatHalfPoints(half: number): string {
  const teken = half < 0 ? '-' : '';
  const abs = Math.abs(half);
  const geheel = Math.floor(abs / 2);
  return abs % 2 === 0 ? `${teken}${geheel}` : `${teken}${geheel},5`;
}

export function countBouts(cards: TarotCard[]): number {
  return cards.filter(isBout).length;
}

/** Weergavevolgorde: atouts eerst (hoog → laag), dan de kleuren, excuse achteraan. */
const DISPLAY_SUIT_ORDER: Record<Suit, number> = { S: 1, H: 2, C: 3, D: 4 };

export function sortTarotHand(hand: TarotCard[]): TarotCard[] {
  const groep = (c: TarotCard): number =>
    c.kind === 'trump' ? 0 : c.kind === 'excuse' ? 5 : DISPLAY_SUIT_ORDER[c.suit];
  const binnen = (c: TarotCard): number =>
    c.kind === 'trump' ? -c.value : c.kind === 'excuse' ? 0 : -c.rank;
  return [...hand].sort((a, b) => groep(a) - groep(b) || binnen(a) - binnen(b));
}
