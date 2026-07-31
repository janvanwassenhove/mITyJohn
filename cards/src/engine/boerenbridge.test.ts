import { describe, expect, it } from 'vitest';
import { mulberry32, type Card } from './cards';
import {
  BoerenGift,
  BoerenSession,
  DEFAULT_BOEREN_CONFIG,
  roundPoints,
  roundSizes,
  type BoerenConfig,
} from './boerenbridge';

const key = (c: Card) => `${c.suit}${c.rank}`;

describe('boerenbridge — rondestructuur (§3)', () => {
  it('klassiek volgt het WK-reglement: 1..8, drie keer acht, 8..1', () => {
    expect(roundSizes('klassiek')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('kent ook een kortere op-en-neer en een aflopende vorm', () => {
    expect(roundSizes('op-en-neer')).toHaveLength(16);
    expect(roundSizes('aflopend')).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('deelt per ronde het juiste aantal kaarten en draait een troefkaart om', () => {
    const session = new BoerenSession(mulberry32(3), 0, {
      ...DEFAULT_BOEREN_CONFIG,
      shape: 'aflopend',
    });
    const gift = session.nextGift();
    expect(gift.cardsPerHand).toBe(8);
    expect(gift.hands.every((h) => h.length === 8)).toBe(true);
    expect(gift.turnedCard).not.toBeNull();
    expect(gift.trumpSuit).toBe(gift.turnedCard?.suit);
    // 32 gedeelde kaarten + de omgedraaide kaart, allemaal verschillend
    const alle = [...gift.hands.flat(), gift.turnedCard as Card];
    expect(new Set(alle.map(key)).size).toBe(33);
  });
});

describe('boerenbridge — voorspellen (§5)', () => {
  function firstGift(config: Partial<BoerenConfig> = {}) {
    const session = new BoerenSession(mulberry32(9), 0, {
      ...DEFAULT_BOEREN_CONFIG,
      shape: 'aflopend',
      ...config,
    });
    return session.nextGift();
  }

  it('laat elk getal van 0 tot en met de handgrootte toe', () => {
    const gift = firstGift();
    expect(gift.legalBids(gift.toAct)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('biedt vanaf links van de deler, met de deler als laatste', () => {
    const gift = firstGift();
    const volgorde: number[] = [];
    while (gift.phase === 'bidding') {
      volgorde.push(gift.toAct);
      gift.bid(gift.toAct, 0);
    }
    expect(volgorde).toEqual([1, 2, 3, 0]);
    expect(gift.phase).toBe('play');
  });

  it('zet de deler klem wanneer die regel aanstaat', () => {
    const gift = firstGift({ screwTheDealer: true });
    gift.bid(1, 2);
    gift.bid(2, 2);
    gift.bid(3, 1);
    // Samen 5 van de 8: de deler mag geen 3 zeggen, want dan klopt het totaal.
    expect(gift.legalBids(0)).not.toContain(3);
    expect(gift.legalBids(0)).toContain(4);
    expect(() => gift.bid(0, 3)).toThrow();
  });

  it('laat de deler wél alles zeggen wanneer de regel uitstaat', () => {
    const gift = firstGift({ screwTheDealer: false });
    gift.bid(1, 2);
    gift.bid(2, 2);
    gift.bid(3, 1);
    expect(gift.legalBids(0)).toContain(3);
  });
});

describe('boerenbridge — punten (§7)', () => {
  const config = DEFAULT_BOEREN_CONFIG;

  it('juist: 10 punten plus 3 per gehaalde slag', () => {
    expect(roundPoints(3, 3, config)).toBe(19);
    expect(roundPoints(0, 0, config)).toBe(10);
    expect(roundPoints(8, 8, config)).toBe(34);
  });

  it('fout: 3 strafpunten per slag verschil, in beide richtingen', () => {
    expect(roundPoints(3, 1, config)).toBe(-6);
    expect(roundPoints(1, 3, config)).toBe(-6);
    expect(roundPoints(0, 1, config)).toBe(-3);
  });
});

describe('boerenbridge — ronde spelen', () => {
  function playRound(seed: number, shape: BoerenConfig['shape'] = 'aflopend') {
    const session = new BoerenSession(mulberry32(seed), 0, { ...DEFAULT_BOEREN_CONFIG, shape });
    const gift = session.nextGift();
    while (gift.phase === 'bidding') gift.bid(gift.toAct, gift.legalBids(gift.toAct)[0] as number);
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
    return { session, gift };
  }

  it('speelt evenveel slagen als er kaarten waren, en verdeelt ze allemaal', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { gift } = playRound(seed);
      expect(gift.tricksPlayed).toBe(gift.cardsPerHand);
      expect(gift.score?.made.reduce((a, b) => a + b, 0)).toBe(gift.cardsPerHand);
    }
  });

  it('rekent de ronde af volgens §7 en telt op bij de totalen', () => {
    const { session, gift } = playRound(4);
    const s = gift.score as NonNullable<typeof gift.score>;
    for (let p = 0; p < 4; p++) {
      expect(s.points[p]).toBe(
        roundPoints(s.bids[p] as number, s.made[p] as number, DEFAULT_BOEREN_CONFIG),
      );
    }
    session.closeGift();
    expect(session.totals).toEqual(s.points);
  });

  it('speelt de hele partij uit en schuift de deler elke ronde door', () => {
    const session = new BoerenSession(mulberry32(6), 0, {
      ...DEFAULT_BOEREN_CONFIG,
      shape: 'aflopend',
    });
    const delers: number[] = [];
    const groottes: number[] = [];
    while (!session.finished) {
      const gift = session.nextGift();
      delers.push(gift.dealer);
      groottes.push(gift.cardsPerHand);
      while (gift.phase === 'bidding') {
        gift.bid(gift.toAct, gift.legalBids(gift.toAct)[0] as number);
      }
      while (gift.phase === 'play') {
        const p = gift.toPlay;
        gift.playCard(p, gift.legalCards(p)[0] as Card);
      }
      session.closeGift();
    }
    expect(groottes).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(delers).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
    expect(session.roundNumber).toBe(session.totalRounds);
    // Hoogste totaal wint — anders dan bij hartenjagen.
    expect(session.totals[session.winner]).toBe(Math.max(...session.totals));
  });

  it('speelt zonder troef wanneer de stok leeg is', () => {
    // Dertien kaarten per speler: er blijft niets over om om te draaien (§4.3).
    const gift = new BoerenGift(0, 1, 13, mulberry32(2), DEFAULT_BOEREN_CONFIG);
    expect(gift.turnedCard).toBeNull();
    expect(gift.trumpSuit).toBeNull();
    while (gift.phase === 'bidding') gift.bid(gift.toAct, 0);
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
    expect(gift.tricksPlayed).toBe(13);
  });
});
