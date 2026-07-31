// Hartenjagen-engine — REGELS-HARTENJAGEN.md. Het buitenbeentje van de app:
// 52 kaarten, ieder voor zich, géén troef en géén biedronde, en je wil de
// punten juist *niet* hebben. Wat wél nieuw is: vóór elke ronde geeft iedereen
// drie kaarten door. DOM-vrij en deterministisch.

import { makeDeck, sameCard, shuffle, type Card, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import type { TrickPlay } from './play';

export const CARDS_PER_HAND = 13;
export const PASS_COUNT = 3;
/** §3: dertien harten + de schoppenvrouw. */
export const TOTAL_PENALTY = 26;

/** §5.1 — klaveren 2 komt uit. */
export const OPENING_CARD: Card = { suit: 'C', rank: 2 };
/** §3 — "de zwarte dame". */
export const QUEEN_OF_SPADES: Card = { suit: 'S', rank: 12 };

export interface HartenConfig {
  /** §2 — de partij stopt zodra iemand hier aan komt. */
  targetPoints: number;
  /** §6 — alles halen: 0 voor de speler, 26 voor de rest. */
  shootTheMoon: boolean;
}

export const DEFAULT_HARTEN_CONFIG: HartenConfig = {
  targetPoints: 100,
  shootTheMoon: true,
};

/** §3: strafpunten van één kaart. */
export function penaltyOf(card: Card): number {
  if (card.suit === 'H') return 1;
  return sameCard(card, QUEEN_OF_SPADES) ? 13 : 0;
}

export function trickPenalty(trick: TrickPlay[]): number {
  return trick.reduce((sum, p) => sum + penaltyOf(p.card), 0);
}

/* ---------- kaarten doorgeven (§4) ---------- */

export type PassDirection = 'left' | 'right' | 'across' | 'none';

const PASS_ROTATION: PassDirection[] = ['left', 'right', 'across', 'none'];

/** Beurtrol van het doorgeven; `round` telt vanaf 1. */
export function passDirectionForRound(round: number): PassDirection {
  const i = (round - 1) % PASS_ROTATION.length;
  return PASS_ROTATION[i] as PassDirection;
}

/** Naar wie geeft `player` zijn drie kaarten door? */
export function passTarget(player: number, direction: PassDirection): number {
  switch (direction) {
    case 'left':
      return (player + 1) % PLAYER_COUNT;
    case 'right':
      return (player + PLAYER_COUNT - 1) % PLAYER_COUNT;
    case 'across':
      return (player + 2) % PLAYER_COUNT;
    case 'none':
      return player;
  }
}

/* ---------- slagregels (§5) ---------- */

/** Zonder troef wint simpelweg de hoogste kaart in de gevraagde kleur. */
export function hartenTrickWinner(trick: TrickPlay[]): number {
  if (trick.length !== PLAYER_COUNT) throw new Error('Slag is niet compleet');
  let best = trick[0] as TrickPlay;
  for (const play of trick.slice(1)) {
    if (play.card.suit === best.card.suit && play.card.rank > best.card.rank) best = play;
  }
  return best.player;
}

export interface HartenTrickState {
  /** Is dit de allereerste slag van de ronde? (§5.1 en §5.3) */
  firstTrick: boolean;
  /** Is er al harten gevallen? (§5.4) */
  heartsBroken: boolean;
}

/**
 * Welke kaarten mag deze speler nu leggen? (§5)
 *
 * De regels bijten elkaar op één plek: in de eerste slag mag je geen strafkaart
 * bijgooien, maar wie enkel strafkaarten heeft, moet er toch één kwijt. Elke
 * beperking valt daarom weg zodra ze niets zou overlaten.
 */
export function hartenLegalPlays(
  hand: Card[],
  trick: TrickPlay[],
  state: HartenTrickState,
): Card[] {
  if (hand.length === 0) return [];

  if (trick.length === 0) {
    // §5.1: de eerste slag opent altijd met klaveren 2.
    if (state.firstTrick) {
      const opening = hand.filter((c) => sameCard(c, OPENING_CARD));
      if (opening.length > 0) return opening;
    }
    // §5.4: harten uitkomen mag pas na het breken — tenzij je niets anders hebt.
    if (!state.heartsBroken) {
      const anders = hand.filter((c) => c.suit !== 'H');
      if (anders.length > 0) return anders;
    }
    return hand;
  }

  const ledSuit = (trick[0] as TrickPlay).card.suit;
  const volgen = hand.filter((c) => c.suit === ledSuit);
  if (volgen.length > 0) {
    // §5.3: ook bij het volgen kan een strafkaart vallen (harten gevraagd) —
    // dat is toegestaan, de beperking geldt enkel voor bijgooien.
    if (state.firstTrick) {
      const zonderStraf = volgen.filter((c) => penaltyOf(c) === 0);
      if (zonderStraf.length > 0) return zonderStraf;
    }
    return volgen;
  }

  // Niet kunnen volgen: vrij bijgooien, behalve in de eerste slag (§5.3).
  if (state.firstTrick) {
    const zonderStraf = hand.filter((c) => penaltyOf(c) === 0);
    if (zonderStraf.length > 0) return zonderStraf;
  }
  return hand;
}

/* ---------- gift ---------- */

export type HartenPhase = 'passing' | 'play' | 'scored';

export interface HartenScore {
  /** Strafpunten van deze ronde, per speler. */
  penalties: number[];
  /** Wie alles haalde, of null. */
  moonShooter: number | null;
  /** Wat er bij de totalen komt — na verrekening van "alles halen". */
  points: number[];
}

export class HartenGift {
  readonly dealer: number;
  readonly config: HartenConfig;
  readonly passDirection: PassDirection;
  hands: Card[][];
  /** Wat elke speler klaarlegt om door te geven; null = nog niet gekozen. */
  selected: (Card[] | null)[] = [null, null, null, null];
  /** Wat elke speler ontvangen heeft — de UI toont dat na de ruil. */
  received: Card[][] = [[], [], [], []];

  trick: TrickPlay[] = [];
  trickLeader: number;
  lastTrick: TrickPlay[] | null = null;
  readonly history: TrickPlay[][] = [];
  tricksPlayed = 0;
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  penalties: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  heartsBroken = false;
  score: HartenScore | null = null;
  private passed = false;

  constructor(
    dealer: number,
    round: number,
    rng: () => number,
    config: HartenConfig = DEFAULT_HARTEN_CONFIG,
  ) {
    this.dealer = dealer;
    this.config = config;
    this.passDirection = passDirectionForRound(round);
    const cards = shuffle(makeDeck(), rng);
    this.hands = [[], [], [], []];
    for (let seat = 1; seat <= PLAYER_COUNT; seat++) {
      const p = (dealer + seat) % PLAYER_COUNT;
      this.hands[p] = cards.slice((seat - 1) * CARDS_PER_HAND, seat * CARDS_PER_HAND);
    }
    this.trickLeader = this.openingLeader();
    // In de vierde ronde wordt er niet doorgegeven (§4.4): meteen spelen.
    if (this.passDirection === 'none') this.passed = true;
  }

  private openingLeader(): number {
    for (let p = 0; p < PLAYER_COUNT; p++) {
      if ((this.hands[p] as Card[]).some((c) => sameCard(c, OPENING_CARD))) return p;
    }
    return nextPlayer(this.dealer);
  }

  get phase(): HartenPhase {
    if (this.score) return 'scored';
    return this.passed ? 'play' : 'passing';
  }

  get firstTrick(): boolean {
    return this.tricksPlayed === 0;
  }

  /** Wie moet nog kaarten klaarleggen? Leeg zodra de ruil gebeurd is. */
  pendingPassers(): number[] {
    if (this.phase !== 'passing') return [];
    return this.selected.map((s, p) => (s === null ? p : -1)).filter((p) => p >= 0);
  }

  /** §4 — drie kaarten klaarleggen. De ruil gebeurt pas als iedereen koos. */
  selectPass(player: number, cards: Card[]): void {
    if (this.phase !== 'passing') throw new Error('Er wordt nu niet doorgegeven');
    if (this.selected[player] !== null) throw new Error('Speler koos al');
    if (cards.length !== PASS_COUNT) throw new Error('Precies drie kaarten doorgeven');
    const hand = this.hands[player] as Card[];
    for (const card of cards) {
      if (!hand.some((c) => sameCard(c, card))) throw new Error('Kaart zit niet in de hand');
    }
    if (new Set(cards.map((c) => `${c.suit}${c.rank}`)).size !== PASS_COUNT) {
      throw new Error('Drie verschillende kaarten doorgeven');
    }
    this.selected[player] = [...cards];
    if (this.pendingPassers().length === 0) this.exchange();
  }

  private exchange(): void {
    const gaand = this.selected.map((s) => s as Card[]);
    for (let p = 0; p < PLAYER_COUNT; p++) {
      const weg = gaand[p] as Card[];
      this.hands[p] = (this.hands[p] as Card[]).filter((c) => !weg.some((w) => sameCard(w, c)));
    }
    for (let p = 0; p < PLAYER_COUNT; p++) {
      const naar = passTarget(p, this.passDirection);
      (this.hands[naar] as Card[]).push(...(gaand[p] as Card[]));
      this.received[naar] = [...(gaand[p] as Card[])];
    }
    this.passed = true;
    // De klaveren 2 kan van eigenaar veranderd zijn (§5.1).
    this.trickLeader = this.openingLeader();
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  legalCards(player: number): Card[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    return hartenLegalPlays(this.hands[player] as Card[], this.trick, {
      firstTrick: this.firstTrick,
      heartsBroken: this.heartsBroken,
    });
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    this.hands[player] = (this.hands[player] as Card[]).filter((c) => !sameCard(c, card));
    this.trick.push({ player, card });
    if (card.suit === 'H') this.heartsBroken = true;
    if (this.trick.length !== PLAYER_COUNT) return;

    const winner = hartenTrickWinner(this.trick);
    this.penalties[winner] = (this.penalties[winner] ?? 0) + trickPenalty(this.trick);
    this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
    this.tricksPlayed++;
    this.lastTrick = this.trick;
    this.history.push(this.trick);
    this.trick = [];
    this.trickLeader = winner;
    if (this.tricksPlayed === CARDS_PER_HAND) this.finish();
  }

  private finish(): void {
    const penalties = [...this.penalties];
    let moonShooter: number | null = null;
    if (this.config.shootTheMoon) {
      const alles = penalties.findIndex((n) => n === TOTAL_PENALTY);
      if (alles >= 0) moonShooter = alles;
    }
    // §6: wie alles haalt, krijgt 0 en deelt 26 uit aan de rest.
    const points =
      moonShooter === null
        ? penalties
        : penalties.map((_, p) => (p === moonShooter ? 0 : TOTAL_PENALTY));
    this.score = { penalties, moonShooter, points };
  }
}

export class HartenSession {
  readonly config: HartenConfig;
  private rng: () => number;
  roundNumber = 0;
  dealer: number;
  totals: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  gift: HartenGift | null = null;

  constructor(rng: () => number, startDealer = 0, config: HartenConfig = DEFAULT_HARTEN_CONFIG) {
    this.rng = rng;
    this.dealer = startDealer;
    this.config = config;
  }

  get finished(): boolean {
    return this.gift === null && this.totals.some((t) => t >= this.config.targetPoints);
  }

  /** §6 — de laagste score wint, niet de hoogste. */
  get winner(): number {
    return this.totals.indexOf(Math.min(...this.totals));
  }

  nextGift(): HartenGift {
    this.roundNumber++;
    this.gift = new HartenGift(this.dealer, this.roundNumber, this.rng, this.config);
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

/** Kleuren waarvan de speler er nog heeft — handig voor bots en UI. */
export function suitsInHand(hand: Card[]): Suit[] {
  const suits = new Set<Suit>(hand.map((c) => c.suit));
  return [...suits];
}
