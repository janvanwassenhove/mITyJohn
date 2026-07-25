// Manillen-engine — REGELS-MANILLEN.md. Zelfstandige spelflow naast wiezen:
// 32 kaarten met 10 (manille) boven aas, kaartpunten, twee vaste teams.
// Configureerbaar (Fase 4c): puntenmodel, troefbepaling, multiplicators,
// "maat ligt" en sessiedoel. DOM-vrij en deterministisch.

import { sameCard, shuffle, SUITS, type Card, type Rank, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import type { TrickPlay } from './play';

/** Rangorde hoog → laag: 10 (manille), aas (manillon), K, Q, J, 9, 8, 7. */
export const MANILLE_ORDER: readonly Rank[] = [10, 14, 13, 12, 11, 9, 8, 7];

/** Kaartpunten (§2): manille 5, manillon 4, heer 3, dame 2, zot 1. */
const CARD_POINTS: Partial<Record<Rank, number>> = { 10: 5, 14: 4, 13: 3, 12: 2, 11: 1 };

export const TEAM_COUNT = 2;
const TRICKS_PER_GIFT = 8;

/** Configuratie afgeleid van de sessie-opties (zie src/options.ts). */
export interface ManilleConfig {
  pointModel: 60 | 68;
  trumpMode: 'dealer' | 'turned' | 'partner';
  multipliers: boolean;
  maatLigt: boolean;
  targetPoints: number;
}

export const DEFAULT_MANILLE_CONFIG: ManilleConfig = {
  pointModel: 60,
  trumpMode: 'dealer',
  multipliers: false,
  maatLigt: false,
  targetPoints: 101,
};

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
 *  anders (onder)troeven; zonder troef mag alles. Met de "maat ligt"-optie
 *  vervalt de troefplicht als de maat de slag al wint. */
export function manilleLegalPlays(
  hand: Card[],
  trick: TrickPlay[],
  trumpSuit: Suit | null,
  opts: { partnerWinning?: boolean } = {},
): Card[] {
  if (trick.length === 0) return hand;
  const ledSuit = (trick[0] as TrickPlay).card.suit;
  const follow = hand.filter((c) => c.suit === ledSuit);
  if (follow.length > 0) return follow;
  if (trumpSuit === null || opts.partnerWinning) return hand;
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

export function manilleTrickWinner(trick: TrickPlay[], trumpSuit: Suit | null): number {
  if (trick.length !== PLAYER_COUNT) throw new Error('Slag is niet compleet');
  let best = trick[0] as TrickPlay;
  for (const play of trick.slice(1)) {
    const c = play.card;
    const b = best.card;
    const cTrump = trumpSuit !== null && c.suit === trumpSuit;
    const bTrump = trumpSuit !== null && b.suit === trumpSuit;
    if (cTrump && !bTrump) best = play;
    else if (cTrump === bTrump && c.suit === b.suit && strength(c.rank) > strength(b.rank)) {
      best = play;
    }
  }
  return best.player;
}

export type ManillePhase = 'trump-choice' | 'play' | 'scored';

export interface ManilleGiftScore {
  /** Punten per team (kaartpunten, evt. + slagpunten bij het 68-model). */
  teamPoints: number[];
  /** Winnend team (0/1) of null bij gelijkspel op de helft. */
  winner: number | null;
  /** Score van de gift: (punten − helft) × multiplicator voor de winnaar. */
  score: number;
  multiplier: number;
}

export class ManilleGift {
  readonly dealer: number;
  readonly hands: Card[][];
  readonly config: ManilleConfig;
  /** Bij de "laatste kaart"-troefbepaling: de open gedraaide kaart. */
  readonly turnedCard: Card | null = null;
  trumpSuit: Suit | null = null;
  private trumpChosen = false;
  multiplier = 1;
  trick: TrickPlay[] = [];
  trickLeader: number;
  lastTrick: TrickPlay[] | null = null;
  readonly history: TrickPlay[][] = [];
  tricksPlayed = 0;
  teamPoints: number[] = [0, 0];
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  score: ManilleGiftScore | null = null;

  constructor(dealer: number, rng: () => number, config: ManilleConfig = DEFAULT_MANILLE_CONFIG) {
    this.dealer = dealer;
    this.config = config;
    this.hands = manilleDeal(dealer, rng);
    this.trickLeader = nextPlayer(dealer);
    if (config.trumpMode === 'turned') {
      // Laatste gedeelde kaart (bij de deler) open: die kleur is troef.
      const dealerHand = this.hands[dealer] as Card[];
      this.turnedCard = dealerHand[dealerHand.length - 1] as Card;
      this.trumpSuit = this.turnedCard.suit;
      this.trumpChosen = true;
    }
  }

  get phase(): ManillePhase {
    if (this.score) return 'scored';
    if (!this.trumpChosen) return 'trump-choice';
    return 'play';
  }

  /** Wie de troef bepaalt: deler, of diens maat. */
  get trumpChooser(): number {
    return this.config.trumpMode === 'partner' ? (this.dealer + 2) % PLAYER_COUNT : this.dealer;
  }

  /** §3: troef kiezen. null = "zonder troef" (enkel als multiplicators aanstaan → ×2). */
  chooseTrump(suit: Suit | null): void {
    if (this.trumpChosen) throw new Error('Troef ligt al vast');
    if (suit === null && !this.config.multipliers) {
      throw new Error('Zonder troef is niet toegelaten');
    }
    this.trumpSuit = suit;
    this.multiplier = suit === null ? 2 : 1;
    this.trumpChosen = true;
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  /** Wint de maat van de gegeven speler de lopende slag op dit moment? */
  private partnerWinning(player: number): boolean {
    if (this.trick.length === 0) return false;
    let best = this.trick[0] as TrickPlay;
    for (const play of this.trick.slice(1)) {
      const beats =
        this.trumpSuit !== null &&
        play.card.suit === this.trumpSuit &&
        best.card.suit !== this.trumpSuit
          ? true
          : play.card.suit === best.card.suit &&
            strength(play.card.rank) > strength(best.card.rank);
      if (beats) best = play;
    }
    return teamOf(best.player) === teamOf(player) && best.player !== player;
  }

  legalCards(player: number): Card[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    const partnerWinning = this.config.maatLigt ? this.partnerWinning(player) : false;
    return manilleLegalPlays(this.hands[player] as Card[], this.trick, this.trumpSuit, {
      partnerWinning,
    });
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    this.hands[player] = (this.hands[player] as Card[]).filter((c) => !sameCard(c, card));
    this.trick.push({ player, card });
    if (this.trick.length === PLAYER_COUNT) {
      const winner = manilleTrickWinner(this.trick, this.trumpSuit);
      const trickPoint = this.config.pointModel === 68 ? 1 : 0;
      const points = this.trick.reduce((sum, p) => sum + cardPoints(p.card), 0) + trickPoint;
      this.teamPoints[teamOf(winner)] = (this.teamPoints[teamOf(winner)] ?? 0) + points;
      this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
      this.tricksPlayed++;
      this.lastTrick = this.trick;
      this.history.push(this.trick);
      this.trick = [];
      this.trickLeader = winner;
      if (this.tricksPlayed === TRICKS_PER_GIFT) {
        const [a = 0, b = 0] = this.teamPoints;
        const half = this.config.pointModel === 68 ? 34 : 30;
        const winnerTeam = a === b ? null : a > b ? 0 : 1;
        this.score = {
          teamPoints: [a, b],
          winner: winnerTeam,
          multiplier: this.multiplier,
          score: winnerTeam === null ? 0 : (Math.max(a, b) - half) * this.multiplier,
        };
      }
    }
  }
}

export class ManilleSession {
  readonly config: ManilleConfig;
  readonly targetPoints: number;
  private rng: () => number;
  giftNumber = 0;
  dealer: number;
  /** Sessietotalen per team. */
  totals: number[] = [0, 0];
  gift: ManilleGift | null = null;

  constructor(rng: () => number, startDealer = 0, config: ManilleConfig = DEFAULT_MANILLE_CONFIG) {
    this.rng = rng;
    this.dealer = startDealer;
    this.config = config;
    this.targetPoints = config.targetPoints;
  }

  get finished(): boolean {
    return this.gift === null && this.totals.some((t) => t >= this.targetPoints);
  }

  nextGift(): ManilleGift {
    this.giftNumber++;
    this.gift = new ManilleGift(this.dealer, this.rng, this.config);
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
