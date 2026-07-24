import { describe, expect, it } from 'vitest';
import { mulberry32, type Card, type Suit } from './cards';
import {
  cardPoints,
  makeManilleDeck,
  manilleDeal,
  ManilleGift,
  manilleLegalPlays,
  ManilleSession,
  manilleTrickWinner,
  strength,
  teamOf,
} from './manille';

import manillenRuleset from '../../../rulesets/manillen.json';

const card = (suit: Suit, rank: number): Card => ({ suit, rank: rank as Card['rank'] });

describe('manillen: ruleset-JSON en engine blijven consistent', () => {
  it('rangorde, kaartpunten en doelen komen overeen', () => {
    const label = (r: number): string =>
      (({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }) as Record<number, string>)[r] ?? String(r);
    const deck = manillenRuleset.deck;
    expect(deck.rankOrder).toEqual([10, 14, 13, 12, 11, 9, 8, 7].map(label));
    for (const [name, pts] of Object.entries(deck.cardPoints)) {
      const rank =
        name === 'A'
          ? 14
          : name === 'K'
            ? 13
            : name === 'Q'
              ? 12
              : name === 'J'
                ? 11
                : Number(name);
      expect(cardPoints(card('S', rank))).toBe(pts);
    }
    expect(manillenRuleset.session.targetPoints).toBe(101);
    expect(manillenRuleset.deck.cards).toBe(32);
  });
});

describe('manillen: rangorde en punten', () => {
  it('10 (manille) klopt de aas, aas klopt de heer', () => {
    expect(strength(10)).toBeGreaterThan(strength(14));
    expect(strength(14)).toBeGreaterThan(strength(13));
    expect(strength(7)).toBe(1);
  });

  it('deck telt 32 kaarten en exact 60 kaartpunten', () => {
    const deck = makeManilleDeck();
    expect(deck).toHaveLength(32);
    expect(deck.reduce((sum, c) => sum + cardPoints(c), 0)).toBe(60);
  });

  it('deelt 8 kaarten per speler in 3-3-2', () => {
    const hands = manilleDeal(1, mulberry32(3));
    expect(hands.every((h) => h.length === 8)).toBe(true);
    expect(new Set(hands.flat().map((c) => `${c.suit}${c.rank}`)).size).toBe(32);
  });
});

describe('manillen: slagen', () => {
  it('10 wint de slag van de aas in dezelfde kleur', () => {
    const trick = [
      { player: 0, card: card('S', 14) },
      { player: 1, card: card('S', 10) },
      { player: 2, card: card('S', 7) },
      { player: 3, card: card('H', 10) },
    ];
    expect(manilleTrickWinner(trick, 'D')).toBe(1);
  });

  it('verplicht overtroeven, anders ondertroeven', () => {
    const trick = [
      { player: 0, card: card('S', 13) },
      { player: 1, card: card('D', 14) },
    ];
    // heeft ruiten 10 (sterker dan aas) en ruiten 7 → moet overtroeven met 10
    expect(manilleLegalPlays([card('D', 10), card('D', 7), card('H', 9)], trick, 'D')).toEqual([
      card('D', 10),
    ]);
    // enkel ruiten 7 → ondertroeven verplicht
    expect(manilleLegalPlays([card('D', 7), card('H', 9)], trick, 'D')).toEqual([card('D', 7)]);
    // geen troef → vrij
    expect(manilleLegalPlays([card('H', 9), card('C', 8)], trick, 'D')).toHaveLength(2);
  });
});

describe('manillen: gift en sessie', () => {
  function playOut(gift: ManilleGift): void {
    if (gift.phase === 'trump-choice') gift.chooseTrump('S');
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
  }

  it('speelt 8 slagen en verdeelt 60 punten over de teams', () => {
    const gift = new ManilleGift(0, mulberry32(11));
    expect(gift.phase).toBe('trump-choice');
    playOut(gift);
    expect(gift.phase).toBe('scored');
    const score = gift.score;
    expect((score?.teamPoints[0] ?? 0) + (score?.teamPoints[1] ?? 0)).toBe(60);
    if (score?.winner !== null) {
      expect(score?.score).toBe(Math.max(...(score?.teamPoints ?? [])) - 30);
    }
  });

  it('sessie loopt tot het puntendoel en wijst een winnend team aan', () => {
    const session = new ManilleSession(mulberry32(21), 0, 40);
    let safety = 200;
    while (!session.finished && safety-- > 0) {
      playOut(session.nextGift());
      session.closeGift();
    }
    expect(session.finished).toBe(true);
    expect(Math.max(...session.totals)).toBeGreaterThanOrEqual(40);
    expect(teamOf(0)).toBe(teamOf(2));
    expect(teamOf(1)).toBe(teamOf(3));
  });
});
