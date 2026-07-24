import { describe, expect, it } from 'vitest';
import { ACE, makeDeck, mulberry32, sortHand, type Card, type Suit } from './cards';
import { deal, nextPlayer } from './deal';
import { Bidding, detectTroel } from './bidding';
import { legalPlays, trickWinner } from './play';
import { scoreGift } from './scoring';
import { Session, type Gift } from './game';
import { getRuleset, type Contract, type Ruleset } from '../ruleset';

const ruleset = getRuleset('vlaams-standaard') as Ruleset;
const byId = (id: string): Contract => ruleset.contracts.find((c) => c.id === id) as Contract;

const card = (suit: Suit, rank: number): Card => ({ suit, rank: rank as Card['rank'] });

/** Handen construeren voor biedtests: rest van het deck willekeurig aanvullen. */
function handsWith(fixed: Partial<Record<number, Card[]>>): Card[][] {
  const used = new Set<string>();
  const hands: Card[][] = [[], [], [], []];
  for (const [p, cards] of Object.entries(fixed)) {
    for (const c of cards ?? []) {
      hands[Number(p)]?.push(c);
      used.add(`${c.suit}${c.rank}`);
    }
  }
  const rest = makeDeck().filter((c) => !used.has(`${c.suit}${c.rank}`));
  let i = 0;
  for (let p = 0; p < 4; p++) {
    while ((hands[p] as Card[]).length < 13) {
      (hands[p] as Card[]).push(rest[i] as Card);
      i++;
    }
  }
  return hands;
}

describe('delen', () => {
  it('geeft elke speler 13 kaarten en draait de laatste kaart van de deler', () => {
    const d = deal(2, mulberry32(42));
    expect(d.hands.every((h) => h.length === 13)).toBe(true);
    const dealerHand = d.hands[2] as Card[];
    expect(dealerHand[dealerHand.length - 1]).toEqual(d.turnedCard);
    expect(d.trumpSuit).toBe(d.turnedCard.suit);
    const all = d.hands.flat();
    expect(new Set(all.map((c) => `${c.suit}${c.rank}`)).size).toBe(52);
  });

  it('is reproduceerbaar met dezelfde seed', () => {
    expect(deal(0, mulberry32(7))).toEqual(deal(0, mulberry32(7)));
  });
});

describe('slagen', () => {
  it('verplicht kleur bekennen', () => {
    const hand = [card('S', 5), card('S', 9), card('H', ACE)];
    const trick = [{ player: 0, card: card('S', 12) }];
    expect(legalPlays(hand, trick).every((c) => c.suit === 'S')).toBe(true);
  });

  it('laat vrij bijgooien of troeven zonder kleur (geen troefplicht)', () => {
    const hand = [card('D', 3), card('H', 7)];
    const trick = [{ player: 0, card: card('S', 12) }];
    expect(legalPlays(hand, trick)).toHaveLength(2);
  });

  it('hoogste kaart in gevraagde kleur wint zonder troef', () => {
    const trick = [
      { player: 0, card: card('S', 10) },
      { player: 1, card: card('S', 13) },
      { player: 2, card: card('H', ACE) },
      { player: 3, card: card('S', 2) },
    ];
    expect(trickWinner(trick, null)).toBe(1);
  });

  it('troef klopt de gevraagde kleur, hoogste troef wint', () => {
    const trick = [
      { player: 0, card: card('S', ACE) },
      { player: 1, card: card('D', 2) },
      { player: 2, card: card('D', 9) },
      { player: 3, card: card('S', 13) },
    ];
    expect(trickWinner(trick, 'D')).toBe(2);
  });
});

describe('troel-detectie (§5.4)', () => {
  it('vindt houder, partner en troef via de vierde aas', () => {
    const hands = handsWith({
      0: [card('S', ACE), card('H', ACE), card('D', ACE)],
      2: [card('C', ACE)],
    });
    const troel = detectTroel(hands);
    expect(troel).toMatchObject({ holder: 0, partner: 2 });
  });

  it('4 azen: partner is houder van de hoogste harten (hartenheer)', () => {
    const hands = handsWith({
      1: [card('S', ACE), card('H', ACE), card('D', ACE), card('C', ACE)],
      3: [card('H', 13)],
    });
    const troel = detectTroel(hands);
    expect(troel).toMatchObject({ holder: 1, partner: 3 });
  });
});

describe('biedronde', () => {
  const noTroelHands = (): Card[][] =>
    handsWith({
      0: [card('S', ACE)],
      1: [card('H', ACE)],
      2: [card('D', ACE)],
      3: [card('C', ACE)],
    });

  it('iedereen past → herdeel', () => {
    const b = new Bidding(ruleset, 0, noTroelHands(), 'S');
    for (let i = 0; i < 4; i++) b.act(b.toAct, { type: 'pass' });
    expect(b.phase).toBe('redeal');
  });

  it('vraag + mee vormt een team van twee', () => {
    const b = new Bidding(ruleset, 0, noTroelHands(), 'S');
    b.act(1, { type: 'bid', contractId: 'vraag-en-mee' });
    b.act(2, { type: 'join' });
    b.act(3, { type: 'pass' });
    b.act(0, { type: 'pass' });
    expect(b.phase).toBe('done');
    const result = b.result();
    expect(result?.contract.id).toBe('vraag-en-mee');
    expect(result?.declarers).toEqual([1, 2]);
    expect(result?.trumpSuit).toBe('S');
    expect(result?.leader).toBe(1); // links van deler 0
  });

  it('vraag zonder maat → alleen-keuze; accepteren geeft contract alleen', () => {
    const b = new Bidding(ruleset, 0, noTroelHands(), 'S');
    b.act(1, { type: 'bid', contractId: 'vraag-en-mee' });
    b.act(2, { type: 'pass' });
    b.act(3, { type: 'pass' });
    b.act(0, { type: 'pass' });
    expect(b.phase).toBe('alleen-choice');
    b.chooseAlleen(true);
    expect(b.result()?.contract.id).toBe('alleen');
    expect(b.result()?.declarers).toEqual([1]);
  });

  it('vraag zonder maat en weigeren → herdeel', () => {
    const b = new Bidding(ruleset, 0, noTroelHands(), 'S');
    b.act(1, { type: 'bid', contractId: 'vraag-en-mee' });
    b.act(2, { type: 'pass' });
    b.act(3, { type: 'pass' });
    b.act(0, { type: 'pass' });
    b.chooseAlleen(false);
    expect(b.phase).toBe('redeal');
  });

  it('hoger bod verdringt vraag; abondance-troef wordt gekozen door de bieder', () => {
    const b = new Bidding(ruleset, 0, noTroelHands(), 'S');
    b.act(1, { type: 'bid', contractId: 'vraag-en-mee' });
    b.act(2, { type: 'bid', contractId: 'abondance-9' });
    b.act(3, { type: 'pass' });
    b.act(0, { type: 'pass' });
    b.act(1, { type: 'pass' });
    expect(b.phase).toBe('done');
    const result = b.result();
    expect(result?.contract.id).toBe('abondance-9');
    expect(result?.trumpSuit).toBeNull(); // declarer-choice
    expect(result?.leader).toBe(2); // abondance: bieder komt uit (§5.3)
  });

  it('meerdere miseries tegelijk zijn toegelaten (§5.5)', () => {
    const b = new Bidding(ruleset, 0, noTroelHands(), 'S');
    b.act(1, { type: 'bid', contractId: 'miserie' });
    expect(b.canJoin(2)).toBe(true);
    b.act(2, { type: 'join' });
    b.act(3, { type: 'pass' });
    b.act(0, { type: 'pass' });
    expect(b.result()?.declarers).toEqual([1, 2]);
  });

  it('troel is verplicht en enkel overbiedbaar vanaf abondance 9', () => {
    const hands = handsWith({
      0: [card('S', ACE), card('H', ACE), card('D', ACE)],
      2: [card('C', ACE)],
    });
    const b = new Bidding(ruleset, 0, hands, 'S');
    expect(b.current?.contract.id).toBe('troel');
    const bids = b.legalBids(b.toAct).map((c) => c.id);
    expect(bids).not.toContain('vraag-en-mee');
    expect(bids).toContain('abondance-9');
    // iedereen (behalve de troel-spelers) past → troel staat
    b.act(1, { type: 'pass' });
    b.act(3, { type: 'pass' });
    expect(b.phase).toBe('done');
    const result = b.result();
    expect(result?.contract.id).toBe('troel');
    expect(result?.declarers).toEqual([0, 2]);
    expect(result?.trumpSuit).toBeNull(); // troef pas bekend na de eerste kaart (§5.4)
    expect(result?.leader).toBe(2); // houder vierde aas komt uit
  });
});

describe('scoring (§5, §7)', () => {
  it('vraag & mee gehaald met overslagen', () => {
    const score = scoreGift({
      contract: byId('vraag-en-mee'),
      declarers: [0, 1],
      tricksWon: [5, 5, 2, 1],
    });
    // 10 slagen = 2 basis + 2 overslagen = 4 per teamlid
    expect(score.points).toEqual([4, 4, -4, -4]);
    expect(score.success).toEqual([true, true]);
  });

  it('vraag & mee met vole-bonus bij 13 slagen', () => {
    const score = scoreGift({
      contract: byId('vraag-en-mee'),
      declarers: [0, 1],
      tricksWon: [7, 6, 0, 0],
    });
    // 2 + 5 overslagen + 3 vole = 10
    expect(score.points).toEqual([10, 10, -10, -10]);
  });

  it('vraag & mee niet gehaald: symmetrisch met onderslagen', () => {
    const score = scoreGift({
      contract: byId('vraag-en-mee'),
      declarers: [0, 1],
      tricksWon: [4, 2, 4, 3],
    });
    // 6 slagen: 2 onder doel → −(2 + 2·1) = −4
    expect(score.points).toEqual([-4, -4, 4, 4]);
  });

  it('alleen: solo verrekent met elk van de drie tegenspelers', () => {
    const score = scoreGift({
      contract: byId('alleen'),
      declarers: [2],
      tricksWon: [3, 2, 6, 2],
    });
    // 6 slagen = 3 basis + 1 overslag = 4 → bieder +12, rest −4
    expect(score.points).toEqual([-4, -4, 12, -4]);
    expect(score.points.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('abondance is een vast bedrag, ook met overslagen', () => {
    const score = scoreGift({
      contract: byId('abondance-9'),
      declarers: [1],
      tricksWon: [1, 11, 1, 0],
    });
    expect(score.points).toEqual([-6, 18, -6, -6]);
  });

  it('miserie: exact 0 slagen; elke bieder afzonderlijk gescoord', () => {
    const score = scoreGift({
      contract: byId('miserie'),
      declarers: [0, 3],
      tricksWon: [0, 6, 6, 1],
    });
    // speler 0 slaagt (+21, rest −7), speler 3 faalt (−21, rest +7)
    expect(score.points).toEqual([21 + 7, -7 + 7, -7 + 7, -7 - 21]);
    expect(score.points.reduce((a, b) => a + b, 0)).toBe(0);
    expect(score.success).toEqual([true, false]);
  });

  it('troel telt dubbel per over-/onderslag', () => {
    const win = scoreGift({
      contract: byId('troel'),
      declarers: [0, 2],
      tricksWon: [5, 2, 4, 2],
    });
    // 9 slagen = 4 + 2·1 = 6
    expect(win.points).toEqual([6, -6, 6, -6]);
  });
});

describe('troel via Gift: eerste kaart bepaalt troef', () => {
  it('zet de troef op de kleur van de eerste uitgekomen kaart', () => {
    // Zoek een seed waarin troel valt
    for (let seed = 1; seed < 400; seed++) {
      const session = new Session(ruleset, mulberry32(seed));
      const gift = session.nextGift();
      const b = gift.bidding;
      if (!b.troel) continue;
      while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
      expect(b.phase).toBe('done');
      gift.settleBidding();
      expect(gift.contract?.trumpSuit).toBeNull();
      const leader = gift.toPlay;
      expect(leader).toBe(b.troel.partner);
      const lead = gift.legalCards(leader)[0] as Card;
      gift.playCard(leader, lead);
      expect(gift.contract?.trumpSuit).toBe(lead.suit);
      return;
    }
    throw new Error('geen troel-seed gevonden');
  });
});

describe('gift en sessie', () => {
  function playOutGift(gift: Gift): void {
    gift.settleBidding();
    if (gift.phase === 'trump-choice' && gift.trumpChooser !== null) {
      const hand = gift.deal.hands[gift.trumpChooser] as Card[];
      gift.chooseTrump((hand[0] as Card).suit);
    }
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      gift.playCard(p, gift.legalCards(p)[0] as Card);
    }
  }

  it('speelt een volledige gift uit tot een zero-sum score', () => {
    const session = new Session(ruleset, mulberry32(123));
    const gift = session.nextGift();
    // forceer een eenvoudig contract: eerste actieve speler vraagt, volgende gaat mee
    const b = gift.bidding;
    if (!b.current) {
      b.act(b.toAct, { type: 'bid', contractId: 'vraag-en-mee' });
      b.act(b.toAct, { type: 'join' });
    }
    while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
    if (b.phase === 'alleen-choice') b.chooseAlleen(true);
    playOutGift(gift);
    expect(gift.phase).toBe('scored');
    expect(gift.tricksWon.reduce((a, b2) => a + b2, 0)).toBe(13);
    expect(gift.score?.points.reduce((a, b2) => a + b2, 0)).toBe(0);
    session.closeGift();
    expect(session.totals.reduce((a, b2) => a + b2, 0)).toBe(0);
    expect(session.dealer).toBe(1);
  });

  it('herdeel telt niet als gespeelde gift', () => {
    const session = new Session(ruleset, mulberry32(5));
    let gift = session.nextGift();
    // vind een seed-onafhankelijke weg: laat iedereen passen (kan enkel zonder troel)
    while (gift.bidding.troel) {
      session.closeGift();
      gift = session.nextGift();
    }
    const n = session.giftNumber;
    while (gift.bidding.phase === 'bidding') gift.bidding.act(gift.bidding.toAct, { type: 'pass' });
    if (gift.bidding.phase === 'alleen-choice') gift.bidding.chooseAlleen(false);
    expect(gift.phase).toBe('redeal');
    session.closeGift();
    expect(session.giftNumber).toBe(n - 1);
  });

  it('sorteert handen voor weergave zonder kaarten te verliezen', () => {
    const d = deal(0, mulberry32(9));
    const sorted = sortHand(d.hands[0] as Card[]);
    expect(sorted).toHaveLength(13);
    expect(nextPlayer(3)).toBe(0);
  });
});
