// Gift-orkestratie: delen → bieden → (troefkeuze) → 13 slagen → score.
// De UI en de bots praten uitsluitend via deze klasse met de engine.

import { sameCard, type Card, type Suit } from './cards';
import { deal, nextPlayer, PLAYER_COUNT, type Deal } from './deal';
import { Bidding, type BidResult } from './bidding';
import { legalPlays, trickWinner, type TrickPlay } from './play';
import { scoreGift, type GiftScore } from './scoring';
import type { Ruleset } from '../ruleset';

export type GiftPhase = 'bidding' | 'alleen-choice' | 'trump-choice' | 'play' | 'scored' | 'redeal';

export class Gift {
  readonly ruleset: Ruleset;
  readonly deal: Deal;
  readonly bidding: Bidding;

  contract: BidResult | null = null;
  trick: TrickPlay[] = [];
  trickLeader = 0;
  tricksWon: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  tricksPlayed = 0;
  lastTrick: TrickPlay[] | null = null;
  score: GiftScore | null = null;

  constructor(ruleset: Ruleset, dealer: number, rng: () => number) {
    this.ruleset = ruleset;
    this.deal = deal(dealer, rng, ruleset.play.dealPattern);
    this.bidding = new Bidding(ruleset, dealer, this.deal.hands, this.deal.trumpSuit);
  }

  get phase(): GiftPhase {
    if (this.score) return 'scored';
    if (this.contract) return 'play';
    switch (this.bidding.phase) {
      case 'bidding':
        return 'bidding';
      case 'alleen-choice':
        return 'alleen-choice';
      case 'redeal':
        return 'redeal';
      default:
        return 'trump-choice';
    }
  }

  /** Na afloop van het bieden: contract vastleggen (en evt. wachten op troefkeuze). */
  settleBidding(): void {
    const result = this.bidding.result();
    if (!result) return;
    if (result.contract.trump === 'declarer-choice' && result.trumpSuit === null) {
      // troef nog te kiezen door result.declarers[0] — phase blijft 'trump-choice'
      this.pendingResult = result;
      return;
    }
    this.start(result);
  }

  private pendingResult: BidResult | null = null;

  get trumpChooser(): number | null {
    return this.pendingResult ? (this.pendingResult.declarers[0] as number) : null;
  }

  chooseTrump(suit: Suit): void {
    if (!this.pendingResult) throw new Error('Geen troefkeuze actief');
    this.start({ ...this.pendingResult, trumpSuit: suit });
    this.pendingResult = null;
  }

  private start(result: BidResult): void {
    this.contract = result;
    this.trickLeader = result.leader;
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  legalCards(player: number): Card[] {
    if (!this.contract || player !== this.toPlay) return [];
    return legalPlays(this.deal.hands[player] as Card[], this.trick);
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    const hand = this.deal.hands[player] as Card[];
    this.deal.hands[player] = hand.filter((c) => !sameCard(c, card));
    // Troel (§5.4, bevestigd): de eerste kaart van de uitkomer bepaalt de troef.
    if (
      this.contract &&
      this.contract.contract.trump === 'first-card-led' &&
      this.contract.trumpSuit === null &&
      this.tricksPlayed === 0 &&
      this.trick.length === 0
    ) {
      this.contract = { ...this.contract, trumpSuit: card.suit };
    }
    this.trick.push({ player, card });
    if (this.trick.length === PLAYER_COUNT) {
      const winner = trickWinner(this.trick, this.contract?.trumpSuit ?? null);
      this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
      this.tricksPlayed++;
      this.lastTrick = this.trick;
      this.trick = [];
      this.trickLeader = winner;
      if (this.tricksPlayed === 13 && this.contract) {
        this.score = scoreGift({
          contract: this.contract.contract,
          declarers: this.contract.declarers,
          tricksWon: this.tricksWon,
        });
      }
    }
  }
}

export interface SessionState {
  giftNumber: number;
  totalGiften: number;
  dealer: number;
  totals: number[];
}

export class Session {
  readonly ruleset: Ruleset;
  readonly totalGiften: number;
  private rng: () => number;
  giftNumber = 0;
  dealer: number;
  totals: number[] = new Array<number>(PLAYER_COUNT).fill(0);
  gift: Gift | null = null;

  constructor(ruleset: Ruleset, rng: () => number, startDealer = 0) {
    this.ruleset = ruleset;
    this.totalGiften = ruleset.session?.giften ?? 16;
    this.rng = rng;
    this.dealer = startDealer;
  }

  get finished(): boolean {
    return this.giftNumber >= this.totalGiften && this.gift === null;
  }

  nextGift(): Gift {
    this.giftNumber++;
    this.gift = new Gift(this.ruleset, this.dealer, this.rng);
    return this.gift;
  }

  /** Sluit de lopende gift af (gescoord of herdeel) en schuif de deler door. */
  closeGift(): void {
    if (this.gift?.score) {
      for (let p = 0; p < PLAYER_COUNT; p++) {
        this.totals[p] = (this.totals[p] ?? 0) + (this.gift.score.points[p] ?? 0);
      }
    } else if (this.gift && this.gift.phase === 'redeal') {
      this.giftNumber--; // §4: iedereen past → zelfde gift opnieuw, volgende deler
    }
    this.dealer = nextPlayer(this.dealer);
    this.gift = null;
  }
}
