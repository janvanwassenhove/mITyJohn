// Kaartprimitieven — REGELS.md §2: 52 kaarten, A hoog … 2 laag.

export const SUITS = ['S', 'H', 'D', 'C'] as const;
export type Suit = (typeof SUITS)[number];

/** 2..10, 11=J, 12=Q, 13=K, 14=A */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const ACE: Rank = 14;

export interface Card {
  suit: Suit;
  rank: Rank;
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
  return deck;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function cardKey(card: Card): string {
  return `${card.suit}${card.rank}`;
}

/** Deterministische PRNG (mulberry32) zodat giften reproduceerbaar en testbaar zijn. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck: Card[], rng: () => number): Card[] {
  const cards = [...deck];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j] as Card, cards[i] as Card];
  }
  return cards;
}

/** Sorteer een hand voor weergave: per kleur (♠♥♣♦, afwisselend zwart/rood), hoog eerst. */
const DISPLAY_SUIT_ORDER: Record<Suit, number> = { S: 0, H: 1, C: 2, D: 3 };
export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) =>
    a.suit === b.suit ? b.rank - a.rank : DISPLAY_SUIT_ORDER[a.suit] - DISPLAY_SUIT_ORDER[b.suit],
  );
}

export function countAces(hand: Card[]): number {
  return hand.filter((c) => c.rank === ACE).length;
}
