// Bieden-engine — REGELS-BIEDEN.md. Vlaams biedspel: 32 kaarten, twee vaste
// teams, biedveiling om een aantal punten, hoogste bieder komt uit en zijn
// eerste kaart bepaalt de troef. DOM-vrij en deterministisch.

import { sameCard, shuffle, SUITS, type Card, type Rank, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import type { TrickPlay } from './play';

/** 32-kaartendeck: 7 t/m aas. */
const BIEDEN_RANKS: readonly Rank[] = [7, 8, 9, 10, 11, 12, 13, 14];

/** Slagkracht hoog → laag. Troef: B-9-A-10-H-V-8-7. Niet-troef: A-10-H-V-B-9-8-7. */
const TRUMP_ORDER: readonly Rank[] = [11, 9, 14, 10, 13, 12, 8, 7];
const PLAIN_ORDER: readonly Rank[] = [14, 10, 13, 12, 11, 9, 8, 7];

/** Kaartpunten (§2). */
const TRUMP_POINTS: Partial<Record<Rank, number>> = { 11: 20, 9: 14, 14: 11, 10: 10, 13: 3, 12: 2 };
const PLAIN_POINTS: Partial<Record<Rank, number>> = { 14: 11, 10: 10, 13: 3, 12: 2, 11: 1 };

export const TEAM_COUNT = 2;
const TRICKS_PER_GIFT = 8;
export const LAST_TRICK_BONUS = 10;
export const TOTAL_POINTS = 151;
export const MIN_BID = 100;
export const MAX_BID = 150;

export interface BiedenConfig {
  targetPoints: number;
}

export const DEFAULT_BIEDEN_CONFIG: BiedenConfig = { targetPoints: 500 };

export function teamOf(player: number): number {
  return player % 2;
}

export function biedenStrength(rank: Rank, suit: Suit, trumpSuit: Suit | null): number {
  const order = trumpSuit !== null && suit === trumpSuit ? TRUMP_ORDER : PLAIN_ORDER;
  return order.length - order.indexOf(rank);
}

export function biedenCardPoints(card: Card, trumpSuit: Suit | null): number {
  const isTrump = trumpSuit !== null && card.suit === trumpSuit;
  return (isTrump ? TRUMP_POINTS[card.rank] : PLAIN_POINTS[card.rank]) ?? 0;
}

export function makeBiedenDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of BIEDEN_RANKS) deck.push({ suit, rank });
  return deck;
}

export function biedenDeal(dealer: number, rng: () => number): Card[][] {
  const cards = shuffle(makeBiedenDeck(), rng);
  const hands: Card[][] = [[], [], [], []];
  let index = 0;
  for (const batch of [4, 4]) {
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

/** §5: volgen of troeven (vrij), anders alles. Troef is null tot de eerste kaart valt. */
export function biedenLegalPlays(hand: Card[], trick: TrickPlay[], trumpSuit: Suit | null): Card[] {
  if (trick.length === 0) return hand;
  const ledSuit = (trick[0] as TrickPlay).card.suit;
  const allowed = hand.filter(
    (c) => c.suit === ledSuit || (trumpSuit !== null && c.suit === trumpSuit),
  );
  return allowed.length > 0 ? allowed : hand;
}

export function biedenTrickWinner(trick: TrickPlay[], trumpSuit: Suit | null): number {
  if (trick.length !== PLAYER_COUNT) throw new Error('Slag is niet compleet');
  const ledSuit = (trick[0] as TrickPlay).card.suit;
  let best = trick[0] as TrickPlay;
  for (const play of trick.slice(1)) {
    if (biedenBeats(play.card, best.card, trumpSuit, ledSuit)) best = play;
  }
  return best.player;
}

function biedenBeats(
  candidate: Card,
  target: Card,
  trumpSuit: Suit | null,
  ledSuit: Suit,
): boolean {
  const cTrump = trumpSuit !== null && candidate.suit === trumpSuit;
  const tTrump = trumpSuit !== null && target.suit === trumpSuit;
  if (cTrump && !tTrump) return true;
  if (!cTrump && tTrump) return false;
  if (candidate.suit === target.suit) {
    return (
      biedenStrength(candidate.rank, candidate.suit, trumpSuit) >
      biedenStrength(target.rank, target.suit, trumpSuit)
    );
  }
  // verschillende, niet-troef kleuren: enkel de gevraagde kleur kan winnen
  return candidate.suit === ledSuit && target.suit !== ledSuit;
}

/* ---------- biedveiling ---------- */

export type BiddingPhase = 'bidding' | 'done' | 'redeal';

export class BiedenBidding {
  readonly dealer: number;
  toAct: number;
  phase: BiddingPhase = 'bidding';
  highBid: number | null = null;
  highBidder: number | null = null;
  private acted = 0;

  constructor(dealer: number) {
    this.dealer = dealer;
    this.toAct = nextPlayer(dealer);
  }

  /** Toegelaten bodwaarden voor de speler aan zet (leeg als niet aan de beurt). */
  legalBids(player: number): number[] {
    if (this.phase !== 'bidding' || player !== this.toAct) return [];
    const min = (this.highBid ?? MIN_BID - 10) + 10;
    const bids: number[] = [];
    for (let b = Math.max(min, MIN_BID); b <= MAX_BID; b += 10) bids.push(b);
    return bids;
  }

  /** bid = null → pas. */
  act(player: number, bid: number | null): void {
    if (this.phase !== 'bidding' || player !== this.toAct) {
      throw new Error('Speler is niet aan de beurt');
    }
    if (bid !== null) {
      if (!this.legalBids(player).includes(bid)) throw new Error(`Bod ${bid} is niet toegelaten`);
      this.highBid = bid;
      this.highBidder = player;
    }
    this.acted++;
    this.toAct = nextPlayer(this.toAct);
    if (this.acted >= PLAYER_COUNT) {
      this.phase = this.highBidder === null ? 'redeal' : 'done';
    }
  }
}

/* ---------- gift ---------- */

export type BiedenPhase = 'bidding' | 'play' | 'redeal' | 'scored';

export interface BiedenGiftScore {
  bid: number;
  declarer: number;
  declaringTeam: number;
  /** Kaartpunten per team (inclusief laatste-slag-bonus), samen 151. */
  teamPoints: number[];
  made: boolean;
  /** Zero-sum puntenmutatie per team (±bod). */
  points: number[];
}

export class BiedenGift {
  readonly dealer: number;
  readonly hands: Card[][];
  readonly config: BiedenConfig;
  readonly bidding: BiedenBidding;
  declarer: number | null = null;
  trumpSuit: Suit | null = null;
  trick: TrickPlay[] = [];
  trickLeader = 0;
  lastTrick: TrickPlay[] | null = null;
  readonly history: TrickPlay[][] = [];
  tricksPlayed = 0;
  teamPoints: number[] = [0, 0];
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  private lastTrickWinner = 0;
  score: BiedenGiftScore | null = null;

  constructor(dealer: number, rng: () => number, config: BiedenConfig = DEFAULT_BIEDEN_CONFIG) {
    this.dealer = dealer;
    this.config = config;
    this.hands = biedenDeal(dealer, rng);
    this.bidding = new BiedenBidding(dealer);
  }

  get phase(): BiedenPhase {
    if (this.score) return 'scored';
    if (this.bidding.phase === 'redeal') return 'redeal';
    if (this.bidding.phase === 'bidding' || this.declarer === null) return 'bidding';
    return 'play';
  }

  /** Leg het contract vast na de biedronde (hoogste bieder komt uit). */
  settle(): void {
    if (this.bidding.phase !== 'done' || this.declarer !== null) return;
    this.declarer = this.bidding.highBidder as number;
    this.trickLeader = this.declarer;
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  legalCards(player: number): Card[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    return biedenLegalPlays(this.hands[player] as Card[], this.trick, this.trumpSuit);
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    // Eerste kaart van de gift bepaalt de troef (§5).
    if (this.trumpSuit === null && this.tricksPlayed === 0 && this.trick.length === 0) {
      this.trumpSuit = card.suit;
    }
    this.hands[player] = (this.hands[player] as Card[]).filter((c) => !sameCard(c, card));
    this.trick.push({ player, card });
    if (this.trick.length === PLAYER_COUNT) {
      const winner = biedenTrickWinner(this.trick, this.trumpSuit);
      const points = this.trick.reduce(
        (sum, p) => sum + biedenCardPoints(p.card, this.trumpSuit),
        0,
      );
      this.teamPoints[teamOf(winner)] = (this.teamPoints[teamOf(winner)] ?? 0) + points;
      this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
      this.tricksPlayed++;
      this.lastTrick = this.trick;
      this.history.push(this.trick);
      this.lastTrickWinner = winner;
      this.trick = [];
      this.trickLeader = winner;
      if (this.tricksPlayed === TRICKS_PER_GIFT) this.finish();
    }
  }

  private finish(): void {
    const bid = this.bidding.highBid as number;
    const declarer = this.declarer as number;
    const declaringTeam = teamOf(declarer);
    // Laatste-slag-bonus.
    this.teamPoints[teamOf(this.lastTrickWinner)] =
      (this.teamPoints[teamOf(this.lastTrickWinner)] ?? 0) + LAST_TRICK_BONUS;
    const made = (this.teamPoints[declaringTeam] ?? 0) >= bid;
    const delta = made ? bid : -bid;
    const points = [0, 0];
    points[declaringTeam] = delta;
    points[1 - declaringTeam] = -delta;
    this.score = {
      bid,
      declarer,
      declaringTeam,
      teamPoints: [this.teamPoints[0] ?? 0, this.teamPoints[1] ?? 0],
      made,
      points,
    };
  }
}

export class BiedenSession {
  readonly config: BiedenConfig;
  readonly targetPoints: number;
  private rng: () => number;
  giftNumber = 0;
  dealer: number;
  totals: number[] = [0, 0];
  gift: BiedenGift | null = null;

  constructor(rng: () => number, startDealer = 0, config: BiedenConfig = DEFAULT_BIEDEN_CONFIG) {
    this.rng = rng;
    this.dealer = startDealer;
    this.config = config;
    this.targetPoints = config.targetPoints;
  }

  get finished(): boolean {
    return this.gift === null && this.totals.some((t) => t >= this.targetPoints);
  }

  nextGift(): BiedenGift {
    this.giftNumber++;
    this.gift = new BiedenGift(this.dealer, this.rng, this.config);
    return this.gift;
  }

  closeGift(): void {
    const score = this.gift?.score;
    if (score) {
      this.totals[0] = (this.totals[0] ?? 0) + (score.points[0] ?? 0);
      this.totals[1] = (this.totals[1] ?? 0) + (score.points[1] ?? 0);
    } else if (this.gift && this.gift.phase === 'redeal') {
      this.giftNumber--; // herdeel telt niet als gespeelde gift
    }
    this.dealer = nextPlayer(this.dealer);
    this.gift = null;
  }
}
