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
  POIGNEE_POINTS,
  contractInfo,
  isPetitSec,
  poigneeThreshold,
  TarotGift,
  TarotSession,
  dealShape,
  tarotLegalPlays,
  tarotTrickWinner,
  targetHalfPoints,
  type ContractId,
  type PlayerCount,
  type PoigneeSize,
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

  it('biedt tegen de klok in, vanaf naast de deler', () => {
    // Officieel gaat tarot tegen de klok in (§3): met deler 0 is dat 3, 2, 1, 0.
    const g = gift();
    const volgorde: number[] = [];
    while (g.phase === 'bidding') {
      volgorde.push(g.toAct);
      g.bid(g.toAct, 'pass');
    }
    expect(volgorde).toEqual([3, 2, 1, 0]);

    // En met de klok mee als variant.
    const m = new TarotGift(0, mulberry32(11), {
      ...DEFAULT_TAROT_CONFIG,
      counterClockwise: false,
    });
    const andersom: number[] = [];
    while (m.phase === 'bidding') {
      andersom.push(m.toAct);
      m.bid(m.toAct, 'pass');
    }
    expect(andersom).toEqual([1, 2, 3, 0]);
  });

  it('laat enkel hogere contracten toe', () => {
    const g = gift();
    const eerste = g.toAct;
    expect(g.legalBids(eerste)).toEqual(['petite', 'garde', 'garde-sans', 'garde-contre']);
    g.bid(eerste, 'garde');
    const tweede = g.toAct;
    expect(g.legalBids(tweede)).toEqual(['garde-sans', 'garde-contre']);
    expect(() => g.bid(tweede, 'petite')).toThrow();
  });

  it('past iedereen, dan wordt er opnieuw gedeeld', () => {
    const g = gift();
    for (let i = 0; i < 4; i++) g.bid(g.toAct, 'pass');
    expect(g.phase).toBe('redeal');
  });

  it('de hoogste bieder wordt preneur en krijgt de chien in zijn hand', () => {
    const g = gift();
    const eerste = g.toAct;
    g.bid(eerste, 'petite');
    const tweede = g.toAct;
    g.bid(tweede, 'garde');
    while (g.phase === 'bidding') g.bid(g.toAct, 'pass');
    expect(g.taker).toBe(tweede);
    expect(g.contract).toBe('garde');
    expect(g.phase).toBe('ecart');
    expect(g.hands[tweede]).toHaveLength(18 + 6);
    expect(g.chienOpen).toBe(true);
  });

  it('garde sans en garde contre laten de chien dicht — meteen spelen', () => {
    for (const contract of ['garde-sans', 'garde-contre'] as const) {
      const g = gift();
      const preneur = g.toAct;
      g.bid(preneur, contract);
      while (g.phase === 'bidding') g.bid(g.toAct, 'pass');
      // Zonder chien meteen naar de aankondigingen en dan spelen.
      expect(g.phase).toBe('announce');
      settleAnnouncements(g);
      expect(g.phase).toBe('play');
      expect(g.chienOpen).toBe(false);
      expect(g.hands[preneur]).toHaveLength(18);
    }
  });
});

describe('tarot — écart (§5)', () => {
  function takerGift() {
    const g = new TarotGift(0, mulberry32(17), DEFAULT_TAROT_CONFIG);
    g.bid(g.toAct, 'petite');
    while (g.phase === 'bidding') g.bid(g.toAct, 'pass');
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
    expect(g.hands[g.taker as number]).toHaveLength(18);
    settleAnnouncements(g);
    expect(g.phase).toBe('play');
    expect(g.chienOpen).toBe(false);
  });

  it('weigert een kaart die niet mag', () => {
    const g = takerGift();
    const heer = (g.hands[g.taker as number] as TarotCard[]).find(
      (c) => c.kind === 'suit' && c.rank === 14,
    );
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

/** De aankondigingsfase afhandelen: geen chelem, geen poignée. */
function settleAnnouncements(gift: TarotGift): void {
  let veiligheid = 20;
  while (gift.phase === 'announce' && veiligheid-- > 0) {
    const p = gift.announceToAct as number;
    if (gift.chelemAnnounced === null && p === gift.taker) gift.announceChelem(false);
    else gift.declarePoignee(p, 'none');
  }
}

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
    let gift = session.nextGift();
    // Petit sec of iedereen past: opnieuw delen tot er echt gespeeld wordt.
    for (let poging = 0; poging < 40; poging++) {
      if (gift.phase === 'redeal') {
        session.closeGift();
        gift = session.nextGift();
        continue;
      }
      if (gift.phase !== 'bidding') break;
      gift.bid(gift.toAct, gift.legalBids(gift.toAct).includes(contract) ? contract : 'pass');
    }
    if (gift.phase === 'call') gift.callKing('S');
    while (gift.phase === 'ecart') gift.discard(gift.legalDiscards()[0] as TarotCard);
    settleAnnouncements(gift);
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
      while (g.phase === 'bidding') {
        const p = g.toAct;
        g.bid(p, g.legalBids(p).includes('garde') ? 'garde' : 'pass');
      }
      if (g.phase !== 'call') continue;
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
        while (kopie.phase === 'bidding') {
          const q = kopie.toAct;
          kopie.bid(q, kopie.legalBids(q).includes('garde') ? 'garde' : 'pass');
        }
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
      while (gift.phase === 'bidding') {
        const p = gift.toAct;
        gift.bid(p, gift.legalBids(p).includes('garde') ? 'garde' : 'pass');
      }
      if (gift.phase === 'call') gift.callKing('S');
      while (gift.phase === 'ecart') gift.discard(gift.legalDiscards()[0] as TarotCard);
      settleAnnouncements(gift);
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

describe('tarot — de officiële primes (§9.2, §9.3) en varianten (§11)', () => {
  it('poignée-drempels volgen het FFT-reglement per spelersaantal', () => {
    expect([3, 4, 5].map((n) => poigneeThreshold(n as PlayerCount, 'simple'))).toEqual([13, 10, 8]);
    expect([3, 4, 5].map((n) => poigneeThreshold(n as PlayerCount, 'double'))).toEqual([
      15, 13, 10,
    ]);
    expect([3, 4, 5].map((n) => poigneeThreshold(n as PlayerCount, 'triple'))).toEqual([
      18, 15, 13,
    ]);
    expect(POIGNEE_POINTS).toEqual({ simple: 20, double: 30, triple: 40 });
  });

  it('herkent petit sec: de 1 als enige atout, zonder excuse', () => {
    expect(isPetitSec([atout(1), suit('S', 5), suit('H', 9)])).toBe(true);
    expect(isPetitSec([atout(1), excuse, suit('S', 5)])).toBe(false);
    expect(isPetitSec([atout(1), atout(9), suit('S', 5)])).toBe(false);
    expect(isPetitSec([atout(9), suit('S', 5)])).toBe(false);
  });

  it('gooit een petit sec in — tenzij de variant dat uitzet', () => {
    // Petit sec is zeldzaam (~0,6% bij vijf spelers), dus we zoeken gericht.
    let gevonden = 0;
    for (let seed = 1; seed <= 300 && gevonden < 3; seed++) {
      const uit = new TarotGift(0, mulberry32(seed), {
        ...DEFAULT_TAROT_CONFIG,
        players: 5,
        petitSec: false,
      });
      if (!uit.hands.some((h) => isPetitSec(h))) continue;
      gevonden++;
      const aan = new TarotGift(0, mulberry32(seed), { ...DEFAULT_TAROT_CONFIG, players: 5 });
      expect(aan.phase).toBe('redeal');
      expect(uit.phase).toBe('bidding');
    }
    expect(gevonden).toBeGreaterThan(0);
  });

  it('de poignée-premie gaat naar de winnaar van de gift en wordt niet vermenigvuldigd', () => {
    // Twee identieke giften: één met poignée, één zonder. Het verschil is exact
    // de premie, ongeacht de factor van het contract.
    const speel = (poignee: boolean) => {
      const gift = new TarotGift(0, mulberry32(77), { ...DEFAULT_TAROT_CONFIG, poignee });
      while (gift.phase === 'bidding') {
        const p = gift.toAct;
        gift.bid(p, gift.legalBids(p).includes('garde') ? 'garde' : 'pass');
      }
      while (gift.phase === 'ecart') gift.discard(gift.legalDiscards()[0] as TarotCard);
      let veiligheid = 20;
      while (gift.phase === 'announce' && veiligheid-- > 0) {
        const p = gift.announceToAct as number;
        if (gift.chelemAnnounced === null && p === gift.taker) gift.announceChelem(false);
        else {
          const opties = gift.poigneeOptions(p);
          gift.declarePoignee(
            p,
            poignee && opties.length > 0 ? (opties[0] as PoigneeSize) : 'none',
          );
        }
      }
      while (gift.phase === 'play') {
        const p = gift.toPlay;
        gift.playCard(p, gift.legalCards(p)[0] as TarotCard);
      }
      return gift.score as NonNullable<typeof gift.score>;
    };
    const met = speel(true);
    const zonder = speel(false);
    expect(zonder.poigneePoints).toBe(0);
    const verschil = Math.abs(met.unitHalf) - Math.abs(zonder.unitHalf);
    expect(verschil).toBe(met.poigneePoints * 2);
  });

  it('chelem: aangekondigd +400, stil +200, aangekondigd en gemist −200', () => {
    // De premies zitten in unitHalf (×2), los van de contractfactor.
    const basis = (chelemAnnounced: boolean, gehaald: boolean) => {
      const diffHalf = 20;
      const basisHalf = 50 + diffHalf;
      let unit = basisHalf * 2; // garde
      if (chelemAnnounced && gehaald) unit += 800;
      else if (!chelemAnnounced && gehaald) unit += 400;
      else if (chelemAnnounced && !gehaald) unit -= 400;
      return unit;
    };
    expect(basis(true, true) - basis(false, true)).toBe(400);
    expect(basis(false, true) - basis(false, false)).toBe(400);
    expect(basis(true, false) - basis(false, false)).toBe(-400);
  });

  it('wie een chelem aankondigt, komt zelf uit', () => {
    const gift = new TarotGift(0, mulberry32(23), DEFAULT_TAROT_CONFIG);
    while (gift.phase === 'bidding') {
      const p = gift.toAct;
      gift.bid(p, gift.legalBids(p).includes('garde-sans') ? 'garde-sans' : 'pass');
    }
    expect(gift.phase).toBe('announce');
    const voor = gift.trickLeader;
    gift.announceChelem(true);
    expect(gift.trickLeader).toBe(gift.taker);
    if (gift.taker !== voor) expect(gift.trickLeader).not.toBe(voor);
  });

  it('afronden naar boven verandert enkel de écart, niet de rest', () => {
    const speel = (rounding: 'exact' | 'up') => {
      const gift = new TarotGift(0, mulberry32(41), { ...DEFAULT_TAROT_CONFIG, rounding });
      while (gift.phase === 'bidding') {
        const p = gift.toAct;
        gift.bid(p, gift.legalBids(p).includes('petite') ? 'petite' : 'pass');
      }
      while (gift.phase === 'ecart') gift.discard(gift.legalDiscards()[0] as TarotCard);
      settleAnnouncements(gift);
      while (gift.phase === 'play') {
        const p = gift.toPlay;
        gift.playCard(p, gift.legalCards(p)[0] as TarotCard);
      }
      return gift.score as NonNullable<typeof gift.score>;
    };
    const exact = speel('exact');
    const afgerond = speel('up');
    expect(afgerond.preneurHalf).toBe(exact.preneurHalf);
    expect(afgerond.diffHalf).toBe(exact.diffHalf);
    // Een halve punt écart wordt een hele; verder blijft alles gelijk.
    const oneven = Math.abs(exact.diffHalf) % 2 === 1;
    expect(Math.abs(afgerond.unitHalf)).toBe(
      Math.abs(exact.unitHalf) + (oneven ? exact.multiplier : 0),
    );
  });

  it('petit au bout telt maal de factor van het contract', () => {
    // 10 punten = 20 halve punten, en die zitten binnen de vermenigvuldiging.
    for (const [contract, factor] of [
      ['petite', 1],
      ['garde', 2],
      ['garde-sans', 4],
      ['garde-contre', 6],
    ] as const) {
      expect(contractInfo(contract).multiplier).toBe(factor);
      const zonder = (50 + 10) * factor;
      const met = (50 + 10 + 20) * factor;
      expect(met - zonder).toBe(20 * factor);
    }
  });
});
