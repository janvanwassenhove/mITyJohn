// Klaverjas-engine — REGELS-KLAVERJASSEN.md. Nederlands ploegenspel: 32 kaarten,
// twee vaste ploegen, één speler kiest de troef, roem voor combinaties in één slag,
// 162 punten per ronde. DOM-vrij en deterministisch (PRNG injecteren).
//
// Deelt de kaartvolgorde met bieden (B-9-A-10-H-V-8-7 in troef), maar niet de
// puntentabel: hier tellen heer en vrouw 4 en 3, samen 152 + 10 voor de laatste slag.

import { sameCard, shuffle, SUITS, type Card, type Rank, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import type { TrickPlay } from './play';

const KLAVERJAS_RANKS: readonly Rank[] = [7, 8, 9, 10, 11, 12, 13, 14];

/** Slagkracht hoog → laag (§3). */
const TRUMP_ORDER: readonly Rank[] = [11, 9, 14, 10, 13, 12, 8, 7];
const PLAIN_ORDER: readonly Rank[] = [14, 10, 13, 12, 11, 9, 8, 7];

/** Kaartpunten (§3) — let op: heer 4 en vrouw 3, anders dan bij bieden. */
const TRUMP_POINTS: Partial<Record<Rank, number>> = { 11: 20, 9: 14, 14: 11, 10: 10, 13: 4, 12: 3 };
const PLAIN_POINTS: Partial<Record<Rank, number>> = { 14: 11, 10: 10, 13: 4, 12: 3, 11: 2 };

export const TEAM_COUNT = 2;
const TRICKS_PER_ROUND = 8;
export const LAST_TRICK_BONUS = 10;
/** 152 kaartpunten + 10 voor de laatste slag. */
export const TOTAL_POINTS = 162;

/** De twee grote telwijzen (§5). Ze verschillen enkel in de troefplicht. */
export type Telwijze = 'rotterdams' | 'amsterdams';

export interface KlaverjasConfig {
  telwijze: Telwijze;
  /** Bonus wanneer de spelende ploeg alle acht slagen haalt (§7). */
  pitBonus: number;
  /** Vier boeren: 200 in de meeste kringen, elders 100 (§6). */
  fourJacksRoem: number;
  /** Partij: aantal ronden (boompje) — of null om tot targetPoints te spelen. */
  rounds: number | null;
  targetPoints: number;
}

export const DEFAULT_KLAVERJAS_CONFIG: KlaverjasConfig = {
  telwijze: 'rotterdams',
  pitBonus: 100,
  fourJacksRoem: 200,
  rounds: 16,
  targetPoints: 1500,
};

export function teamOf(player: number): number {
  return player % 2;
}

export function partnerOf(player: number): number {
  return (player + 2) % PLAYER_COUNT;
}

export function klaverjasStrength(rank: Rank, suit: Suit, trumpSuit: Suit | null): number {
  const order = trumpSuit !== null && suit === trumpSuit ? TRUMP_ORDER : PLAIN_ORDER;
  return order.length - order.indexOf(rank);
}

export function klaverjasCardPoints(card: Card, trumpSuit: Suit | null): number {
  const isTrump = trumpSuit !== null && card.suit === trumpSuit;
  return (isTrump ? TRUMP_POINTS[card.rank] : PLAIN_POINTS[card.rank]) ?? 0;
}

export function makeKlaverjasDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of KLAVERJAS_RANKS) deck.push({ suit, rank });
  return deck;
}

export function klaverjasDeal(dealer: number, rng: () => number): Card[][] {
  const cards = shuffle(makeKlaverjasDeck(), rng);
  const hands: Card[][] = [[], [], [], []];
  let index = 0;
  for (const batch of [3, 2, 3]) {
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

/* ---------- roem (§6) ---------- */

export interface RoemDetail {
  kind: 'sequence3' | 'sequence4' | 'fourOfAKind' | 'fourJacks' | 'stuk';
  points: number;
}

/** Roem in één slag. `trumpSuit` is nodig voor stuk (heer + vrouw van troef).
 *  Reeksen volgen de gewone volgorde 7-8-9-10-B-V-H-A, ook in troef (§6). */
export function roemInTrick(
  trick: TrickPlay[],
  trumpSuit: Suit | null,
  config: KlaverjasConfig = DEFAULT_KLAVERJAS_CONFIG,
): RoemDetail[] {
  const found: RoemDetail[] = [];
  const cards = trick.map((p) => p.card);

  // Vier dezelfde kaarten.
  if (cards.length === PLAYER_COUNT && cards.every((c) => c.rank === (cards[0] as Card).rank)) {
    const rank = (cards[0] as Card).rank;
    found.push(
      rank === 11
        ? { kind: 'fourJacks', points: config.fourJacksRoem }
        : { kind: 'fourOfAKind', points: 100 },
    );
  }

  // Reeksen per kleur; een reeks van vier telt 50 en niet ook nog 20.
  for (const suit of SUITS) {
    const ranks = cards
      .filter((c) => c.suit === suit)
      .map((c) => c.rank)
      .sort((a, b) => a - b);
    if (ranks.length < 3) continue;
    let run = 1;
    let best = 1;
    for (let i = 1; i < ranks.length; i++) {
      run = (ranks[i] as number) === (ranks[i - 1] as number) + 1 ? run + 1 : 1;
      best = Math.max(best, run);
    }
    if (best >= 4) found.push({ kind: 'sequence4', points: 50 });
    else if (best === 3) found.push({ kind: 'sequence3', points: 20 });
  }

  // Stuk: heer én vrouw van troef, door dezelfde speler in deze slag gelegd.
  if (trumpSuit !== null) {
    for (let p = 0; p < PLAYER_COUNT; p++) {
      const mine = trick.filter((x) => x.player === p).map((x) => x.card);
      const heer = mine.some((c) => c.suit === trumpSuit && c.rank === 13);
      const vrouw = mine.some((c) => c.suit === trumpSuit && c.rank === 12);
      if (heer && vrouw) found.push({ kind: 'stuk', points: 20 });
    }
  }

  return found;
}

export function roemPoints(details: RoemDetail[]): number {
  return details.reduce((sum, d) => sum + d.points, 0);
}

/* ---------- spelen ---------- */

function beats(candidate: Card, target: Card, trumpSuit: Suit | null, ledSuit: Suit): boolean {
  const cTrump = trumpSuit !== null && candidate.suit === trumpSuit;
  const tTrump = trumpSuit !== null && target.suit === trumpSuit;
  if (cTrump && !tTrump) return true;
  if (!cTrump && tTrump) return false;
  if (candidate.suit === target.suit) {
    return (
      klaverjasStrength(candidate.rank, candidate.suit, trumpSuit) >
      klaverjasStrength(target.rank, target.suit, trumpSuit)
    );
  }
  return candidate.suit === ledSuit && target.suit !== ledSuit;
}

export function klaverjasTrickWinner(trick: TrickPlay[], trumpSuit: Suit | null): number {
  if (trick.length === 0) throw new Error('Lege slag');
  const ledSuit = (trick[0] as TrickPlay).card.suit;
  let best = trick[0] as TrickPlay;
  for (const play of trick.slice(1)) {
    if (beats(play.card, best.card, trumpSuit, ledSuit)) best = play;
  }
  return best.player;
}

/** Wie ligt er op dit moment op de slag? null bij een lege slag. */
function currentWinner(trick: TrickPlay[], trumpSuit: Suit | null): number | null {
  return trick.length === 0 ? null : klaverjasTrickWinner(trick, trumpSuit);
}

/** De twee knoppen waarin klaverjassen en belote van elkaar verschillen. */
export interface TrickRules {
  /** Moet je troef bijleggen als je niet kan oversteken? */
  mustUndertrump: boolean;
  /** Mag je vrij bijgooien wanneer je maat de slag al heeft? */
  freeWhenPartnerWins: boolean;
}

export function rulesForTelwijze(telwijze: Telwijze): TrickRules {
  return telwijze === 'rotterdams'
    ? { mustUndertrump: true, freeWhenPartnerWins: false }
    : { mustUndertrump: false, freeWhenPartnerWins: true };
}

/** §5: volgen; anders troeven en oversteken. Wat er daarna moet, verschilt per
 *  telwijze (en bij belote weer anders) — vandaar de losse knoppen. Gedeeld met
 *  de belote-engine, want de slagregels zijn op die twee punten na identiek. */
export function trickLegalPlays(
  hand: Card[],
  trick: TrickPlay[],
  trumpSuit: Suit,
  player: number,
  rules: TrickRules,
): Card[] {
  if (trick.length === 0) return hand;
  const ledSuit = (trick[0] as TrickPlay).card.suit;

  const inSuit = hand.filter((c) => c.suit === ledSuit);
  const trumps = hand.filter((c) => c.suit === trumpSuit);
  const winner = currentWinner(trick, trumpSuit);
  const partnerLeads = winner !== null && winner === partnerOf(player);

  if (ledSuit === trumpSuit) {
    // In troef gevraagd: volgen, en oversteken zolang je kan.
    if (inSuit.length === 0) return hand;
    const highest = trick
      .filter((p) => p.card.suit === trumpSuit)
      .reduce((max, p) => Math.max(max, klaverjasStrength(p.card.rank, p.card.suit, trumpSuit)), 0);
    const higher = inSuit.filter((c) => klaverjasStrength(c.rank, c.suit, trumpSuit) > highest);
    return higher.length > 0 ? higher : inSuit;
  }

  if (inSuit.length > 0) return inSuit;

  // Kleur niet: troefplicht.
  if (trumps.length === 0) return hand;
  if (rules.freeWhenPartnerWins && partnerLeads) return hand;

  const trumpsInTrick = trick.filter((p) => p.card.suit === trumpSuit);
  if (trumpsInTrick.length === 0) return trumps;

  const highest = trumpsInTrick.reduce(
    (max, p) => Math.max(max, klaverjasStrength(p.card.rank, p.card.suit, trumpSuit)),
    0,
  );
  const higher = trumps.filter((c) => klaverjasStrength(c.rank, c.suit, trumpSuit) > highest);
  if (higher.length > 0) return higher;
  // Niet kunnen oversteken: ondertroeven verplicht of vrij bijgooien.
  return rules.mustUndertrump ? trumps : hand;
}

/** Klaverjas-variant met de telwijze als ingang. */
export function klaverjasLegalPlays(
  hand: Card[],
  trick: TrickPlay[],
  trumpSuit: Suit,
  player: number,
  telwijze: Telwijze = 'rotterdams',
): Card[] {
  return trickLegalPlays(hand, trick, trumpSuit, player, rulesForTelwijze(telwijze));
}

/* ---------- troefkeuze ---------- */

export type KlaverjasPhase = 'trump-choice' | 'play' | 'scored';

export interface KlaverjasScore {
  /** Kaartpunten per ploeg, inclusief laatste-slag-bonus (samen 162). */
  cardPoints: number[];
  /** Roem per ploeg. */
  roem: number[];
  /** Kaartpunten + roem per ploeg, vóór de nat-/pitregel. */
  raw: number[];
  declaringTeam: number;
  /** Haalde de spelende ploeg het (meer dan de tegenpartij)? */
  made: boolean;
  pit: boolean;
  /** Wat er uiteindelijk op het blad komt, per ploeg. */
  points: number[];
}

export class KlaverjasGift {
  readonly dealer: number;
  readonly hands: Card[][];
  readonly config: KlaverjasConfig;
  /** Wie mag er nu kiezen, tot de troef vastligt. */
  chooser: number;
  /** Hoeveel spelers al gepast hebben — bij drie passen moet de deler kiezen. */
  passes = 0;
  trumpSuit: Suit | null = null;
  declarer: number | null = null;
  trick: TrickPlay[] = [];
  trickLeader: number;
  lastTrick: TrickPlay[] | null = null;
  readonly history: TrickPlay[][] = [];
  tricksPlayed = 0;
  teamCardPoints: number[] = [0, 0];
  teamRoem: number[] = [0, 0];
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  /** Roem van de laatst gespeelde slag — de UI meldt het aan tafel. */
  lastRoem: RoemDetail[] = [];
  private lastTrickWinner = 0;
  score: KlaverjasScore | null = null;

  constructor(
    dealer: number,
    rng: () => number,
    config: KlaverjasConfig = DEFAULT_KLAVERJAS_CONFIG,
  ) {
    this.dealer = dealer;
    this.config = config;
    this.hands = klaverjasDeal(dealer, rng);
    this.chooser = nextPlayer(dealer);
    this.trickLeader = nextPlayer(dealer);
  }

  get phase(): KlaverjasPhase {
    if (this.score) return 'scored';
    return this.trumpSuit === null ? 'trump-choice' : 'play';
  }

  /** Moet deze speler kiezen omdat iedereen vóór hem paste? (§4) */
  get mustChoose(): boolean {
    return this.passes === PLAYER_COUNT - 1;
  }

  chooseTrump(suit: Suit): void {
    if (this.phase !== 'trump-choice') throw new Error('Geen troefkeuze actief');
    this.trumpSuit = suit;
    this.declarer = this.chooser;
  }

  pass(): void {
    if (this.phase !== 'trump-choice') throw new Error('Geen troefkeuze actief');
    if (this.mustChoose) throw new Error('De deler moet kiezen');
    this.passes++;
    this.chooser = nextPlayer(this.chooser);
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  legalCards(player: number): Card[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    return klaverjasLegalPlays(
      this.hands[player] as Card[],
      this.trick,
      this.trumpSuit as Suit,
      player,
      this.config.telwijze,
    );
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    this.hands[player] = (this.hands[player] as Card[]).filter((c) => !sameCard(c, card));
    this.trick.push({ player, card });
    if (this.trick.length !== PLAYER_COUNT) return;

    const winner = klaverjasTrickWinner(this.trick, this.trumpSuit);
    const team = teamOf(winner);
    const points = this.trick.reduce(
      (sum, p) => sum + klaverjasCardPoints(p.card, this.trumpSuit),
      0,
    );
    this.teamCardPoints[team] = (this.teamCardPoints[team] ?? 0) + points;
    // Roem hoort bij de ploeg die de slag wint, ook als de tegenstander ze legde.
    this.lastRoem = roemInTrick(this.trick, this.trumpSuit, this.config);
    this.teamRoem[team] = (this.teamRoem[team] ?? 0) + roemPoints(this.lastRoem);
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

    const declaringTeam = teamOf(this.declarer as number);
    const other = 1 - declaringTeam;
    const cardPoints = [this.teamCardPoints[0] ?? 0, this.teamCardPoints[1] ?? 0];
    const roem = [this.teamRoem[0] ?? 0, this.teamRoem[1] ?? 0];
    const raw = [(cardPoints[0] ?? 0) + (roem[0] ?? 0), (cardPoints[1] ?? 0) + (roem[1] ?? 0)];

    // §7: binnen is méér dan de tegenpartij; anders nat en alles naar de tegenpartij.
    const made = (raw[declaringTeam] as number) > (raw[other] as number);
    const pit = this.tricksWon.reduce(
      (sum, n, p) => sum + (teamOf(p) === declaringTeam ? n : 0),
      0,
    );
    const isPit = pit === TRICKS_PER_ROUND;

    const points = [0, 0];
    if (made) {
      points[declaringTeam] = (raw[declaringTeam] as number) + (isPit ? this.config.pitBonus : 0);
      points[other] = raw[other] as number;
    } else {
      points[declaringTeam] = 0;
      points[other] = (raw[0] as number) + (raw[1] as number);
    }

    this.score = { cardPoints, roem, raw, declaringTeam, made, pit: isPit, points };
  }
}

export class KlaverjasSession {
  readonly config: KlaverjasConfig;
  private rng: () => number;
  roundNumber = 0;
  dealer: number;
  totals: number[] = [0, 0];
  gift: KlaverjasGift | null = null;

  constructor(
    rng: () => number,
    startDealer = 0,
    config: KlaverjasConfig = DEFAULT_KLAVERJAS_CONFIG,
  ) {
    this.rng = rng;
    this.dealer = startDealer;
    this.config = config;
  }

  get finished(): boolean {
    if (this.gift !== null) return false;
    if (this.config.rounds !== null) return this.roundNumber >= this.config.rounds;
    return this.totals.some((t) => t >= this.config.targetPoints);
  }

  nextGift(): KlaverjasGift {
    this.roundNumber++;
    this.gift = new KlaverjasGift(this.dealer, this.rng, this.config);
    return this.gift;
  }

  closeGift(): void {
    const score = this.gift?.score;
    if (score) {
      this.totals[0] = (this.totals[0] ?? 0) + (score.points[0] ?? 0);
      this.totals[1] = (this.totals[1] ?? 0) + (score.points[1] ?? 0);
    }
    this.dealer = nextPlayer(this.dealer);
    this.gift = null;
  }
}
