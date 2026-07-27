// Kleurenwiezen (REGELS.md §3bis): de vrager noemt de troefkleur bij zijn bod,
// er wordt geen kaart omgedraaid. Alle andere regels zijn die van gewoon wiezen.

import { describe, expect, it } from 'vitest';
import { mulberry32, type Card } from './cards';
import { Session } from './game';
import { getRuleset, type Ruleset } from '../ruleset';

const kleuren = getRuleset('kleurenwiezen') as Ruleset;
const gewoon = getRuleset('vlaams-standaard') as Ruleset;

/** Eerste gift zonder verplichte troel — die overrulet immers de biedronde. */
function giftWithoutTroel(ruleset: Ruleset, from = 1) {
  for (let seed = from; seed < from + 200; seed++) {
    const gift = new Session(ruleset, mulberry32(seed)).nextGift();
    if (!gift.bidding.troel) return gift;
  }
  throw new Error('geen gift zonder troel gevonden');
}

describe('kleurenwiezen', () => {
  it('vraag en alleen zijn aangekondigde contracten, de rest niet', () => {
    const byId = (r: Ruleset, id: string) => r.contracts.find((c) => c.id === id);
    expect(byId(kleuren, 'vraag-en-mee')?.trump).toBe('announced');
    expect(byId(kleuren, 'alleen')?.trump).toBe('announced');
    expect(byId(kleuren, 'troel')?.trump).toBe('first-card-led');
    expect(byId(kleuren, 'abondance-9')?.trump).toBe('declarer-choice');
    expect(byId(kleuren, 'miserie')?.trump).toBe('none');
    // Gewoon wiezen blijft op de gedraaide kaart draaien.
    expect(byId(gewoon, 'vraag-en-mee')?.trump).toBe('turned');
  });

  it('de aangekondigde kleur wordt troef, niet de gedraaide kaart', () => {
    const gift = giftWithoutTroel(kleuren);
    const b = gift.bidding;
    const asker = b.toAct;
    // Kies bewust een kleur die verschilt van de gedraaide kaart.
    const suit = (['S', 'H', 'D', 'C'] as const).find((s) => s !== gift.deal.trumpSuit) as 'S';
    b.act(asker, { type: 'bid', contractId: 'vraag-en-mee', suit });
    b.act(b.toAct, { type: 'join' });
    while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
    gift.settleBidding();
    expect(gift.phase).toBe('play');
    expect(gift.contract?.trumpSuit).toBe(suit);
    expect(gift.contract?.trumpSuit).not.toBe(gift.deal.trumpSuit);
  });

  it('een vraag zonder kleur wordt geweigerd', () => {
    const gift = giftWithoutTroel(kleuren);
    const b = gift.bidding;
    expect(() => b.act(b.toAct, { type: 'bid', contractId: 'vraag-en-mee' })).toThrow(/troefkleur/);
  });

  it('gaat niemand mee, dan blijft de aangekondigde kleur troef bij alleen', () => {
    const gift = giftWithoutTroel(kleuren, 40);
    const b = gift.bidding;
    b.act(b.toAct, { type: 'bid', contractId: 'vraag-en-mee', suit: 'D' });
    while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
    expect(b.phase).toBe('alleen-choice');
    b.chooseAlleen(true);
    gift.settleBidding();
    expect(gift.contract?.contract.id).toBe('alleen');
    expect(gift.contract?.trumpSuit).toBe('D');
  });

  it('abondance kiest zijn kleur nog steeds pas ná het bieden', () => {
    const gift = giftWithoutTroel(kleuren, 80);
    const b = gift.bidding;
    b.act(b.toAct, { type: 'bid', contractId: 'abondance-9' });
    while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
    gift.settleBidding();
    expect(gift.phase).toBe('trump-choice');
    expect(gift.trumpChooser).not.toBeNull();
    gift.chooseTrump('C');
    expect(gift.contract?.trumpSuit).toBe('C');
  });

  it('bij gewoon wiezen blijft een vraag zonder kleur gewoon geldig', () => {
    const gift = giftWithoutTroel(gewoon);
    const b = gift.bidding;
    b.act(b.toAct, { type: 'bid', contractId: 'vraag-en-mee' });
    b.act(b.toAct, { type: 'join' });
    while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
    gift.settleBidding();
    expect(gift.contract?.trumpSuit).toBe(gift.deal.trumpSuit);
  });
});

// Troel (REGELS.md §5.4): de uitkomer hoort zijn vierde aas te leggen. Doet hij
// dat niet, dan bepaalt zijn kaart nog steeds de troef maar stijgt het doel.
describe('troel — de aas moet vallen', () => {
  /** Eerste gift met een verplichte troel, met het bieden afgerond. */
  function troelGift() {
    for (let seed = 1; seed < 400; seed++) {
      const gift = new Session(gewoon, mulberry32(seed)).nextGift();
      if (!gift.bidding.troel) continue;
      const b = gift.bidding;
      while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
      gift.settleBidding();
      if (gift.phase === 'play') return gift;
    }
    throw new Error('geen troelgift gevonden');
  }

  it('kent de kaart die de uitkomer hoort te leggen', () => {
    const gift = troelGift();
    const required = gift.requiredLeadCard;
    expect(required).not.toBeNull();
    // De partner heeft die kaart ook echt in de hand.
    const partner = gift.bidding.troel?.partner as number;
    expect(
      gift.deal.hands[partner]?.some((c) => c.suit === required?.suit && c.rank === required?.rank),
    ).toBe(true);
    expect(gift.toPlay).toBe(partner);
  });

  it('komt de aas uit: doel blijft 8 en die kleur wordt troef', () => {
    const gift = troelGift();
    const required = gift.requiredLeadCard as Card;
    gift.playCard(gift.toPlay, required);
    expect(gift.troelPenalty).toBe(0);
    expect(gift.contract?.trumpSuit).toBe(required.suit);
    expect(gift.effectiveContract.target.tricks).toBe(8);
  });

  it('komt hij iets anders uit: doel wordt 9, en die kleur is troef', () => {
    const gift = troelGift();
    const required = gift.requiredLeadCard as Card;
    const other = gift
      .legalCards(gift.toPlay)
      .find((c) => c.suit !== required.suit || c.rank !== required.rank) as Card;
    gift.playCard(gift.toPlay, other);
    expect(gift.troelPenalty).toBe(1);
    expect(gift.contract?.trumpSuit).toBe(other.suit);
    expect(gift.effectiveContract.target.tricks).toBe(9);
  });
});
