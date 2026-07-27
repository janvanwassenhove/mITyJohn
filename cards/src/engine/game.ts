// Gift-orkestratie: delen → bieden → (troefkeuze) → 13 slagen → score.
// De UI en de bots praten uitsluitend via deze klasse met de engine.

import { sameCard, type Card, type Suit } from './cards';
import { deal, nextPlayer, PLAYER_COUNT, type Deal } from './deal';
import { Bidding, type BidResult } from './bidding';
import { legalPlays, trickWinner, type TrickPlay } from './play';
import { scoreGift, type GiftScore } from './scoring';
import type { Contract, Ruleset } from '../ruleset';

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
  /** Alle voltooide slagen, in volgorde — o.a. voor botten met kaartgeheugen. */
  readonly history: TrickPlay[][] = [];
  /** Troel (§5.4): extra slagen omdat de uitkomer zijn aas niet uitkwam. */
  troelPenalty = 0;
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

  /** Kaart die de troel-uitkomer hoort te leggen, of null als dat niet speelt. */
  get requiredLeadCard(): Card | null {
    if (this.contract?.contract.leadCard !== 'fourth-ace') return null;
    return this.bidding.troel?.leadCard ?? null;
  }

  /** Het contract zoals het écht geldt: bij troel schuift het doel op wanneer de
   *  uitkomer zijn aas niet legde (§5.4). */
  get effectiveContract(): Contract {
    const contract = this.contract?.contract as Contract;
    if (!this.troelPenalty) return contract;
    return {
      ...contract,
      target: { ...contract.target, tricks: contract.target.tricks + this.troelPenalty },
    };
  }

  get toPlay(): number {
    return this.trick.length === 0
      ? this.trickLeader
      : nextPlayer((this.trick[this.trick.length - 1] as TrickPlay).player);
  }

  legalCards(player: number): Card[] {
    if (!this.contract || player !== this.toPlay) return [];
    return legalPlays(this.deal.hands[player] as Card[], this.trick, this.contract.trumpSuit, {
      mustTrump: this.ruleset.play.mustTrump,
      mustOvertrump: this.ruleset.play.mustOvertrump,
    });
  }

  playCard(player: number, card: Card): void {
    if (!this.legalCards(player).some((c) => sameCard(c, card))) {
      throw new Error('Ongeldige kaart');
    }
    const hand = this.deal.hands[player] as Card[];
    this.deal.hands[player] = hand.filter((c) => !sameCard(c, card));
    // Troel (§5.4): de eerste kaart van de uitkomer bepaalt de troef. Hij hoort
    // daar zijn vierde aas (of de hartenheer) voor te leggen; doet hij dat niet,
    // dan moet het team één slag méér halen.
    if (
      this.contract &&
      this.contract.contract.trump === 'first-card-led' &&
      this.contract.trumpSuit === null &&
      this.tricksPlayed === 0 &&
      this.trick.length === 0
    ) {
      this.contract = { ...this.contract, trumpSuit: card.suit };
      const required = this.requiredLeadCard;
      if (required && !sameCard(required, card)) {
        this.troelPenalty = this.contract.contract.targetPenaltyOtherLead ?? 0;
      }
    }
    this.trick.push({ player, card });
    if (this.trick.length === PLAYER_COUNT) {
      const winner = trickWinner(this.trick, this.contract?.trumpSuit ?? null);
      this.tricksWon[winner] = (this.tricksWon[winner] ?? 0) + 1;
      this.tricksPlayed++;
      this.lastTrick = this.trick;
      this.history.push(this.trick);
      this.trick = [];
      this.trickLeader = winner;
      if (this.tricksPlayed === 13 && this.contract) {
        this.score = scoreGift({
          contract: this.effectiveContract,
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
