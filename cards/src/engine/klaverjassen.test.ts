import { describe, expect, it } from 'vitest';
import { mulberry32, type Card, type Suit } from './cards';
import {
  DEFAULT_KLAVERJAS_CONFIG,
  KlaverjasSession,
  TOTAL_POINTS,
  klaverjasCardPoints,
  klaverjasDeal,
  klaverjasLegalPlays,
  klaverjasTrickWinner,
  makeKlaverjasDeck,
  roemInTrick,
  roemPoints,
  teamOf,
} from './klaverjassen';
import type { TrickPlay } from './play';

const card = (suit: Suit, rank: number): Card => ({ suit, rank: rank as Card['rank'] });
const play = (player: number, suit: Suit, rank: number): TrickPlay => ({
  player,
  card: card(suit, rank),
});

describe('klaverjas — kaarten en punten (§3)', () => {
  it('deelt 32 kaarten, 8 per speler', () => {
    expect(makeKlaverjasDeck()).toHaveLength(32);
    const hands = klaverjasDeal(0, mulberry32(4));
    expect(hands.every((h) => h.length === 8)).toBe(true);
    expect(new Set(hands.flat().map((c) => `${c.suit}${c.rank}`)).size).toBe(32);
  });

  it('telt heer 4 en vrouw 3 — niet 3 en 2 zoals bij bieden', () => {
    expect(klaverjasCardPoints(card('H', 13), 'S')).toBe(4);
    expect(klaverjasCardPoints(card('H', 12), 'S')).toBe(3);
    expect(klaverjasCardPoints(card('S', 13), 'S')).toBe(4);
    expect(klaverjasCardPoints(card('S', 11), 'S')).toBe(20); // troefboer
    expect(klaverjasCardPoints(card('S', 9), 'S')).toBe(14); // troefnegen
    expect(klaverjasCardPoints(card('H', 11), 'S')).toBe(2); // gewone boer — bij bieden is dat 1
  });

  it('het hele spel is 152 kaartpunten, met de laatste slag 162', () => {
    const trump: Suit = 'S';
    const som = makeKlaverjasDeck().reduce((s, c) => s + klaverjasCardPoints(c, trump), 0);
    expect(som).toBe(152);
    expect(som + 10).toBe(TOTAL_POINTS);
  });

  it('troefboer slaat de aas van troef', () => {
    const trick = [play(0, 'S', 14), play(1, 'S', 11), play(2, 'H', 14), play(3, 'S', 10)];
    expect(klaverjasTrickWinner(trick, 'S')).toBe(1);
  });
});

describe('klaverjas — roem (§6)', () => {
  const roem = (trick: TrickPlay[], trump: Suit | null = 'S') =>
    roemPoints(roemInTrick(trick, trump));

  it('drie op volgorde in dezelfde kleur telt 20', () => {
    expect(roem([play(0, 'H', 8), play(1, 'H', 9), play(2, 'H', 10), play(3, 'C', 7)])).toBe(20);
  });

  it('vier op volgorde telt 50, niet 50 + 20', () => {
    expect(roem([play(0, 'H', 8), play(1, 'H', 9), play(2, 'H', 10), play(3, 'H', 11)])).toBe(50);
  });

  it('reeksen volgen de gewone volgorde, ook in troef', () => {
    // In troef is de volgorde B-9-A-10-…, maar voor roem geldt 9-10-B.
    expect(roem([play(0, 'S', 9), play(1, 'S', 10), play(2, 'S', 11), play(3, 'H', 7)])).toBe(20);
  });

  it('vier dezelfde kaarten telt 100, vier boeren 200', () => {
    expect(roem([play(0, 'S', 13), play(1, 'H', 13), play(2, 'D', 13), play(3, 'C', 13)])).toBe(
      100,
    );
    expect(roem([play(0, 'S', 11), play(1, 'H', 11), play(2, 'D', 11), play(3, 'C', 11)])).toBe(
      200,
    );
  });

  it('stuk telt enkel als dezelfde speler heer én vrouw van troef legt', () => {
    const zelfde = [
      { player: 0, card: card('S', 13) },
      { player: 0, card: card('S', 12) },
    ];
    expect(roem(zelfde)).toBe(20);
    const verschillend = [
      { player: 0, card: card('S', 13) },
      { player: 1, card: card('S', 12) },
    ];
    expect(roem(verschillend)).toBe(0);
  });

  it('geen stuk met heer en vrouw van een andere kleur', () => {
    const trick = [
      { player: 0, card: card('H', 13) },
      { player: 0, card: card('H', 12) },
    ];
    expect(roem(trick, 'S')).toBe(0);
  });
});

describe('klaverjas — troefplicht en telwijze (§5)', () => {
  const trump: Suit = 'S';

  it('kleur bekennen gaat voor', () => {
    const hand = [card('H', 7), card('S', 14), card('C', 9)];
    const trick = [play(1, 'H', 13)];
    expect(klaverjasLegalPlays(hand, trick, trump, 2)).toEqual([card('H', 7)]);
  });

  it('kan je niet volgen, dan moet je troeven', () => {
    const hand = [card('S', 7), card('C', 9), card('D', 14)];
    const trick = [play(1, 'H', 13)];
    expect(klaverjasLegalPlays(hand, trick, trump, 2)).toEqual([card('S', 7)]);
  });

  it('ligt er troef, dan moet je oversteken', () => {
    const hand = [card('S', 7), card('S', 14), card('C', 9)];
    const trick = [play(1, 'H', 13), play(2, 'S', 10)];
    // Troefvolgorde B-9-A-10: enkel de aas gaat boven de tien.
    expect(klaverjasLegalPlays(hand, trick, trump, 3)).toEqual([card('S', 14)]);
  });

  it('Rotterdams: kan je niet oversteken, dan moet je ondertroeven', () => {
    const hand = [card('S', 7), card('C', 9)];
    const trick = [play(1, 'H', 13), play(2, 'S', 11)]; // troefboer ligt
    expect(klaverjasLegalPlays(hand, trick, trump, 3, 'rotterdams')).toEqual([card('S', 7)]);
  });

  it('Amsterdams: kan je niet oversteken, dan mag je bijgooien', () => {
    const hand = [card('S', 7), card('C', 9)];
    const trick = [play(1, 'H', 13), play(2, 'S', 11)];
    expect(klaverjasLegalPlays(hand, trick, trump, 3, 'amsterdams')).toHaveLength(2);
  });

  it('Amsterdams: ligt de slag bij je maat, dan hoef je niet te troeven', () => {
    const hand = [card('S', 7), card('C', 9)];
    // speler 3 is de maat van speler 1; die ligt met de heer op de slag
    const trick = [play(1, 'H', 14), play(2, 'H', 7)];
    expect(klaverjasLegalPlays(hand, trick, trump, 3, 'amsterdams')).toHaveLength(2);
    expect(klaverjasLegalPlays(hand, trick, trump, 3, 'rotterdams')).toEqual([card('S', 7)]);
  });

  it('in troef gevraagd: volgen én oversteken zolang je kan', () => {
    const hand = [card('S', 7), card('S', 14)];
    const trick = [play(1, 'S', 10)];
    expect(klaverjasLegalPlays(hand, trick, trump, 2)).toEqual([card('S', 14)]);
  });
});

describe('klaverjas — score (§7)', () => {
  /** Speel een hele ronde uit met een simpele bot: eerste legale kaart. */
  function playRound(seed: number, config = DEFAULT_KLAVERJAS_CONFIG) {
    const session = new KlaverjasSession(mulberry32(seed), 0, config);
    const gift = session.nextGift();
    gift.chooseTrump('S');
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
    return gift;
  }

  it('verdeelt 162 kaartpunten over de twee ploegen', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const gift = playRound(seed);
      const score = gift.score;
      expect(score).not.toBeNull();
      const som = (score?.cardPoints[0] ?? 0) + (score?.cardPoints[1] ?? 0);
      expect(som).toBe(TOTAL_POINTS);
    }
  });

  it('nat: alles gaat naar de tegenpartij', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const gift = playRound(seed);
      const s = gift.score;
      if (!s || s.made) continue;
      expect(s.points[s.declaringTeam]).toBe(0);
      expect(s.points[1 - s.declaringTeam]).toBe((s.raw[0] ?? 0) + (s.raw[1] ?? 0));
      return;
    }
    throw new Error('geen natte ronde gevonden');
  });

  it('binnen: elke ploeg houdt haar eigen punten', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const gift = playRound(seed);
      const s = gift.score;
      if (!s || !s.made || s.pit) continue;
      expect(s.points[s.declaringTeam]).toBe(s.raw[s.declaringTeam]);
      expect(s.points[1 - s.declaringTeam]).toBe(s.raw[1 - s.declaringTeam]);
      return;
    }
    throw new Error('geen gewonnen ronde gevonden');
  });

  it('de deler moet kiezen als iedereen past', () => {
    const session = new KlaverjasSession(mulberry32(9), 0);
    const gift = session.nextGift();
    gift.pass();
    gift.pass();
    gift.pass();
    expect(gift.mustChoose).toBe(true);
    expect(gift.chooser).toBe(gift.dealer);
    expect(() => gift.pass()).toThrow(/deler/);
    gift.chooseTrump('H');
    expect(gift.declarer).toBe(gift.dealer);
  });

  it('maten zitten tegenover elkaar', () => {
    expect(teamOf(0)).toBe(teamOf(2));
    expect(teamOf(1)).toBe(teamOf(3));
    expect(teamOf(0)).not.toBe(teamOf(1));
  });
});
