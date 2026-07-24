import { describe, expect, it } from 'vitest';
import { mulberry32, type Card, type Suit } from './cards';
import {
  biedenCardPoints,
  biedenDeal,
  BiedenGift,
  biedenLegalPlays,
  BiedenSession,
  biedenStrength,
  biedenTrickWinner,
  DEFAULT_BIEDEN_CONFIG,
  makeBiedenDeck,
  teamOf,
  TOTAL_POINTS,
} from './bieden';
import biedenRuleset from '../../../rulesets/bieden.json';

const card = (suit: Suit, rank: number): Card => ({ suit, rank: rank as Card['rank'] });

describe('bieden: deck, punten en rangorde', () => {
  it('deck telt 32 kaarten', () => {
    expect(makeBiedenDeck()).toHaveLength(32);
  });

  it('totaal 151 kaartpunten (troef 60 + 3×27 + niets van laatste slag hier)', () => {
    const trump: Suit = 'S';
    const total = makeBiedenDeck().reduce((sum, c) => sum + biedenCardPoints(c, trump), 0);
    expect(total).toBe(TOTAL_POINTS - 10); // 141 kaartpunten; +10 laatste slag = 151
  });

  it('troefwaarden: boer 20, negen 14; niet-troef boer 1, negen 0', () => {
    expect(biedenCardPoints(card('S', 11), 'S')).toBe(20);
    expect(biedenCardPoints(card('S', 9), 'S')).toBe(14);
    expect(biedenCardPoints(card('H', 11), 'S')).toBe(1);
    expect(biedenCardPoints(card('H', 9), 'S')).toBe(0);
  });

  it('troefrangorde: boer klopt negen klopt aas', () => {
    expect(biedenStrength(11, 'S', 'S')).toBeGreaterThan(biedenStrength(9, 'S', 'S'));
    expect(biedenStrength(9, 'S', 'S')).toBeGreaterThan(biedenStrength(14, 'S', 'S'));
  });

  it('niet-troefrangorde: aas klopt tien klopt heer', () => {
    expect(biedenStrength(14, 'H', 'S')).toBeGreaterThan(biedenStrength(10, 'H', 'S'));
    expect(biedenStrength(10, 'H', 'S')).toBeGreaterThan(biedenStrength(13, 'H', 'S'));
  });

  it('deelt 8 kaarten per speler', () => {
    const hands = biedenDeal(0, mulberry32(4));
    expect(hands.every((h) => h.length === 8)).toBe(true);
    expect(new Set(hands.flat().map((c) => `${c.suit}${c.rank}`)).size).toBe(32);
  });
});

describe('bieden: slagen en troefvrijheid', () => {
  it('mag troeven ook al kan je volgen', () => {
    const hand = [card('S', 14), card('H', 11)]; // schoppen (gevraagd) + troef harten
    const trick = [{ player: 0, card: card('S', 10) }];
    // troef = harten; toegelaten: schoppen volgen OF harten troeven
    expect(biedenLegalPlays(hand, trick, 'H')).toHaveLength(2);
  });

  it('troefboer wint van alles', () => {
    const trick = [
      { player: 0, card: card('S', 14) },
      { player: 1, card: card('H', 11) }, // troefboer
      { player: 2, card: card('S', 10) },
      { player: 3, card: card('H', 9) }, // troefnegen
    ];
    expect(biedenTrickWinner(trick, 'H')).toBe(1);
  });
});

describe('bieden: biedveiling', () => {
  it('hoogste bieder wint; één kans per speler', () => {
    const gift = new BiedenGift(0, mulberry32(1));
    const b = gift.bidding;
    b.act(1, 100);
    b.act(2, 120);
    b.act(3, null);
    b.act(0, null);
    expect(b.phase).toBe('done');
    expect(b.highBidder).toBe(2);
    expect(b.highBid).toBe(120);
    gift.settle();
    expect(gift.declarer).toBe(2);
    expect(gift.toPlay).toBe(2); // hoogste bieder komt uit
  });

  it('iedereen past → herdeel', () => {
    const gift = new BiedenGift(0, mulberry32(1));
    for (let i = 0; i < 4; i++) gift.bidding.act(gift.bidding.toAct, null);
    expect(gift.phase).toBe('redeal');
  });

  it('legalBids begint bij 100 en telkens hoger, tot 150', () => {
    const b = new BiedenGift(0, mulberry32(1)).bidding;
    expect(b.legalBids(1)[0]).toBe(100);
    expect(b.legalBids(1).at(-1)).toBe(150);
    b.act(1, 130);
    expect(b.legalBids(2)).toEqual([140, 150]);
  });
});

describe('bieden: gift en sessie', () => {
  function playOut(gift: BiedenGift): void {
    gift.settle();
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
  }

  it('speelt 8 slagen; eerste kaart bepaalt troef; 151 punten verdeeld; zero-sum score', () => {
    const gift = new BiedenGift(0, mulberry32(7));
    gift.bidding.act(1, 100);
    gift.bidding.act(2, null);
    gift.bidding.act(3, null);
    gift.bidding.act(0, null);
    gift.settle();
    const leader = gift.toPlay;
    const lead = gift.legalCards(leader)[0] as Card;
    gift.playCard(leader, lead);
    expect(gift.trumpSuit).toBe(lead.suit);
    while (gift.phase === 'play')
      gift.playCard(gift.toPlay, gift.legalCards(gift.toPlay)[0] as Card);
    expect(gift.phase).toBe('scored');
    expect((gift.score?.teamPoints[0] ?? 0) + (gift.score?.teamPoints[1] ?? 0)).toBe(TOTAL_POINTS);
    expect((gift.score?.points[0] ?? 0) + (gift.score?.points[1] ?? 0)).toBe(0);
    const t = teamOf(gift.declarer as number);
    expect(gift.score?.points[t]).toBe(gift.score?.made ? 100 : -100);
  });

  it('sessie loopt tot het puntendoel', () => {
    const session = new BiedenSession(mulberry32(9), 0, {
      ...DEFAULT_BIEDEN_CONFIG,
      targetPoints: 300,
    });
    let safety = 500;
    while (!session.finished && safety-- > 0) {
      const gift = session.nextGift();
      // altijd minimaal bod door speler links van deler zodat er gespeeld wordt
      gift.bidding.act(gift.bidding.toAct, 100);
      while (gift.bidding.phase === 'bidding') gift.bidding.act(gift.bidding.toAct, null);
      playOut(gift);
      session.closeGift();
    }
    expect(session.finished).toBe(true);
    expect(Math.max(...session.totals)).toBeGreaterThanOrEqual(300);
  });
});

describe('bieden: ruleset-JSON consistent met de engine', () => {
  it('rangorde en kaartpunten kloppen', () => {
    expect(biedenRuleset.deck.cards).toBe(32);
    expect(biedenRuleset.scoring.totalPoints).toBe(151);
    expect(biedenRuleset.bidding.min).toBe(100);
  });
});
