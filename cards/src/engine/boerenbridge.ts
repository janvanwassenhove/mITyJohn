// Boerenbridge-engine — REGELS-BOERENBRIDGE.md. Ieder voor zich, en als enige
// spel in de app verandert het **aantal kaarten per ronde**. Je scoort niet door
// slagen te halen maar door er exact zo veel te halen als je voorspeld hebt.
// DOM-vrij en deterministisch.

import { makeDeck, sameCard, shuffle, type Card, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import { legalPlays, trickWinner, type TrickPlay } from './play';

/** §3 — de vormen die de app aanbiedt. `klassiek` is het WK-reglement. */
export type RoundShape = 'klassiek' | 'op-en-neer' | 'aflopend';

const SHAPES: Record<RoundShape, number[]> = {
  klassiek: [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 7, 6, 5, 4, 3, 2, 1],
  'op-en-neer': [1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1],
  aflopend: [8, 7, 6, 5, 4, 3, 2, 1],
};

export function roundSizes(shape: RoundShape): number[] {
  return [...(SHAPES[shape] as number[])];
}

export interface BoerenConfig {
  shape: RoundShape;
  /** §5.3 — mag de deler het getal spelen dat het totaal sluitend maakt? */
  screwTheDealer: boolean;
  /** §7 — bonus voor een juiste voorspelling. */
  exactBonus: number;
  /** §7 — punten per gehaalde slag, bovenop de bonus. */
  perTrick: number;
  /** §7 — strafpunten per slag verschil bij een foute voorspelling. */
  missPenalty: number;
}

export const DEFAULT_BOEREN_CONFIG: BoerenConfig = {
  shape: 'klassiek',
  screwTheDealer: false,
  exactBonus: 10,
  perTrick: 3,
  missPenalty: 3,
};

/** §7 — wat levert deze ronde op voor één speler? */
export function roundPoints(bid: number, made: number, config: BoerenConfig): number {
  return bid === made
    ? config.exactBonus + config.perTrick * made
    : -config.missPenalty * Math.abs(made - bid);
}

export type BoerenPhase = 'bidding' | 'play' | 'scored';

export interface BoerenScore {
  bids: number[];
  made: number[];
  points: number[];
}

export class BoerenGift {
  readonly dealer: number;
  readonly roundNumber: number;
  readonly cardsPerHand: number;
  readonly config: BoerenConfig;
  hands: Card[][];
  /** §4.2 — de omgedraaide kaart; null wanneer de stok op is. */
  readonly turnedCard: Card | null;
  readonly trumpSuit: Suit | null;

  bids: (number | null)[] = [null, null, null, null];
  toAct: number;

  trick: TrickPlay[] = [];
  trickLeader: number;
  lastTrick: TrickPlay[] | null = null;
  readonly history: TrickPlay[][] = [];
  tricksPlayed = 0;
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  score: BoerenScore | null = null;

  constructor(
    dealer: number,
    roundNumber: number,
    cardsPerHand: number,
    rng: () => number,
    config: BoerenConfig = DEFAULT_BOEREN_CONFIG,
  ) {
    this.dealer = dealer;
    this.roundNumber = roundNumber;
    this.cardsPerHand = cardsPerHand;
    this.config = config;
    const cards = shuffle(makeDeck(), rng);
    this.hands = [[], [], [], []];
    let i = 0;
    for (let seat = 1; seat <= PLAYER_COUNT; seat++) {
      const p = (dealer + seat) % PLAYER_COUNT;
      this.hands[p] = cards.slice(i, i + cardsPerHand);
      i += cardsPerHand;
    }
    this.turnedCard = cards[i] ?? null;
    this.trumpSuit = this.turnedCard?.suit ?? null;
    // §5.1 en §6.1: links van de deler biedt eerst en komt uit.
    this.toAct = nextPlayer(dealer);
    this.trickLeader = nextPlayer(dealer);
  }

  get phase(): BoerenPhase {
    if (this.score) return 'scored';
    return this.bids.some((b) => b === null) ? 'bidding' : 'play';
  }

  /** Hoeveel is er tot nu toe geboden? De UI toont dat naast het aantal slagen. */
  get bidTotal(): number {
    return this.bids.reduce<number>((sum, b) => sum + (b ?? 0), 0);
  }

  /** §5 — welke getallen mag deze speler nu noemen? */
  legalBids(player: number): number[] {
    if (this.phase !== 'bidding' || player !== this.toAct) return [];
    const alle = Array.from({ length: this.cardsPerHand + 1 }, (_, n) => n);
    // De deler biedt als laatste; enkel dan kan het totaal sluitend worden (§5.3).
    const laatste = this.bids.filter((b) => b === null).length === 1;
    if (!this.config.screwTheDealer || !laatste) return alle;
    const verboden = this.cardsPerHand - this.bidTotal;
    return alle.filter((n) => n !== verboden);
  }

  bid(player: number, n: number): void {
    if (!this.legalBids(player).includes(n)) throw new Error('Dat bod mag nu niet');
    this.bids[player] = n;
    this.toAct = nextPlayer(this.toAct);
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  /** §6.2 — kleur bekennen verplicht, troeven nooit. */
  legalCards(player: number): Card[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    return legalPlays(this.hands[player] as Card[], this.trick, this.trumpSuit);
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    this.hands[player] = (this.hands[player] as Card[]).filter((c) => !sameCard(c, card));
    this.trick.push({ player, card });
    if (this.trick.length !== PLAYER_COUNT) return;

    const winner = trickWinner(this.trick, this.trumpSuit);
    this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
    this.tricksPlayed++;
    this.lastTrick = this.trick;
    this.history.push(this.trick);
    this.trick = [];
    this.trickLeader = winner;
    if (this.tricksPlayed === this.cardsPerHand) this.finish();
  }

  private finish(): void {
    const bids = this.bids.map((b) => b ?? 0);
    const made = [...this.tricksWon];
    const points = bids.map((bid, p) => roundPoints(bid, made[p] as number, this.config));
    this.score = { bids, made, points };
  }
}

export class BoerenSession {
  readonly config: BoerenConfig;
  readonly sizes: number[];
  private rng: () => number;
  roundNumber = 0;
  dealer: number;
  totals: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  gift: BoerenGift | null = null;

  constructor(rng: () => number, startDealer = 0, config: BoerenConfig = DEFAULT_BOEREN_CONFIG) {
    this.rng = rng;
    this.dealer = startDealer;
    this.config = config;
    this.sizes = roundSizes(config.shape);
  }

  get totalRounds(): number {
    return this.sizes.length;
  }

  get finished(): boolean {
    return this.gift === null && this.roundNumber >= this.sizes.length;
  }

  /** §7 — het hoogste totaal wint. */
  get winner(): number {
    return this.totals.indexOf(Math.max(...this.totals));
  }

  nextGift(): BoerenGift {
    if (this.roundNumber >= this.sizes.length) throw new Error('Partij is uitgespeeld');
    const size = this.sizes[this.roundNumber] as number;
    this.roundNumber++;
    this.gift = new BoerenGift(this.dealer, this.roundNumber, size, this.rng, this.config);
    return this.gift;
  }

  closeGift(): void {
    const score = this.gift?.score;
    if (score) {
      for (let p = 0; p < PLAYER_COUNT; p++) {
        this.totals[p] = (this.totals[p] ?? 0) + (score.points[p] ?? 0);
      }
    }
    this.dealer = nextPlayer(this.dealer);
    this.gift = null;
  }
}
