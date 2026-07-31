import { describe, expect, it } from 'vitest';
import { mulberry32 } from './cards';
import {
  countBouts,
  formatHalfPoints,
  halfPointsOf,
  isBout,
  makeTarotDeck,
  sortTarotHand,
  tarotHalfPoints,
  tarotKey,
  parseTarotCard,
  type TarotCard,
} from './tarot-cards';
import {
  CONTRACTS,
  DEFAULT_TAROT_CONFIG,
  contractInfo,
  TarotGift,
  TarotSession,
  dealShape,
  tarotLegalPlays,
  tarotTrickWinner,
  targetHalfPoints,
  type ContractId,
  type PlayerCount,
  type TarotPlay,
} from './tarot';

const suit = (s: 'S' | 'H' | 'D' | 'C', rank: number): TarotCard => ({
  kind: 'suit',
  suit: s,
  rank: rank as 1,
});
const atout = (value: number): TarotCard => ({ kind: 'trump', value });
const excuse: TarotCard = { kind: 'excuse' };

describe('tarot — de kaartset (§2)', () => {
  it('telt 78 kaarten: 56 in kleuren, 21 atouts en de excuse', () => {
    const deck = makeTarotDeck();
    expect(deck).toHaveLength(78);
    expect(deck.filter((c) => c.kind === 'suit')).toHaveLength(56);
    expect(deck.filter((c) => c.kind === 'trump')).toHaveLength(21);
    expect(deck.filter((c) => c.kind === 'excuse')).toHaveLength(1);
    expect(new Set(deck.map(tarotKey)).size).toBe(78);
  });

  it('heeft drie bouts: de 1, de 21 en de excuse', () => {
    expect(makeTarotDeck().filter(isBout).map(tarotKey).sort()).toEqual(['EX', 'T1', 'T21']);
  });

  it('verdeelt precies 91 punten over het hele spel', () => {
    expect(halfPointsOf(makeTarotDeck())).toBe(182);
    expect(formatHalfPoints(182)).toBe('91');
  });

  it('waardeert bout en heer 4,5 — dame 3,5, cavalier 2,5, valet 1,5, rest 0,5', () => {
    expect(tarotHalfPoints(suit('S', 14))).toBe(9);
    expect(tarotHalfPoints(atout(21))).toBe(9);
    expect(tarotHalfPoints(excuse)).toBe(9);
    expect(tarotHalfPoints(suit('S', 13))).toBe(7);
    expect(tarotHalfPoints(suit('S', 12))).toBe(5);
    expect(tarotHalfPoints(suit('S', 11))).toBe(3);
    expect(tarotHalfPoints(suit('S', 10))).toBe(1);
    expect(tarotHalfPoints(atout(7))).toBe(1);
  });

  it('toont halve punten leesbaar, ook negatief', () => {
    expect(formatHalfPoints(83)).toBe('41,5');
    expect(formatHalfPoints(82)).toBe('41');
    expect(formatHalfPoints(-51)).toBe('-25,5');
  });

  it('schrijft kaarten weg en leest ze weer in — nodig voor het actielog', () => {
    for (const card of makeTarotDeck()) {
      expect(parseTarotCard(tarotKey(card))).toEqual(card);
    }
  });

  it('sorteert atouts vooraan en de excuse achteraan', () => {
    const hand = [suit('H', 5), atout(3), excuse, atout(21), suit('S', 14)];
    expect(sortTarotHand(hand).map(tarotKey)).toEqual(['T21', 'T3', 'S14', 'H5', 'EX']);
  });
});

describe('tarot — delen (§3)', () => {
  it.each([
    [3, 24, 6],
    [4, 18, 6],
    [5, 15, 3],
  ])('%i spelers: %i kaarten elk en een chien van %i', (players, hand, chien) => {
    expect(dealShape(players as PlayerCount)).toEqual({ hand, chien });
    const gift = new TarotGift(0, mulberry32(4), {
      ...DEFAULT_TAROT_CONFIG,
      players: players as PlayerCount,
    });
    expect(gift.hands).toHaveLength(players);
    expect(gift.hands.every((h) => h.length === hand)).toBe(true);
    expect(gift.chien).toHaveLength(chien);
    // Alle 78 kaarten precies één keer verdeeld.
    const alle = [...gift.hands.flat(), ...gift.chien];
    expect(new Set(alle.map(tarotKey)).size).toBe(78);
  });
});

describe('tarot — bieden (§4)', () => {
  function gift(players: PlayerCount = 4) {
    return new TarotGift(0, mulberry32(11), { ...DEFAULT_TAROT_CONFIG, players });
  }

  it('laat enkel hogere contracten toe', () => {
    const g = gift();
    expect(g.legalBids(1)).toEqual(['petite', 'garde', 'garde-sans', 'garde-contre']);
    g.bid(1, 'garde');
    expect(g.legalBids(2)).toEqual(['garde-sans', 'garde-contre']);
    expect(() => g.bid(2, 'petite')).toThrow();
  });

  it('past iedereen, dan wordt er opnieuw gedeeld', () => {
    const g = gift();
    for (let i = 0; i < 4; i++) g.bid(g.toAct, 'pass');
    expect(g.phase).toBe('redeal');
  });

  it('de hoogste bieder wordt preneur en krijgt de chien in zijn hand', () => {
    const g = gift();
    g.bid(1, 'petite');
    g.bid(2, 'garde');
    g.bid(3, 'pass');
    g.bid(0, 'pass');
    expect(g.taker).toBe(2);
    expect(g.contract).toBe('garde');
    expect(g.phase).toBe('ecart');
    expect(g.hands[2]).toHaveLength(18 + 6);
    expect(g.chienOpen).toBe(true);
  });

  it('garde sans en garde contre laten de chien dicht — meteen spelen', () => {
    for (const contract of ['garde-sans', 'garde-contre'] as const) {
      const g = gift();
      g.bid(1, contract);
      g.bid(2, 'pass');
      g.bid(3, 'pass');
      g.bid(0, 'pass');
      expect(g.phase).toBe('play');
      expect(g.chienOpen).toBe(false);
      expect(g.hands[1]).toHaveLength(18);
    }
  });
});

describe('tarot — écart (§5)', () => {
  function takerGift() {
    const g = new TarotGift(0, mulberry32(17), DEFAULT_TAROT_CONFIG);
    g.bid(1, 'petite');
    g.bid(2, 'pass');
    g.bid(3, 'pass');
    g.bid(0, 'pass');
    return g;
  }

  it('weigert heren en bouts, en atouts zolang het anders kan', () => {
    const g = takerGift();
    const mag = g.legalDiscards();
    expect(mag.some((c) => c.kind === 'suit' && c.rank === 14)).toBe(false);
    expect(mag.some(isBout)).toBe(false);
    expect(mag.every((c) => c.kind === 'suit')).toBe(true);
  });

  it('legt zes kaarten weg en gaat dan spelen', () => {
    const g = takerGift();
    for (let i = 0; i < 6; i++) g.discard(g.legalDiscards()[0] as TarotCard);
    expect(g.ecart).toHaveLength(6);
    expect(g.hands[1]).toHaveLength(18);
    expect(g.phase).toBe('play');
    expect(g.chienOpen).toBe(false);
  });

  it('weigert een kaart die niet mag', () => {
    const g = takerGift();
    const heer = (g.hands[1] as TarotCard[]).find((c) => c.kind === 'suit' && c.rank === 14);
    if (heer) expect(() => g.discard(heer)).toThrow();
  });
});

describe('tarot — slagregels (§6)', () => {
  it('kleur bekennen gaat voor, met de excuse er altijd bij', () => {
    const hand = [suit('H', 5), suit('H', 9), atout(4), excuse];
    const trick: TarotPlay[] = [{ player: 0, card: suit('H', 12) }];
    expect(tarotLegalPlays(hand, trick).map(tarotKey).sort()).toEqual(['EX', 'H5', 'H9']);
  });

  it('kan je niet volgen, dan moet je troeven', () => {
    const hand = [suit('S', 5), atout(4), atout(9)];
    const trick: TarotPlay[] = [{ player: 0, card: suit('H', 12) }];
    expect(tarotLegalPlays(hand, trick).map(tarotKey).sort()).toEqual(['T4', 'T9']);
  });

  it('ligt er al een atout, dan moet je hoger — kan dat niet, dan toch troef', () => {
    const trick: TarotPlay[] = [
      { player: 0, card: suit('H', 12) },
      { player: 1, card: atout(8) },
    ];
    expect(tarotLegalPlays([suit('S', 5), atout(4), atout(9)], trick).map(tarotKey)).toEqual([
      'T9',
    ]);
    expect(
      tarotLegalPlays([suit('S', 5), atout(2), atout(4)], trick)
        .map(tarotKey)
        .sort(),
    ).toEqual(['T2', 'T4']);
  });

  it('zonder kleur en zonder atout gooi je vrij bij', () => {
    const hand = [suit('S', 5), suit('D', 9)];
    const trick: TarotPlay[] = [{ player: 0, card: suit('H', 12) }];
    expect(tarotLegalPlays(hand, trick)).toHaveLength(2);
  });

  it('de excuse mag altijd, ook als je moet troeven', () => {
    const hand = [atout(4), excuse];
    const trick: TarotPlay[] = [{ player: 0, card: suit('H', 12) }];
    expect(tarotLegalPlays(hand, trick).map(tarotKey).sort()).toEqual(['EX', 'T4']);
  });

  it('de excuse wint nooit; de hoogste atout wel', () => {
    const trick: TarotPlay[] = [
      { player: 0, card: excuse },
      { player: 1, card: suit('H', 12) },
      { player: 2, card: atout(3) },
      { player: 3, card: suit('H', 14) },
    ];
    expect(tarotTrickWinner(trick)).toBe(2);
  });

  it('opent de excuse de slag, dan bepaalt de tweede kaart de kleur', () => {
    const trick: TarotPlay[] = [
      { player: 0, card: excuse },
      { player: 1, card: suit('H', 9) },
      { player: 2, card: suit('H', 13) },
      { player: 3, card: suit('D', 14) },
    ];
    expect(tarotTrickWinner(trick)).toBe(2);
  });
});

describe('tarot — doelen en telling (§8, §9)', () => {
  it('het doel zakt met elk bout', () => {
    expect([0, 1, 2, 3].map(targetHalfPoints)).toEqual([112, 102, 82, 72]);
    expect([0, 1, 2, 3].map((b) => formatHalfPoints(targetHalfPoints(b)))).toEqual([
      '56',
      '51',
      '41',
      '36',
    ]);
  });

  it('de contractfactoren zijn 1, 2, 4 en 6', () => {
    expect(CONTRACTS.map((c) => c.multiplier)).toEqual([1, 2, 4, 6]);
  });

  function playOut(players: PlayerCount, seed: number, contract: ContractId = 'petite') {
    const session = new TarotSession(mulberry32(seed), 0, {
      ...DEFAULT_TAROT_CONFIG,
      players,
    });
    const gift = session.nextGift();
    gift.bid(gift.toAct, contract);
    while (gift.phase === 'bidding') gift.bid(gift.toAct, 'pass');
    if (gift.phase === 'call') gift.callKing('S');
    while (gift.phase === 'ecart') gift.discard(gift.legalDiscards()[0] as TarotCard);
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as TarotCard);
    }
    return { session, gift };
  }

  it.each([[3], [4], [5]])('speelt met %i spelers een hele gift uit', (players) => {
    const { gift } = playOut(players as PlayerCount, 5);
    const s = gift.score as NonNullable<typeof gift.score>;
    expect(gift.tricksPlayed).toBe(gift.cardsPerHand);
    expect(gift.hands.every((h) => h.length === 0)).toBe(true);
    // Zero-sum: de preneur wint precies wat de anderen betalen (§9.1).
    expect(s.pointsHalf.reduce((a, b) => a + b, 0)).toBe(0);
    expect(s.targetHalf).toBe(targetHalfPoints(s.bouts));
    expect(s.made).toBe(s.diffHalf >= 0);
  });

  /** Alle kaarten die na afloop ergens liggen. Bij petite en garde zit de chien
   *  al in de hand van de preneur verwerkt, dus die telt dan niet apart mee. */
  function alleKaarten(gift: TarotGift): TarotCard[] {
    const genomen = contractInfo(gift.contract as ContractId).takesChien;
    return [...gift.won.flat(), ...gift.ecart, ...(genomen ? [] : gift.chien)];
  }

  it('verliest geen enkele kaart: alle 78 komen terug in slagen, écart en chien', () => {
    for (const players of [3, 4, 5] as PlayerCount[]) {
      for (const contract of ['petite', 'garde-contre'] as const) {
        const { gift } = playOut(players, 8, contract);
        const alle = alleKaarten(gift);
        expect(new Set(alle.map(tarotKey)).size).toBe(78);
        expect(halfPointsOf(alle)).toBe(182);
      }
    }
  });

  it('preneur en verdediging delen samen exact de 91 punten', () => {
    for (const players of [3, 4, 5] as PlayerCount[]) {
      const { gift } = playOut(players, 8);
      const s = gift.score as NonNullable<typeof gift.score>;
      const verdediging: TarotCard[] = [];
      for (let p = 0; p < players; p++) {
        if (!gift.onTakerSide(p)) verdediging.push(...(gift.won[p] as TarotCard[]));
      }
      // De halve punt van de excuse-ruil (§6.3) zit in preneurHalf verrekend;
      // wat de verdediging tekortkomt of extra krijgt, is exact het spiegelbeeld.
      const verschil = 182 - s.preneurHalf - halfPointsOf(verdediging);
      expect(Math.abs(verschil)).toBeLessThanOrEqual(1);
    }
  });

  it('zit de geroepen kaart in de chien of bij de preneur zelf, dan speelt hij alleen', () => {
    // Vijf spelers: de chien telt drie kaarten, dus dit gebeurt echt.
    let alleen = 0;
    let metPartner = 0;
    for (let seed = 1; seed <= 40 && (alleen === 0 || metPartner === 0); seed++) {
      const g = new TarotGift(0, mulberry32(seed), { ...DEFAULT_TAROT_CONFIG, players: 5 });
      g.bid(g.toAct, 'garde');
      while (g.phase === 'bidding') g.bid(g.toAct, 'pass');
      const rank = g.callRank();
      const taker = g.taker as number;
      for (const kleur of ['S', 'H', 'D', 'C'] as const) {
        const kaart: TarotCard = { kind: 'suit', suit: kleur, rank };
        const bijPreneur = (g.hands[taker] as TarotCard[]).some(
          (c) => tarotKey(c) === tarotKey(kaart),
        );
        const inChien = g.chien.some((c) => tarotKey(c) === tarotKey(kaart));
        if (!bijPreneur && !inChien) continue;
        const kopie = new TarotGift(0, mulberry32(seed), { ...DEFAULT_TAROT_CONFIG, players: 5 });
        kopie.bid(kopie.toAct, 'garde');
        while (kopie.phase === 'bidding') kopie.bid(kopie.toAct, 'pass');
        kopie.callKing(kleur);
        expect(kopie.partner).toBeNull();
        expect(kopie.partnerRevealed).toBe(true);
        alleen++;
        break;
      }
      const anders = (['S', 'H', 'D', 'C'] as const).find((kleur) => {
        const kaart: TarotCard = { kind: 'suit', suit: kleur, rank };
        return g.hands.some(
          (h, p) => p !== taker && h.some((c) => tarotKey(c) === tarotKey(kaart)),
        );
      });
      if (anders && metPartner === 0) {
        g.callKing(anders);
        expect(g.partner).not.toBeNull();
        expect(g.partner).not.toBe(taker);
        expect(g.partnerRevealed).toBe(false);
        metPartner++;
      }
    }
    expect(alleen).toBeGreaterThan(0);
    expect(metPartner).toBeGreaterThan(0);
  });

  it('bij vijf spelers krijgt de geroepene één aandeel en de preneur twee', () => {
    const { gift } = playOut(5, 12);
    const s = gift.score as NonNullable<typeof gift.score>;
    if (gift.partner === null) return; // preneur riep zichzelf
    expect(s.pointsHalf[gift.partner]).toBe(s.unitHalf);
    expect(s.pointsHalf[gift.taker as number]).toBe(2 * s.unitHalf);
    const verdedigers = s.pointsHalf.filter((_, p) => !gift.onTakerSide(p));
    expect(verdedigers).toHaveLength(3);
    expect(verdedigers.every((v) => v === -s.unitHalf)).toBe(true);
  });

  it('garde contre geeft de chien aan de verdediging', () => {
    const { gift } = playOut(4, 3, 'garde-contre');
    const s = gift.score as NonNullable<typeof gift.score>;
    expect(s.multiplier).toBe(6);
    expect(gift.chien).toHaveLength(6);
    // De chien zit niet bij de preneur: bouts uit de chien tellen niet voor hem.
    const chienBouts = countBouts(gift.chien);
    const eigen = countBouts(gift.won.filter((_, p) => gift.onTakerSide(p)).flat());
    expect(s.bouts).toBe(eigen);
    expect(s.bouts + chienBouts).toBeLessThanOrEqual(3);
  });

  it('speelt een hele partij uit: één gift per speler, en de deler schuift door', () => {
    const session = new TarotSession(mulberry32(19), 0, { ...DEFAULT_TAROT_CONFIG, players: 4 });
    let veiligheid = 60;
    while (!session.finished && veiligheid-- > 0) {
      const gift = session.nextGift();
      gift.bid(gift.toAct, 'garde');
      while (gift.phase === 'bidding') gift.bid(gift.toAct, 'pass');
      if (gift.phase === 'call') gift.callKing('S');
      while (gift.phase === 'ecart') gift.discard(gift.legalDiscards()[0] as TarotCard);
      while (gift.phase === 'play') {
        const p = gift.toPlay;
        gift.playCard(p, gift.legalCards(p)[0] as TarotCard);
      }
      session.closeGift();
    }
    expect(session.finished).toBe(true);
    expect(session.giftNumber).toBe(4);
    expect(session.totalsHalf.reduce((a, b) => a + b, 0)).toBe(0);
  });
});
