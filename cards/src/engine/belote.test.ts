import { describe, expect, it } from 'vitest';
import { mulberry32, type Card, type Suit } from './cards';
import {
  BeloteSession,
  DEFAULT_BELOTE_CONFIG,
  TOTAL_POINTS,
  annoncesInHand,
  compareAnnonces,
  hasBeloteRebelote,
} from './belote';

const card = (suit: Suit, rank: number): Card => ({ suit, rank: rank as Card['rank'] });

describe('belote — annonces (§7)', () => {
  const kinds = (hand: Card[]) => annoncesInHand(hand).map((a) => a.kind);

  it('drie op volgorde is een tierce (20)', () => {
    const hand = [card('H', 7), card('H', 8), card('H', 9), card('S', 14)];
    expect(annoncesInHand(hand)).toEqual([{ kind: 'tierce', points: 20, high: 9 }]);
  });

  it('vier op volgorde is cinquante, vijf is cent', () => {
    expect(kinds([card('H', 7), card('H', 8), card('H', 9), card('H', 10)])).toEqual(['cinquante']);
    expect(kinds([card('H', 7), card('H', 8), card('H', 9), card('H', 10), card('H', 11)])).toEqual(
      ['cent'],
    );
  });

  it('carrés: boeren 200, negens 150, de rest 100 — acht en zeven tellen niet', () => {
    const carre = (rank: number) => [
      card('S', rank),
      card('H', rank),
      card('D', rank),
      card('C', rank),
    ];
    expect(annoncesInHand(carre(11))[0]?.points).toBe(200);
    expect(annoncesInHand(carre(9))[0]?.points).toBe(150);
    expect(annoncesInHand(carre(14))[0]?.points).toBe(100);
    expect(annoncesInHand(carre(8))).toEqual([]);
    expect(annoncesInHand(carre(7))).toEqual([]);
  });

  it('reeksen volgen de gewone volgorde, ook in troef', () => {
    // In troef is de volgorde V-9-A-10; voor annonces telt 9-10-V gewoon door.
    expect(kinds([card('S', 9), card('S', 10), card('S', 11)])).toEqual(['tierce']);
  });

  it('rangschikt annonces: carré boeren boven cent boven cinquante boven tierce', () => {
    const t = { kind: 'tierce' as const, points: 20, high: 9 as Card['rank'] };
    const c50 = { kind: 'cinquante' as const, points: 50, high: 10 as Card['rank'] };
    const c100 = { kind: 'cent' as const, points: 100, high: 11 as Card['rank'] };
    const cj = { kind: 'carreJacks' as const, points: 200, high: 11 as Card['rank'] };
    expect(compareAnnonces(c50, t)).toBeGreaterThan(0);
    expect(compareAnnonces(c100, c50)).toBeGreaterThan(0);
    expect(compareAnnonces(cj, c100)).toBeGreaterThan(0);
    // gelijke soort: hoogste kaart beslist
    expect(compareAnnonces({ ...t, high: 13 }, t)).toBeGreaterThan(0);
  });

  it('herkent belote-rebelote (heer + vrouw van troef)', () => {
    expect(hasBeloteRebelote([card('S', 13), card('S', 12)], 'S')).toBe(true);
    expect(hasBeloteRebelote([card('S', 13), card('H', 12)], 'S')).toBe(false);
    expect(hasBeloteRebelote([card('H', 13), card('H', 12)], 'S')).toBe(false);
  });
});

describe('belote — bieden (§4)', () => {
  it('ronde 1 biedt enkel de omgedraaide kleur aan, ronde 2 de andere drie', () => {
    const gift = new BeloteSession(mulberry32(3)).nextGift();
    expect(gift.legalTakes()).toEqual([gift.turnedCard.suit]);
    expect(gift.hands.every((h) => h.length === 5)).toBe(true);
    for (let i = 0; i < 4; i++) gift.pass();
    expect(gift.biddingRound).toBe(2);
    expect(gift.legalTakes()).toHaveLength(3);
    expect(gift.legalTakes()).not.toContain(gift.turnedCard.suit);
  });

  it('neemt niemand in beide ronden, dan wordt er opnieuw gedeeld', () => {
    const gift = new BeloteSession(mulberry32(3)).nextGift();
    for (let i = 0; i < 8; i++) gift.pass();
    expect(gift.phase).toBe('redeal');
  });

  it('na het nemen heeft iedereen 8 kaarten en zit de open kaart bij de nemer', () => {
    const gift = new BeloteSession(mulberry32(5)).nextGift();
    const turned = gift.turnedCard;
    const taker = gift.toAct;
    gift.take(turned.suit);
    expect(gift.taker).toBe(taker);
    expect(gift.trumpSuit).toBe(turned.suit);
    expect(gift.hands.every((h) => h.length === 8)).toBe(true);
    expect(gift.hands[taker]?.some((c) => c.suit === turned.suit && c.rank === turned.rank)).toBe(
      true,
    );
    // alle 32 kaarten precies één keer verdeeld
    expect(new Set(gift.hands.flat().map((c) => `${c.suit}${c.rank}`)).size).toBe(32);
  });
});

describe('belote — score (§8)', () => {
  function playRound(seed: number) {
    const session = new BeloteSession(mulberry32(seed), 0, DEFAULT_BELOTE_CONFIG);
    const gift = session.nextGift();
    while (gift.phase === 'bidding') {
      const takes = gift.legalTakes();
      if (takes.length > 0) gift.take(takes[0] as Suit);
      else gift.pass();
    }
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
    return gift;
  }

  it('verdeelt 162 kaartpunten over de twee ploegen', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = playRound(seed).score;
      expect((s?.cardPoints[0] ?? 0) + (s?.cardPoints[1] ?? 0)).toBe(TOTAL_POINTS);
    }
  });

  it('enkel één ploeg scoort annonces', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = playRound(seed).score;
      if (!s) continue;
      const beide = (s.annonces[0] ?? 0) > 0 && (s.annonces[1] ?? 0) > 0;
      expect(beide).toBe(false);
    }
  });

  it('dedans: alles gaat naar de tegenpartij', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = playRound(seed).score;
      if (!s || s.made) continue;
      const totaal = (s.raw[0] ?? 0) + (s.raw[1] ?? 0);
      expect((s.points[0] ?? 0) + (s.points[1] ?? 0)).toBe(totaal);
      // de nemende ploeg houdt hooguit haar belote-rebelote
      expect(s.points[s.takingTeam]).toBe(s.belote[s.takingTeam]);
      return;
    }
    throw new Error('geen dedans gevonden');
  });
});
