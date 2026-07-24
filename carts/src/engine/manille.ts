// Manillen-engine — REGELS-MANILLEN.md. Zelfstandige spelflow naast wiezen:
// 32 kaarten met 10 (manille) boven aas, kaartpunten, twee vaste teams,
// deler kiest troef, troefplicht, sessie tot een puntendoel.
// DOM-vrij en deterministisch, net als de wiezen-engine.

import { sameCard, shuffle, SUITS, type Card, type Rank, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import type { TrickPlay } from './play';

/** Rangorde hoog → laag: 10 (manille), aas (manillon), K, Q, J, 9, 8, 7. */
export const MANILLE_ORDER: readonly Rank[] = [10, 14, 13, 12, 11, 9, 8, 7];

/** Kaartpunten (§2): manille 5, manillon 4, heer 3, dame 2, zot 1. */
const CARD_POINTS: Partial<Record<Rank, number>> = { 10: 5, 14: 4, 13: 3, 12: 2, 11: 1 };

export const TEAM_COUNT = 2;
export const TARGET_POINTS = 101; // ⚠️ AANNAME (REGELS-MANILLEN §5)
const TRICKS_PER_GIFT = 8;
const HALF_POINTS = 30; // 60 kaartpunten in het spel

export function teamOf(player: number): number {
  return player % 2;
}

export function strength(rank: Rank): number {
  return MANILLE_ORDER.length - MANILLE_ORDER.indexOf(rank);
}

export function cardPoints(card: Card): number {
  return CARD_POINTS[card.rank] ?? 0;
}

export function makeManilleDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of MANILLE_ORDER) deck.push({ suit, rank });
  }
  return deck;
}

export function manilleDeal(dealer: number, rng: () => number): Card[][] {
  const cards = shuffle(makeManilleDeck(), rng);
  const hands: Card[][] = [[], [], [], []];
  let index = 0;
  for (const batch of [3, 3, 2]) {
    for (let seat = 1; seat <= PLAYER_COUNT; seat++) {
      const player = (dealer + seat) % PLAYER_COUNT;
      for (let n = 0; n < batch; n++) {
        (hands[player] as Card[]).push(cards[index] as Card);
        index++;
      }
    }
  }
  return hands;
}

/** Volgplicht + troefplicht (§4): volgen; anders overtroeven indien mogelijk,
 *  anders (onder)troeven; pas zonder troef mag alles. */
export function manilleLegalPlays(hand: Card[], trick: TrickPlay[], trumpSuit: Suit): Card[] {
  if (trick.length === 0) return hand;
  const ledSuit = (trick[0] as TrickPlay).card.suit;
  const follow = hand.filter((c) => c.suit === ledSuit);
  if (follow.length > 0) return follow;
  const trumps = hand.filter((c) => c.suit === trumpSuit);
  if (trumps.length > 0) {
    const highestPlayed = trick
      .filter((p) => p.card.suit === trumpSuit)
      .reduce((max, p) => Math.max(max, strength(p.card.rank)), 0);
    const over = trumps.filter((c) => strength(c.rank) > highestPlayed);
    return over.length > 0 ? over : trumps;
  }
  return hand;
}

export function manilleTrickWinner(trick: TrickPlay[], trumpSuit: Suit): number {
  if (trick.length !== PLAYER_COUNT) throw new Error('Slag is niet compleet');
  let best = trick[0] as TrickPlay;
  for (const play of trick.slice(1)) {
    const c = play.card;
    const b = best.card;
    const cTrump = c.suit === trumpSuit;
    const bTrump = b.suit === trumpSuit;
    if (cTrump && !bTrump) best = play;
    else if (cTrump === bTrump && c.suit === b.suit && strength(c.rank) > strength(b.rank)) {
      best = play;
    }
  }
  return best.player;
}

export type ManillePhase = 'trump-choice' | 'play' | 'scored';

export interface ManilleGiftScore {
  /** Kaartpunten per team (samen 60). */
  teamPoints: number[];
  /** Winnend team (0/1) of null bij 30-30. */
  winner: number | null;
  /** Score van de gift: kaartpunten − 30 voor de winnaar. */
  score: number;
}

export class ManilleGift {
  readonly dealer: number;
  readonly hands: Card[][];
  trumpSuit: Suit | null = null;
  trick: TrickPlay[] = [];
  trickLeader: number;
  lastTrick: TrickPlay[] | null = null;
  readonly history: TrickPlay[][] = [];
  tricksPlayed = 0;
  /** Gewonnen kaartpunten per team. */
  teamPoints: number[] = [0, 0];
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  score: ManilleGiftScore | null = null;

  constructor(dealer: number, rng: () => number) {
    this.dealer = dealer;
    this.hands = manilleDeal(dealer, rng);
    this.trickLeader = nextPlayer(dealer);
  }

  get phase(): ManillePhase {
    if (this.score) return 'scored';
    if (this.trumpSuit === null) return 'trump-choice';
    return 'play';
  }

  /** §3: de deler bepaalt troef. */
  chooseTrump(suit: Suit): void {
    if (this.trumpSuit !== null) throw new Error('Troef ligt al vast');
    this.trumpSuit = suit;
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  legalCards(player: number): Card[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    return manilleLegalPlays(this.hands[player] as Card[], this.trick, this.trumpSuit as Suit);
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    this.hands[player] = (this.hands[player] as Card[]).filter((c) => !sameCard(c, card));
    this.trick.push({ player, card });
    if (this.trick.length === PLAYER_COUNT) {
      const winner = manilleTrickWinner(this.trick, this.trumpSuit as Suit);
      const points = this.trick.reduce((sum, p) => sum + cardPoints(p.card), 0);
      this.teamPoints[teamOf(winner)] = (this.teamPoints[teamOf(winner)] ?? 0) + points;
      this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
      this.tricksPlayed++;
      this.lastTrick = this.trick;
      this.history.push(this.trick);
      this.trick = [];
      this.trickLeader = winner;
      if (this.tricksPlayed === TRICKS_PER_GIFT) {
        const [a = 0, b = 0] = this.teamPoints;
        const winnerTeam = a === b ? null : a > b ? 0 : 1;
        this.score = {
          teamPoints: [a, b],
          winner: winnerTeam,
          score: winnerTeam === null ? 0 : Math.max(a, b) - HALF_POINTS,
        };
      }
    }
  }
}

export class ManilleSession {
  readonly targetPoints: number;
  private rng: () => number;
  giftNumber = 0;
  dealer: number;
  /** Sessietotalen per team. */
  totals: number[] = [0, 0];
  gift: ManilleGift | null = null;

  constructor(rng: () => number, startDealer = 0, targetPoints = TARGET_POINTS) {
    this.rng = rng;
    this.dealer = startDealer;
    this.targetPoints = targetPoints;
  }

  get finished(): boolean {
    return this.gift === null && this.totals.some((t) => t >= this.targetPoints);
  }

  nextGift(): ManilleGift {
    this.giftNumber++;
    this.gift = new ManilleGift(this.dealer, this.rng);
    return this.gift;
  }

  closeGift(): void {
    const score = this.gift?.score;
    if (score && score.winner !== null) {
      this.totals[score.winner] = (this.totals[score.winner] ?? 0) + score.score;
    }
    this.dealer = nextPlayer(this.dealer);
    this.gift = null;
  }
}
