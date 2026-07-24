// Biedronde — REGELS.md §4–§5. Start links van de deler, met de klok mee.
// Troel is verplicht (§5.4) en wordt vóór de vrije biedronde gedetecteerd.

import { ACE, type Card, type Suit } from './cards';
import { nextPlayer, PLAYER_COUNT } from './deal';
import type { Contract, Ruleset } from '../ruleset';

export interface TroelInfo {
  holder: number;
  partner: number;
  trumpSuit: Suit;
  /** Kaart waarmee de partner verplicht uitkomt (de vierde aas / hoogste harten). */
  leadCard: Card;
}

export interface BidResult {
  contract: Contract;
  declarers: number[];
  /** null zolang de bieder de troef nog moet kiezen (abondance/solo). */
  trumpSuit: Suit | null;
  leader: number;
  forcedLeadCard?: Card;
}

export type BidAction = { type: 'pass' } | { type: 'bid'; contractId: string } | { type: 'join' };

export type BidPhase = 'bidding' | 'alleen-choice' | 'trump-choice' | 'done' | 'redeal';

/** Zoek troel: exact 3 azen (of 4 — dan partnerregel hartenheer, §5.4 ⚠️ AANNAME). */
export function detectTroel(hands: Card[][]): TroelInfo | null {
  for (let p = 0; p < PLAYER_COUNT; p++) {
    const hand = hands[p] as Card[];
    const aces = hand.filter((c) => c.rank === ACE);
    if (aces.length === 3) {
      const missing = (['S', 'H', 'D', 'C'] as Suit[]).find(
        (s) => !aces.some((a) => a.suit === s),
      ) as Suit;
      const partner = hands.findIndex((h) => h.some((c) => c.rank === ACE && c.suit === missing));
      return {
        holder: p,
        partner,
        trumpSuit: missing,
        leadCard: { suit: missing, rank: ACE },
      };
    }
    if (aces.length === 4) {
      // Partner = houder hartenheer; heeft niemand anders die, dan hoogste harten buiten de hand.
      for (let rank = 13; rank >= 2; rank--) {
        const partner = hands.findIndex(
          (h, idx) => idx !== p && h.some((c) => c.suit === 'H' && c.rank === rank),
        );
        if (partner >= 0) {
          return {
            holder: p,
            partner,
            trumpSuit: 'H',
            leadCard: { suit: 'H', rank: rank as Card['rank'] },
          };
        }
      }
    }
  }
  return null;
}

export class Bidding {
  readonly ruleset: Ruleset;
  readonly dealer: number;
  readonly turnedSuit: Suit;
  readonly troel: TroelInfo | null;

  phase: BidPhase = 'bidding';
  current: { contract: Contract; declarers: number[] } | null = null;
  private passed = new Set<number>();
  toAct: number;

  constructor(ruleset: Ruleset, dealer: number, hands: Card[][], turnedSuit: Suit) {
    this.ruleset = ruleset;
    this.dealer = dealer;
    this.turnedSuit = turnedSuit;
    this.troel = detectTroel(hands);
    if (this.troel) {
      const troelContract = this.byId('troel');
      this.current = {
        contract: troelContract,
        declarers: [this.troel.holder, this.troel.partner],
      };
    }
    this.toAct = nextPlayer(dealer);
    this.skipToActive();
  }

  private byId(id: string): Contract {
    const contract = this.ruleset.contracts.find((c) => c.id === id);
    if (!contract) throw new Error(`Onbekend contract: ${id}`);
    return contract;
  }

  private isDeclarer(player: number): boolean {
    return this.current?.declarers.includes(player) ?? false;
  }

  private skipToActive(): void {
    for (let i = 0; i < PLAYER_COUNT; i++) {
      if (!this.passed.has(this.toAct) && !this.isDeclarer(this.toAct)) return;
      this.toAct = nextPlayer(this.toAct);
    }
    this.finish();
  }

  /** Minimale rang die een nieuw bod moet halen. */
  private minRank(): number {
    if (!this.current) return 0;
    const c = this.current.contract;
    return Math.max(c.rank + 1, c.overbiddableFromRank ?? 0);
  }

  /** Biedbare contracten voor de gegeven speler (zonder pass/join). */
  legalBids(player: number): Contract[] {
    if (this.phase !== 'bidding' || player !== this.toAct) return [];
    const min = this.minRank();
    return this.ruleset.contracts.filter(
      (c) => c.rank >= Math.max(min, 1) && !c.mandatory && !c.onlyIfNoPartner,
    );
  }

  canJoin(player: number): boolean {
    if (this.phase !== 'bidding' || player !== this.toAct || !this.current) return false;
    const { contract, declarers } = this.current;
    if (contract.id === 'vraag-en-mee') return declarers.length === 1;
    return Boolean(contract.multipleDeclarers);
  }

  act(player: number, action: BidAction): void {
    if (this.phase !== 'bidding' || player !== this.toAct) {
      throw new Error('Speler is niet aan de beurt');
    }
    if (action.type === 'pass') {
      this.passed.add(player);
    } else if (action.type === 'join') {
      if (!this.canJoin(player)) throw new Error('Meegaan is nu niet toegelaten');
      this.current?.declarers.push(player);
    } else {
      const contract = this.byId(action.contractId);
      if (!this.legalBids(player).some((c) => c.id === contract.id)) {
        throw new Error(`Bod ${contract.id} is niet toegelaten`);
      }
      this.current = { contract, declarers: [player] };
    }
    this.toAct = nextPlayer(this.toAct);
    this.skipToActive();
  }

  /** §5.2 — de vrager kiest bij gebrek aan maat: alleen spelen of passen. */
  chooseAlleen(accept: boolean): void {
    if (this.phase !== 'alleen-choice' || !this.current)
      throw new Error('Geen alleen-keuze actief');
    if (accept) {
      this.current = { contract: this.byId('alleen'), declarers: this.current.declarers };
      this.phase = 'done';
    } else {
      this.current = null;
      this.phase = 'redeal';
    }
  }

  private finish(): void {
    if (!this.current) {
      this.phase = 'redeal';
      return;
    }
    if (this.current.contract.id === 'vraag-en-mee' && this.current.declarers.length === 1) {
      this.phase = 'alleen-choice';
      return;
    }
    this.phase = 'done';
  }

  result(): BidResult | null {
    if (this.phase !== 'done' || !this.current) return null;
    const { contract, declarers } = this.current;
    let trumpSuit: Suit | null;
    switch (contract.trump) {
      case 'turned':
        trumpSuit = this.turnedSuit;
        break;
      case 'fourth-ace-suit':
        trumpSuit = this.troel?.trumpSuit ?? this.turnedSuit;
        break;
      case 'none':
        trumpSuit = null;
        break;
      case 'declarer-choice':
        trumpSuit = null; // wordt via chooseTrump in Gift gezet
        break;
    }
    let leader = nextPlayer(this.dealer);
    if (contract.openingLead === 'declarer') leader = declarers[0] as number;
    if (contract.openingLead === 'fourth-ace-holder' && this.troel) leader = this.troel.partner;
    const result: BidResult = { contract, declarers: [...declarers], trumpSuit, leader };
    if (contract.openingLead === 'fourth-ace-holder' && this.troel) {
      result.forcedLeadCard = this.troel.leadCard;
    }
    return result;
  }
}
