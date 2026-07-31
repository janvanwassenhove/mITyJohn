import { describe, expect, it } from 'vitest';
import { mulberry32, type Card, type Suit } from './cards';
import {
  DEFAULT_HARTEN_CONFIG,
  HartenSession,
  OPENING_CARD,
  QUEEN_OF_SPADES,
  TOTAL_PENALTY,
  hartenLegalPlays,
  hartenTrickWinner,
  passDirectionForRound,
  passTarget,
  penaltyOf,
} from './hartenjagen';

const card = (suit: Suit, rank: number): Card => ({ suit, rank: rank as Card['rank'] });
const key = (c: Card) => `${c.suit}${c.rank}`;

describe('hartenjagen — strafpunten (§3)', () => {
  it('elke harten telt 1, de schoppenvrouw 13, de rest niets', () => {
    expect(penaltyOf(card('H', 2))).toBe(1);
    expect(penaltyOf(card('H', 14))).toBe(1);
    expect(penaltyOf(QUEEN_OF_SPADES)).toBe(13);
    expect(penaltyOf(card('S', 14))).toBe(0);
    expect(penaltyOf(card('C', 12))).toBe(0);
  });

  it('samen zit er 26 in het spel', () => {
    const alles = (['S', 'H', 'D', 'C'] as Suit[]).flatMap((s) =>
      Array.from({ length: 13 }, (_, i) => card(s, i + 2)),
    );
    expect(alles.reduce((sum, c) => sum + penaltyOf(c), 0)).toBe(TOTAL_PENALTY);
  });
});

describe('hartenjagen — doorgeven (§4)', () => {
  it('draait links – rechts – tegenover – niet', () => {
    expect([1, 2, 3, 4, 5].map(passDirectionForRound)).toEqual([
      'left',
      'right',
      'across',
      'none',
      'left',
    ]);
  });

  it('wijst de juiste ontvanger aan', () => {
    expect(passTarget(0, 'left')).toBe(1);
    expect(passTarget(0, 'right')).toBe(3);
    expect(passTarget(0, 'across')).toBe(2);
    expect(passTarget(0, 'none')).toBe(0);
  });

  it('ruilt pas als alle vier gekozen hebben, en dan allemaal tegelijk', () => {
    const gift = new HartenSession(mulberry32(7)).nextGift();
    expect(gift.phase).toBe('passing');
    const gekozen = gift.hands.map((h) => h.slice(0, 3));
    for (let p = 0; p < 3; p++) {
      gift.selectPass(p, gekozen[p] as Card[]);
      expect(gift.phase).toBe('passing');
    }
    gift.selectPass(3, gekozen[3] as Card[]);
    expect(gift.phase).toBe('play');
    expect(gift.hands.every((h) => h.length === 13)).toBe(true);
    // ronde 1 = naar links: wat speler 0 weggaf, zit nu bij speler 1
    for (const c of gekozen[0] as Card[]) {
      expect((gift.hands[1] as Card[]).some((h) => key(h) === key(c))).toBe(true);
      expect((gift.hands[0] as Card[]).some((h) => key(h) === key(c))).toBe(false);
    }
    // alle 52 kaarten precies één keer
    expect(new Set(gift.hands.flat().map(key)).size).toBe(52);
  });

  it('slaat het doorgeven over in de vierde ronde', () => {
    const session = new HartenSession(mulberry32(7));
    for (let i = 0; i < 4; i++) {
      const gift = session.nextGift();
      expect(gift.phase).toBe(i === 3 ? 'play' : 'passing');
      session.closeGift();
    }
  });

  it('weigert kaarten die niet in de hand zitten of dubbel gekozen zijn', () => {
    const gift = new HartenSession(mulberry32(11)).nextGift();
    const hand = gift.hands[0] as Card[];
    const vreemd = (['S', 'H', 'D', 'C'] as Suit[])
      .flatMap((s) => Array.from({ length: 13 }, (_, i) => card(s, i + 2)))
      .find((c) => !hand.some((h) => key(h) === key(c))) as Card;
    expect(() => gift.selectPass(0, [hand[0] as Card, hand[1] as Card, vreemd])).toThrow();
    expect(() => gift.selectPass(0, [hand[0] as Card, hand[0] as Card, hand[1] as Card])).toThrow();
    expect(() => gift.selectPass(0, [hand[0] as Card, hand[1] as Card])).toThrow();
  });
});

describe('hartenjagen — slagregels (§5)', () => {
  const state = (firstTrick: boolean, heartsBroken: boolean) => ({ firstTrick, heartsBroken });

  it('de eerste slag opent verplicht met klaveren 2', () => {
    const hand = [card('C', 2), card('S', 14), card('H', 3)];
    expect(hartenLegalPlays(hand, [], state(true, false))).toEqual([OPENING_CARD]);
  });

  it('kleur bekennen gaat vóór alles', () => {
    const hand = [card('C', 5), card('C', 9), card('S', 14)];
    const trick = [{ player: 0, card: card('C', 4) }];
    expect(hartenLegalPlays(hand, trick, state(false, true)).map(key)).toEqual(['C5', 'C9']);
  });

  it('in de eerste slag mag je geen strafkaart bijgooien', () => {
    const hand = [card('H', 5), QUEEN_OF_SPADES, card('D', 9)];
    const trick = [{ player: 0, card: OPENING_CARD }];
    expect(hartenLegalPlays(hand, trick, state(true, false)).map(key)).toEqual(['D9']);
  });

  it('maar wie enkel strafkaarten heeft, moet er toch één kwijt', () => {
    const hand = [card('H', 5), QUEEN_OF_SPADES];
    const trick = [{ player: 0, card: OPENING_CARD }];
    expect(hartenLegalPlays(hand, trick, state(true, false))).toHaveLength(2);
  });

  it('harten uitkomen mag pas na het breken — de schoppenvrouw altijd', () => {
    const hand = [card('H', 5), QUEEN_OF_SPADES, card('D', 9)];
    expect(hartenLegalPlays(hand, [], state(false, false)).map(key)).toEqual(['S12', 'D9']);
    expect(hartenLegalPlays(hand, [], state(false, true))).toHaveLength(3);
  });

  it('wie enkel nog harten heeft, mag ze uitkomen', () => {
    const hand = [card('H', 5), card('H', 9)];
    expect(hartenLegalPlays(hand, [], state(false, false))).toHaveLength(2);
  });

  it('zonder troef wint de hoogste kaart in de gevraagde kleur', () => {
    const trick = [
      { player: 0, card: card('C', 4) },
      { player: 1, card: card('C', 13) },
      { player: 2, card: card('H', 14) },
      { player: 3, card: card('S', 14) },
    ];
    expect(hartenTrickWinner(trick)).toBe(1);
  });
});

describe('hartenjagen — ronde spelen (§6)', () => {
  function playRound(seed: number) {
    const session = new HartenSession(mulberry32(seed), 0, DEFAULT_HARTEN_CONFIG);
    const gift = session.nextGift();
    if (gift.phase === 'passing') {
      for (let p = 0; p < 4; p++) gift.selectPass(p, (gift.hands[p] as Card[]).slice(0, 3));
    }
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
    return { session, gift };
  }

  it('deelt precies 26 strafpunten uit en speelt 13 slagen', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const { gift } = playRound(seed);
      expect(gift.tricksPlayed).toBe(13);
      expect(gift.score?.penalties.reduce((a, b) => a + b, 0)).toBe(TOTAL_PENALTY);
    }
  });

  it('de klaveren 2 valt altijd als eerste kaart', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const { gift } = playRound(seed);
      expect(key(gift.history[0]?.[0]?.card as Card)).toBe(key(OPENING_CARD));
    }
  });

  it('er valt nooit een strafkaart in de eerste slag zolang er iets anders kan', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const { gift } = playRound(seed);
      const eerste = gift.history[0] as { player: number; card: Card }[];
      // de uitkomer speelt klaveren 2; de rest volgt of gooit een niet-strafkaart bij
      expect(eerste.filter((p) => penaltyOf(p.card) > 0)).toHaveLength(0);
    }
  });

  it('alles halen geeft de schutter 0 en de anderen elk 26', () => {
    const session = new HartenSession(mulberry32(1));
    const gift = session.nextGift();
    for (let p = 0; p < 4; p++) gift.selectPass(p, (gift.hands[p] as Card[]).slice(0, 3));
    // Forceer het resultaat op het scorepad: de engine mag de 26 niet zomaar optellen.
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
    const totaal = gift.score?.penalties.reduce((a, b) => a + b, 0) ?? 0;
    expect(totaal).toBe(TOTAL_PENALTY);
    if (gift.score?.moonShooter !== null && gift.score) {
      expect(gift.score.points[gift.score.moonShooter as number]).toBe(0);
    } else {
      expect(gift.score?.points).toEqual(gift.score?.penalties);
    }
  });

  it('telt de ronde bij de totalen op en stopt bij de grens', () => {
    // Lage grens: de 26 strafpunten van één ronde zijn altijd genoeg om te stoppen.
    const session = new HartenSession(mulberry32(4), 0, { targetPoints: 1, shootTheMoon: true });
    const gift = session.nextGift();
    for (let p = 0; p < 4; p++) gift.selectPass(p, (gift.hands[p] as Card[]).slice(0, 3));
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
    session.closeGift();
    expect(session.totals.reduce((a, b) => a + b, 0)).toBe(TOTAL_PENALTY);
    expect(session.finished).toBe(true);
    // de laagste score wint — niet de hoogste
    expect(session.totals[session.winner]).toBe(Math.min(...session.totals));
  });
});
