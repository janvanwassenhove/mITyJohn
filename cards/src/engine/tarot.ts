// Frans tarot — REGELS-TAROT.md. Het apart traject: 78 eigen kaarten en 3, 4 of 5
// spelers, waar elke andere engine in deze app op vier stoelen en 32/52 kaarten
// vastzit. Daarom neemt deze engine het aantal spelers als parameter en gebruikt
// hij nergens PLAYER_COUNT.
//
// Er wordt intern in **halve punten** gerekend (§2.2): elke kaartwaarde eindigt op
// een halve punt, en zo hoeft er nooit afgerond of met kommagetallen gerekend te
// worden. De UI toont ze via formatHalfPoints().

import { shuffle, type Suit } from './cards';
import {
  DAME,
  ROI,
  VALET,
  CAVALIER,
  countBouts,
  halfPointsOf,
  isBout,
  isPetit,
  makeTarotDeck,
  sameTarotCard,
  type TarotCard,
  type TarotRank,
} from './tarot-cards';

export type PlayerCount = 3 | 4 | 5;

export type ContractId = 'petite' | 'garde' | 'garde-sans' | 'garde-contre';

export interface ContractInfo {
  id: ContractId;
  rank: number;
  multiplier: number;
  /** Neemt de preneur de chien in zijn hand? (§5) */
  takesChien: boolean;
  /** Naar wiens slagen gaat de chien als hij dicht blijft? */
  chienTo: 'preneur' | 'defense';
}

export const CONTRACTS: ContractInfo[] = [
  { id: 'petite', rank: 1, multiplier: 1, takesChien: true, chienTo: 'preneur' },
  { id: 'garde', rank: 2, multiplier: 2, takesChien: true, chienTo: 'preneur' },
  { id: 'garde-sans', rank: 3, multiplier: 4, takesChien: false, chienTo: 'preneur' },
  { id: 'garde-contre', rank: 4, multiplier: 6, takesChien: false, chienTo: 'defense' },
];

export function contractInfo(id: ContractId): ContractInfo {
  return CONTRACTS.find((c) => c.id === id) as ContractInfo;
}

/** §3 — hoeveel kaarten krijgt iedereen, en hoe groot is de chien? */
export function dealShape(players: PlayerCount): { hand: number; chien: number } {
  if (players === 3) return { hand: 24, chien: 6 };
  if (players === 4) return { hand: 18, chien: 6 };
  return { hand: 15, chien: 3 };
}

/** §8 — het doel in **halve punten**, naargelang het aantal bouts. */
const TARGET_HALF: Record<number, number> = { 0: 112, 1: 102, 2: 82, 3: 72 };

export function targetHalfPoints(bouts: number): number {
  return TARGET_HALF[Math.min(3, bouts)] as number;
}

export interface TarotConfig {
  players: PlayerCount;
  /** §9 — telt de 1 van atout in de laatste slag mee? */
  petitAuBout: boolean;
  /** §9.2 — bonus voor een niet-aangekondigde chelem, in hele punten. */
  chelemBonus: number;
}

export const DEFAULT_TAROT_CONFIG: TarotConfig = {
  players: 4,
  petitAuBout: true,
  chelemBonus: 200,
};

/* ---------- slagregels (§6) ---------- */

export interface TarotPlay {
  player: number;
  card: TarotCard;
}

/** De kaart die de slag opent: de eerste die geen excuse is (§6.3). */
export type LedCard = Extract<TarotCard, { kind: 'suit' } | { kind: 'trump' }>;

export function ledCardOf(trick: TarotPlay[]): LedCard | null {
  const play = trick.find((p) => p.card.kind !== 'excuse');
  return play ? (play.card as LedCard) : null;
}

function highestTrumpIn(trick: TarotPlay[]): number {
  return trick.reduce((max, p) => (p.card.kind === 'trump' ? Math.max(max, p.card.value) : max), 0);
}

/**
 * §6 — kleur bekennen, anders troeven, en dan ook nog stijgen. De excuse mag
 * altijd (§6.3), dus die staat los van elke verplichting.
 */
export function tarotLegalPlays(hand: TarotCard[], trick: TarotPlay[]): TarotCard[] {
  const excuse = hand.filter((c) => c.kind === 'excuse');
  const led = ledCardOf(trick);
  if (led === null) return [...hand]; // uitkomen, of enkel de excuse ligt er

  const trumps = hand.filter((c) => c.kind === 'trump');
  const hoogste = highestTrumpIn(trick);
  const hoger = trumps.filter((c) => c.kind === 'trump' && c.value > hoogste);

  if (led.kind === 'trump') {
    if (trumps.length === 0) return [...hand];
    // Stijgplicht: hoger als het kan, anders eender welke atout.
    return [...(hoger.length > 0 ? hoger : trumps), ...excuse];
  }

  const volgen = hand.filter((c) => c.kind === 'suit' && c.suit === led.suit);
  if (volgen.length > 0) return [...volgen, ...excuse];
  if (trumps.length === 0) return [...hand];
  return [...(hoger.length > 0 ? hoger : trumps), ...excuse];
}

/** §6 — de excuse wint nooit; anders de hoogste atout, anders de hoogste kaart
 *  in de gevraagde kleur. */
export function tarotTrickWinner(trick: TarotPlay[]): number {
  const led = ledCardOf(trick);
  if (led === null) throw new Error('Slag bestaat enkel uit de excuse');
  const troeven = trick.filter((p) => p.card.kind === 'trump');
  if (troeven.length > 0) {
    return troeven.reduce((best, p) =>
      (p.card as { value: number }).value > (best.card as { value: number }).value ? p : best,
    ).player;
  }
  const kleur = (led as Extract<TarotCard, { kind: 'suit' }>).suit;
  const inKleur = trick.filter((p) => p.card.kind === 'suit' && p.card.suit === kleur);
  return inKleur.reduce((best, p) =>
    (p.card as { rank: number }).rank > (best.card as { rank: number }).rank ? p : best,
  ).player;
}

/* ---------- gift ---------- */

export type TarotPhase = 'bidding' | 'call' | 'ecart' | 'play' | 'redeal' | 'scored';

export interface TarotScore {
  /** Halve punten in de slagen van de preneur (§2.2). */
  preneurHalf: number;
  bouts: number;
  targetHalf: number;
  /** preneurHalf − targetHalf; ≥ 0 betekent gehaald. */
  diffHalf: number;
  made: boolean;
  multiplier: number;
  petitAuBout: 0 | 1 | -1;
  chelem: boolean;
  /** Het bedrag dat één aandeel waard is, in halve punten. */
  unitHalf: number;
  /** Per speler, in halve punten — samen altijd nul. */
  pointsHalf: number[];
}

export class TarotGift {
  readonly players: PlayerCount;
  readonly dealer: number;
  readonly config: TarotConfig;
  hands: TarotCard[][];
  readonly chien: TarotCard[];
  /** Ligt de chien open? Alleen bij petite en garde, tussen bod en écart. */
  chienOpen = false;

  /** Per speler het bod, of null zolang hij niet gesproken heeft. */
  bids: (ContractId | 'pass' | null)[];
  toAct: number;
  taker: number | null = null;
  contract: ContractId | null = null;

  /** §7 — bij vijf spelers: de geroepen kaart en (zodra ze valt) de partner. */
  calledCard: TarotCard | null = null;
  partner: number | null = null;
  partnerRevealed = false;

  ecart: TarotCard[] = [];

  trick: TarotPlay[] = [];
  trickLeader: number;
  lastTrick: TarotPlay[] | null = null;
  readonly history: TarotPlay[][] = [];
  tricksPlayed = 0;
  tricksWon: number[];
  /** Kaarten in de slagen van elke speler. */
  won: TarotCard[][];
  /** §6.3 — halve punten die de excuse-speler zijn tegenstander schuldig is. */
  private excuseDebt: number[];
  redealt = false;
  score: TarotScore | null = null;

  constructor(dealer: number, rng: () => number, config: TarotConfig = DEFAULT_TAROT_CONFIG) {
    this.players = config.players;
    this.dealer = dealer;
    this.config = config;
    const { hand, chien } = dealShape(this.players);
    const cards = shuffle(makeTarotDeck(), rng);
    this.hands = Array.from({ length: this.players }, () => []);
    let i = 0;
    // Per drie kaarten delen (§3), links van de deler eerst.
    for (let gegeven = 0; gegeven < hand; gegeven += 3) {
      for (let seat = 1; seat <= this.players; seat++) {
        const p = (dealer + seat) % this.players;
        for (let n = 0; n < 3; n++) (this.hands[p] as TarotCard[]).push(cards[i++] as TarotCard);
      }
    }
    this.chien = cards.slice(i, i + chien);
    this.bids = new Array<ContractId | 'pass' | null>(this.players).fill(null);
    this.toAct = this.next(dealer);
    this.trickLeader = this.next(dealer);
    this.tricksWon = new Array<number>(this.players).fill(0);
    this.won = Array.from({ length: this.players }, () => []);
    this.excuseDebt = new Array<number>(this.players).fill(0);
  }

  private next(player: number): number {
    return (player + 1) % this.players;
  }

  get cardsPerHand(): number {
    return dealShape(this.players).hand;
  }

  get phase(): TarotPhase {
    if (this.score) return 'scored';
    if (this.redealt) return 'redeal';
    if (this.bids.some((b) => b === null)) return 'bidding';
    if (this.taker === null) return 'redeal';
    if (this.players === 5 && this.calledCard === null) return 'call';
    if (this.needsEcart()) return 'ecart';
    return 'play';
  }

  private needsEcart(): boolean {
    if (this.contract === null) return false;
    return contractInfo(this.contract).takesChien && this.ecart.length < this.chien.length;
  }

  /* ---------- bieden (§4) ---------- */

  get highestBid(): ContractId | null {
    let best: ContractInfo | null = null;
    for (const b of this.bids) {
      if (b === null || b === 'pass') continue;
      const info = contractInfo(b);
      if (best === null || info.rank > best.rank) best = info;
    }
    return best?.id ?? null;
  }

  legalBids(player: number): ContractId[] {
    if (this.phase !== 'bidding' || player !== this.toAct) return [];
    const huidig = this.highestBid;
    const min = huidig === null ? 0 : contractInfo(huidig).rank;
    return CONTRACTS.filter((c) => c.rank > min).map((c) => c.id);
  }

  bid(player: number, contract: ContractId | 'pass'): void {
    if (this.phase !== 'bidding' || player !== this.toAct) throw new Error('Niet aan de beurt');
    if (contract !== 'pass' && !this.legalBids(player).includes(contract)) {
      throw new Error('Dit bod is te laag');
    }
    this.bids[player] = contract;
    this.toAct = this.next(this.toAct);
    if (this.bids.some((b) => b === null)) return;
    this.settleBidding();
  }

  private settleBidding(): void {
    const winnend = this.highestBid;
    if (winnend === null) {
      this.redealt = true; // §4 — iedereen paste
      return;
    }
    this.contract = winnend;
    this.taker = this.bids.findIndex((b) => b === winnend);
    // Bij vijf spelers roept de preneur zijn heer vóór de chien opengaat (§7),
    // anders zou hij die zes kaarten al zien terwijl hij kiest.
    if (this.players !== 5) this.openChien();
  }

  private openChien(): void {
    if (this.contract === null || !contractInfo(this.contract).takesChien) return;
    this.chienOpen = true;
    (this.hands[this.taker as number] as TarotCard[]).push(...this.chien);
  }

  /* ---------- geroepen heer (§7) ---------- */

  /** Welke rang roept de preneur? Normaal de heer; heeft hij die alle vier, dan
   *  zakt hij naar dame, cavalier, valet. */
  callRank(): TarotRank {
    const hand = this.hands[this.taker as number] as TarotCard[];
    const heeft = (rank: number): number =>
      hand.filter((c) => c.kind === 'suit' && c.rank === rank).length;
    if (heeft(ROI) < 4) return ROI as TarotRank;
    if (heeft(DAME) < 4) return DAME as TarotRank;
    if (heeft(CAVALIER) < 4) return CAVALIER as TarotRank;
    return VALET as TarotRank;
  }

  callKing(suit: Suit): void {
    if (this.phase !== 'call') throw new Error('Er wordt nu geen heer geroepen');
    const rank = this.callRank();
    this.calledCard = { kind: 'suit', suit, rank };
    // De partner ligt vast, maar niemand weet wie het is tot de kaart valt.
    // Roept de preneur zichzelf, of zit de kaart in de chien, dan is er geen
    // partner en speelt hij alleen tegen vier (§7).
    const houder = this.hands.findIndex((h) =>
      h.some((c) => sameTarotCard(c, this.calledCard as TarotCard)),
    );
    this.partner = houder >= 0 && houder !== this.taker ? houder : null;
    if (this.partner === null) this.partnerRevealed = true;
    this.openChien();
  }

  /* ---------- écart (§5) ---------- */

  /** Welke kaarten mag de preneur nog wegleggen, gegeven wat hij al koos? */
  legalDiscards(): TarotCard[] {
    if (this.phase !== 'ecart') return [];
    const hand = this.hands[this.taker as number] as TarotCard[];
    const beschikbaar = hand.filter((c) => !this.ecart.some((e) => sameTarotCard(e, c)));
    const gewoon = beschikbaar.filter((c) => c.kind === 'suit' && c.rank !== ROI && !isBout(c));
    const nogNodig = this.chien.length - this.ecart.length;
    // Atouts mogen enkel wanneer er anders geen geldige écart overblijft (§5).
    if (gewoon.length >= nogNodig) return gewoon;
    const atouts = beschikbaar.filter((c) => c.kind === 'trump' && !isBout(c));
    return [...gewoon, ...atouts];
  }

  /** Een kaart uit de écart terugnemen. De UI biedt dat aan zolang de écart
   *  loopt, zodat een mistik geen goede kaart kost. */
  undoLastDiscard(): void {
    if (this.contract === null || !contractInfo(this.contract).takesChien) return;
    const card = this.ecart.pop();
    if (!card) return;
    (this.hands[this.taker as number] as TarotCard[]).push(card);
    this.chienOpen = true;
  }

  discard(card: TarotCard): void {
    if (!this.legalDiscards().some((c) => sameTarotCard(c, card))) {
      throw new Error('Deze kaart mag niet in de écart');
    }
    this.ecart.push(card);
    const taker = this.taker as number;
    this.hands[taker] = (this.hands[taker] as TarotCard[]).filter((c) => !sameTarotCard(c, card));
    if (!this.needsEcart()) this.chienOpen = false;
  }

  /* ---------- spelen (§6) ---------- */

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : this.next((this.trick[this.trick.length - 1] as TarotPlay).player);
  }

  legalCards(player: number): TarotCard[] {
    if (this.phase !== 'play' || player !== this.toPlay) return [];
    return tarotLegalPlays(this.hands[player] as TarotCard[], this.trick);
  }

  get lastTrickNow(): boolean {
    return (this.hands[this.toPlay] as TarotCard[]).length === 1 && this.trick.length === 0;
  }

  playCard(player: number, card: TarotCard): void {
    if (!this.legalCards(player).some((c) => sameTarotCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    this.hands[player] = (this.hands[player] as TarotCard[]).filter((c) => !sameTarotCard(c, card));
    this.trick.push({ player, card });
    // §7: de geroepen kaart onthult de partner zodra ze valt.
    if (this.calledCard && sameTarotCard(card, this.calledCard)) this.partnerRevealed = true;
    if (this.trick.length !== this.players) return;

    const winner = tarotTrickWinner(this.trick);
    const laatste = (this.hands[winner] as TarotCard[]).length === 0;
    for (const play of this.trick) {
      if (play.card.kind === 'excuse' && !laatste) {
        // §6.3 — de excuse blijft bij zijn eigenaar; die geeft de winnaar een
        // kaart van 0,5 punt terug. De app verrekent die halve punt meteen in
        // plaats van fysiek een kaart te ruilen: de uitkomst is dezelfde.
        (this.won[play.player] as TarotCard[]).push(play.card);
        this.excuseDebt[play.player] = (this.excuseDebt[play.player] ?? 0) + 1;
        this.excuseDebt[winner] = (this.excuseDebt[winner] ?? 0) - 1;
      } else {
        (this.won[winner] as TarotCard[]).push(play.card);
      }
    }
    this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
    this.tricksPlayed++;
    this.lastTrick = this.trick;
    this.history.push(this.trick);
    this.trick = [];
    this.trickLeader = winner;
    if (laatste) this.finish();
  }

  /** Speelt deze speler mee met de preneur? (§7) */
  onTakerSide(player: number): boolean {
    return player === this.taker || (this.partner !== null && player === this.partner);
  }

  private finish(): void {
    const taker = this.taker as number;
    const info = contractInfo(this.contract as ContractId);

    // Alles wat aan de kant van de preneur ligt: zijn slagen, die van zijn
    // partner, zijn écart en — behalve bij garde contre — de chien.
    const preneurKaarten: TarotCard[] = [];
    let preneurDebt = 0;
    let preneurTricks = 0;
    for (let p = 0; p < this.players; p++) {
      if (!this.onTakerSide(p)) continue;
      preneurKaarten.push(...(this.won[p] as TarotCard[]));
      preneurDebt += this.excuseDebt[p] ?? 0;
      preneurTricks += this.tricksWon[p] ?? 0;
    }
    preneurKaarten.push(...this.ecart);
    if (!info.takesChien) {
      if (info.chienTo === 'preneur') preneurKaarten.push(...this.chien);
    }

    // §6.3 — heeft de excuse-kant geen enkele slag, dan is de excuse verloren.
    let extra = preneurDebt;
    const preneurHeeftExcuse = preneurKaarten.some((c) => c.kind === 'excuse');
    if (preneurHeeftExcuse && preneurTricks === 0) {
      const i = preneurKaarten.findIndex((c) => c.kind === 'excuse');
      preneurKaarten.splice(i, 1);
      extra = 0;
    }

    const preneurHalf = halfPointsOf(preneurKaarten) + extra;
    const bouts = countBouts(preneurKaarten);
    const targetHalf = targetHalfPoints(bouts);
    const diffHalf = preneurHalf - targetHalf;
    const made = diffHalf >= 0;

    // §9 — petit au bout: wie de 1 van atout in de laatste slag binnenhaalt.
    let petit: 0 | 1 | -1 = 0;
    if (this.config.petitAuBout) {
      const laatste = this.history[this.history.length - 1];
      const speler = laatste?.find((p) => isPetit(p.card));
      if (laatste && speler) {
        const winnaar = tarotTrickWinner(laatste);
        petit = this.onTakerSide(winnaar) ? 1 : -1;
      }
    }

    const chelem = preneurTricks === this.history.length;
    // Alles in halve punten: 25 → 50, petit au bout 10 → 20 (§9).
    const basisHalf = 50 + Math.abs(diffHalf) + petit * 20;
    let unitHalf = basisHalf * info.multiplier;
    if (chelem) unitHalf += this.config.chelemBonus * 2;
    if (!made) unitHalf = -unitHalf;

    // §9.1 — aandelen; samen altijd nul.
    const pointsHalf = new Array<number>(this.players).fill(0);
    const verdedigers = this.players - (this.partner !== null ? 2 : 1);
    for (let p = 0; p < this.players; p++) {
      if (p === taker)
        pointsHalf[p] = unitHalf * verdedigers - (this.partner !== null ? unitHalf : 0);
      else if (p === this.partner) pointsHalf[p] = unitHalf;
      else pointsHalf[p] = -unitHalf;
    }

    this.score = {
      preneurHalf,
      bouts,
      targetHalf,
      diffHalf,
      made,
      multiplier: info.multiplier,
      petitAuBout: petit,
      chelem,
      unitHalf,
      pointsHalf,
    };
  }
}

export class TarotSession {
  readonly config: TarotConfig;
  readonly players: PlayerCount;
  private rng: () => number;
  giftNumber = 0;
  dealer: number;
  totalsHalf: number[];
  gift: TarotGift | null = null;

  constructor(rng: () => number, startDealer = 0, config: TarotConfig = DEFAULT_TAROT_CONFIG) {
    this.rng = rng;
    this.config = config;
    this.players = config.players;
    this.dealer = startDealer;
    this.totalsHalf = new Array<number>(this.players).fill(0);
  }

  /** Eén gift per speler: iedereen deelt één keer. */
  get totalGiften(): number {
    return this.players;
  }

  get finished(): boolean {
    return this.gift === null && this.giftNumber >= this.totalGiften;
  }

  get winner(): number {
    return this.totalsHalf.indexOf(Math.max(...this.totalsHalf));
  }

  nextGift(): TarotGift {
    this.gift = new TarotGift(this.dealer, this.rng, this.config);
    return this.gift;
  }

  closeGift(): void {
    const score = this.gift?.score;
    if (score) {
      this.giftNumber++;
      for (let p = 0; p < this.players; p++) {
        this.totalsHalf[p] = (this.totalsHalf[p] ?? 0) + (score.pointsHalf[p] ?? 0);
      }
    }
    // Een herdeel telt niet als gespeelde gift (§4).
    this.dealer = (this.dealer + 1) % this.players;
    this.gift = null;
  }
}
