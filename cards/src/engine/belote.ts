// Belote-engine — REGELS-BELOTE.md. Frans ploegenspel: 32 kaarten, twee vaste
// ploegen, troef via een omgedraaide kaart in twee biedronden, annonces uit de
// hand en belote-rebelote. DOM-vrij en deterministisch.
//
// Kaartwaarden en slagregels zijn identiek aan klaverjassen (§3, §5) en worden
// daar hergebruikt; wat belote eigen is, staat hier: het bieden, de annonces en
// de telling.

import { sameCard, shuffle, SUITS, type Card, type Rank, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import type { TrickPlay } from './play';
import {
  klaverjasCardPoints as cardPoints,
  klaverjasStrength as strength,
  klaverjasTrickWinner as trickWinner,
  makeKlaverjasDeck,
  partnerOf,
  teamOf,
  trickLegalPlays,
} from './klaverjassen';

export {
  cardPoints as beloteCardPoints,
  strength as beloteStrength,
  trickWinner as beloteTrickWinner,
  teamOf,
  partnerOf,
};

const TRICKS_PER_ROUND = 8;
export const LAST_TRICK_BONUS = 10;
export const TOTAL_POINTS = 162;

/** §5: ondertroeven verplicht, maar vrij bijgooien als je maat de slag al heeft. */
const BELOTE_TRICK_RULES = { mustUndertrump: true, freeWhenPartnerWins: true };

export interface BeloteConfig {
  /** §8 — bonus bij alle acht de slagen. */
  capotBonus: number;
  targetPoints: number;
  /** §6 — telt belote-rebelote ook wanneer de ploeg de ronde verliest? */
  beloteAlwaysCounts: boolean;
}

export const DEFAULT_BELOTE_CONFIG: BeloteConfig = {
  capotBonus: 100,
  targetPoints: 501,
  beloteAlwaysCounts: true,
};

/* ---------- annonces (§7) ---------- */

export type AnnonceKind =
  'tierce' | 'cinquante' | 'cent' | 'carreJacks' | 'carreNines' | 'carreOther';

export interface Annonce {
  kind: AnnonceKind;
  points: number;
  /** Hoogste kaart van de combinatie — beslist bij gelijke annonces. */
  high: Rank;
}

const ANNONCE_RANK: Record<AnnonceKind, number> = {
  tierce: 1,
  cinquante: 3,
  carreOther: 4,
  carreNines: 5,
  cent: 6,
  carreJacks: 7,
};

/** Alle annonces in één hand (§7). Reeksen volgen de gewone volgorde, ook in troef. */
export function annoncesInHand(hand: Card[]): Annonce[] {
  const found: Annonce[] = [];

  // Carrés: vier dezelfde kaarten. 8 en 7 tellen niet.
  for (const rank of [14, 13, 12, 11, 10, 9] as Rank[]) {
    if (hand.filter((c) => c.rank === rank).length !== 4) continue;
    if (rank === 11) found.push({ kind: 'carreJacks', points: 200, high: rank });
    else if (rank === 9) found.push({ kind: 'carreNines', points: 150, high: rank });
    else found.push({ kind: 'carreOther', points: 100, high: rank });
  }

  // Reeksen per kleur: de langste telt (5 → cent, 4 → cinquante, 3 → tierce).
  for (const suit of SUITS) {
    const ranks = hand
      .filter((c) => c.suit === suit)
      .map((c) => c.rank)
      .sort((a, b) => a - b);
    if (ranks.length < 3) continue;
    let run = 1;
    let best = 1;
    let bestHigh = ranks[0] as Rank;
    for (let i = 1; i < ranks.length; i++) {
      run = (ranks[i] as number) === (ranks[i - 1] as number) + 1 ? run + 1 : 1;
      if (run > best) {
        best = run;
        bestHigh = ranks[i] as Rank;
      }
    }
    if (best >= 5) found.push({ kind: 'cent', points: 100, high: bestHigh });
    else if (best === 4) found.push({ kind: 'cinquante', points: 50, high: bestHigh });
    else if (best === 3) found.push({ kind: 'tierce', points: 20, high: bestHigh });
  }

  return found;
}

/** Welke van twee annonces weegt zwaarder? >0 = a, <0 = b, 0 = gelijk. */
export function compareAnnonces(a: Annonce, b: Annonce): number {
  const byKind = ANNONCE_RANK[a.kind] - ANNONCE_RANK[b.kind];
  return byKind !== 0 ? byKind : a.high - b.high;
}

/** Heeft deze hand heer én vrouw van troef? (belote-rebelote, §6) */
export function hasBeloteRebelote(hand: Card[], trumpSuit: Suit): boolean {
  return (
    hand.some((c) => c.suit === trumpSuit && c.rank === 13) &&
    hand.some((c) => c.suit === trumpSuit && c.rank === 12)
  );
}

/* ---------- bieden (§4) ---------- */

export type BelotePhase = 'bidding' | 'play' | 'redeal' | 'scored';

export interface BeloteScore {
  cardPoints: number[];
  annonces: number[];
  belote: number[];
  raw: number[];
  takingTeam: number;
  made: boolean;
  capot: boolean;
  points: number[];
}

export class BeloteGift {
  readonly dealer: number;
  readonly config: BeloteConfig;
  /** Handen; bij het bieden hebben ze 5 kaarten, daarna 8. */
  hands: Card[][];
  /** De open kaart die de troef aanbiedt. */
  readonly turnedCard: Card;
  /** Rest van het deck, voor het bijdelen na het nemen. */
  private rest: Card[];

  toAct: number;
  /** 1 = de omgedraaide kleur aannemen, 2 = een andere kleur mogen noemen. */
  biddingRound: 1 | 2 = 1;
  private passes = 0;
  taker: number | null = null;
  trumpSuit: Suit | null = null;

  trick: TrickPlay[] = [];
  trickLeader: number;
  lastTrick: TrickPlay[] | null = null;
  readonly history: TrickPlay[][] = [];
  tricksPlayed = 0;
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  teamCardPoints: number[] = [0, 0];
  teamAnnonces: number[] = [0, 0];
  teamBelote: number[] = [0, 0];
  /** Per speler de annonces die geteld zijn — de UI meldt ze aan tafel. */
  declared: Annonce[][] = [[], [], [], []];
  private lastTrickWinner = 0;
  redealt = false;
  score: BeloteScore | null = null;

  constructor(dealer: number, rng: () => number, config: BeloteConfig = DEFAULT_BELOTE_CONFIG) {
    this.dealer = dealer;
    this.config = config;
    const cards = shuffle(makeKlaverjasDeck(), rng);
    this.hands = [[], [], [], []];
    let i = 0;
    for (const batch of [3, 2]) {
      for (let seat = 1; seat <= PLAYER_COUNT; seat++) {
        const p = (dealer + seat) % PLAYER_COUNT;
        for (let n = 0; n < batch; n++) (this.hands[p] as Card[]).push(cards[i++] as Card);
      }
    }
    this.turnedCard = cards[i++] as Card;
    this.rest = cards.slice(i);
    this.toAct = nextPlayer(dealer);
    this.trickLeader = nextPlayer(dealer);
  }

  get phase(): BelotePhase {
    if (this.score) return 'scored';
    if (this.redealt) return 'redeal';
    return this.trumpSuit === null ? 'bidding' : 'play';
  }

  /** In ronde 1 kan je enkel de omgedraaide kleur nemen; in ronde 2 elke andere. */
  legalTakes(): Suit[] {
    if (this.phase !== 'bidding') return [];
    return this.biddingRound === 1
      ? [this.turnedCard.suit]
      : SUITS.filter((s) => s !== this.turnedCard.suit);
  }

  take(suit: Suit): void {
    if (!this.legalTakes().includes(suit)) throw new Error('Deze kleur mag je nu niet nemen');
    this.taker = this.toAct;
    this.trumpSuit = suit;
    // De nemer krijgt de open kaart; daarna wordt de rest bijgedeeld (§4.5).
    (this.hands[this.taker] as Card[]).push(this.turnedCard);
    let i = 0;
    for (let seat = 1; seat <= PLAYER_COUNT; seat++) {
      const p = (this.dealer + seat) % PLAYER_COUNT;
      const nodig = 8 - (this.hands[p] as Card[]).length;
      for (let n = 0; n < nodig; n++) (this.hands[p] as Card[]).push(this.rest[i++] as Card);
    }
    this.rest = [];
    this.countAnnonces();
  }

  pass(): void {
    if (this.phase !== 'bidding') throw new Error('Geen biedronde actief');
    this.passes++;
    this.toAct = nextPlayer(this.toAct);
    if (this.passes === PLAYER_COUNT) {
      if (this.biddingRound === 1) {
        this.biddingRound = 2;
        this.passes = 0;
      } else {
        this.redealt = true; // §4.4 — niemand neemt, opnieuw delen
      }
    }
  }

  /** §7: enkel de ploeg met de hoogste annonce telt, en dan al haar annonces. */
  private countAnnonces(): void {
    const perPlayer = this.hands.map((h) => annoncesInHand(h));
    let bestPlayer = -1;
    let best: Annonce | null = null;
    // Bij gelijkspel wint wie het dichtst na de deler zit (§7).
    for (let seat = 1; seat <= PLAYER_COUNT; seat++) {
      const p = (this.dealer + seat) % PLAYER_COUNT;
      for (const a of perPlayer[p] as Annonce[]) {
        if (best === null || compareAnnonces(a, best) > 0) {
          best = a;
          bestPlayer = p;
        }
      }
    }
    if (best === null) return;
    const winningTeam = teamOf(bestPlayer);
    for (let p = 0; p < PLAYER_COUNT; p++) {
      if (teamOf(p) !== winningTeam) continue;
      this.declared[p] = perPlayer[p] as Annonce[];
      this.teamAnnonces[winningTeam] =
        (this.teamAnnonces[winningTeam] ?? 0) +
        (perPlayer[p] as Annonce[]).reduce((sum, a) => sum + a.points, 0);
    }
    // Belote-rebelote staat buiten de vergelijking en telt altijd (§6).
    for (let p = 0; p < PLAYER_COUNT; p++) {
      if (hasBeloteRebelote(this.hands[p] as Card[], this.trumpSuit as Suit)) {
        this.teamBelote[teamOf(p)] = (this.teamBelote[teamOf(p)] ?? 0) + 20;
      }
    }
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  legalCards(player: number): Card[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    return trickLegalPlays(
      this.hands[player] as Card[],
      this.trick,
      this.trumpSuit as Suit,
      player,
      BELOTE_TRICK_RULES,
    );
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    this.hands[player] = (this.hands[player] as Card[]).filter((c) => !sameCard(c, card));
    this.trick.push({ player, card });
    if (this.trick.length !== PLAYER_COUNT) return;

    const winner = trickWinner(this.trick, this.trumpSuit);
    const team = teamOf(winner);
    this.teamCardPoints[team] =
      (this.teamCardPoints[team] ?? 0) +
      this.trick.reduce((sum, p) => sum + cardPoints(p.card, this.trumpSuit), 0);
    this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
    this.tricksPlayed++;
    this.lastTrick = this.trick;
    this.history.push(this.trick);
    this.lastTrickWinner = winner;
    this.trick = [];
    this.trickLeader = winner;
    if (this.tricksPlayed === TRICKS_PER_ROUND) this.finish();
  }

  private finish(): void {
    const lastTeam = teamOf(this.lastTrickWinner);
    this.teamCardPoints[lastTeam] = (this.teamCardPoints[lastTeam] ?? 0) + LAST_TRICK_BONUS;

    const takingTeam = teamOf(this.taker as number);
    const other = 1 - takingTeam;
    const cardPts = [this.teamCardPoints[0] ?? 0, this.teamCardPoints[1] ?? 0];
    const ann = [this.teamAnnonces[0] ?? 0, this.teamAnnonces[1] ?? 0];
    const bel = [this.teamBelote[0] ?? 0, this.teamBelote[1] ?? 0];
    const raw = [0, 1].map((t) => (cardPts[t] as number) + (ann[t] as number) + (bel[t] as number));

    const takerTricks = this.tricksWon.reduce(
      (sum, n, p) => sum + (teamOf(p) === takingTeam ? n : 0),
      0,
    );
    const capot = takerTricks === TRICKS_PER_ROUND;
    const made = (raw[takingTeam] as number) > (raw[other] as number);

    const points = [0, 0];
    if (made) {
      points[takingTeam] = (raw[takingTeam] as number) + (capot ? this.config.capotBonus : 0);
      points[other] = raw[other] as number;
    } else {
      // Dedans (§8): alles naar de tegenpartij. Belote-rebelote blijft staan als
      // de config dat zegt.
      const keepBelote = this.config.beloteAlwaysCounts ? (bel[takingTeam] as number) : 0;
      points[takingTeam] = keepBelote;
      points[other] = (raw[0] as number) + (raw[1] as number) - keepBelote;
    }

    this.score = {
      cardPoints: cardPts,
      annonces: ann,
      belote: bel,
      raw,
      takingTeam,
      made,
      capot,
      points,
    };
  }
}

export class BeloteSession {
  readonly config: BeloteConfig;
  private rng: () => number;
  roundNumber = 0;
  dealer: number;
  totals: number[] = [0, 0];
  gift: BeloteGift | null = null;

  constructor(rng: () => number, startDealer = 0, config: BeloteConfig = DEFAULT_BELOTE_CONFIG) {
    this.rng = rng;
    this.dealer = startDealer;
    this.config = config;
  }

  get finished(): boolean {
    return this.gift === null && this.totals.some((t) => t >= this.config.targetPoints);
  }

  nextGift(): BeloteGift {
    this.roundNumber++;
    this.gift = new BeloteGift(this.dealer, this.rng, this.config);
    return this.gift;
  }

  closeGift(): void {
    const score = this.gift?.score;
    if (score) {
      this.totals[0] = (this.totals[0] ?? 0) + (score.points[0] ?? 0);
      this.totals[1] = (this.totals[1] ?? 0) + (score.points[1] ?? 0);
    } else if (this.gift?.phase === 'redeal') {
      this.roundNumber--; // §4.4 — herdeel telt niet als gespeelde ronde
    }
    this.dealer = nextPlayer(this.dealer);
    this.gift = null;
  }
}
