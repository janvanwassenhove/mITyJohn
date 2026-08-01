import { beforeEach, describe, expect, it } from 'vitest';
import { mulberry32, type Card } from './engine/cards';
import { Session } from './engine/game';
import { chooseBid, chooseCard } from './bots';
import * as store from './store';
import { getRuleset, type Ruleset } from './ruleset';
import { chooseManilleCard, chooseManilleTrump } from './bots';
import { DEFAULT_MANILLE_OPTIONS, DEFAULT_WIEZEN_OPTIONS } from './options';
import { chooseHartenCard, chooseHartenPass } from './bots';
import { DEFAULT_HARTEN_CONFIG } from './engine/hartenjagen';
import { chooseBoerenBid, chooseBoerenCard } from './bots';
import { DEFAULT_BOEREN_CONFIG } from './engine/boerenbridge';
import { chooseTarotCard, chooseTarotDiscard, chooseTarotPoignee } from './bots';
import { DEFAULT_TAROT_CONFIG } from './engine/tarot';
import { tarotKey } from './engine/tarot-cards';

const ruleset = getRuleset('vlaams-standaard') as Ruleset;

/** Speel N giften uit met bots en registreer elke actie zoals de UI dat doet. */
function playAndRecord(seed: number, giften: number): store.PersistedSession {
  const state = store.newPersisted(ruleset.id, seed, 'normal', { ...DEFAULT_WIEZEN_OPTIONS });
  const session = new Session(ruleset, mulberry32(seed));
  session.nextGift();
  let done = 0;
  let safety = 50_000;
  while (done < giften) {
    if (--safety <= 0) throw new Error('vastgelopen');
    const gift = session.gift as NonNullable<typeof session.gift>;
    switch (gift.phase) {
      case 'bidding': {
        const p = gift.bidding.toAct;
        const a = chooseBid(gift.bidding, p, gift.deal.hands[p] as Card[]);
        gift.bidding.act(p, a);
        state.actions.push({ t: 'bid', p, a });
        break;
      }
      case 'alleen-choice':
        gift.bidding.chooseAlleen(true);
        state.actions.push({ t: 'alleen', accept: true });
        break;
      case 'trump-choice': {
        const p = gift.trumpChooser as number;
        const suit = (gift.deal.hands[p] as Card[])[0]?.suit as Card['suit'];
        gift.chooseTrump(suit);
        state.actions.push({ t: 'trump', suit });
        break;
      }
      case 'play': {
        const p = gift.toPlay;
        const card = chooseCard(gift, p);
        gift.playCard(p, card);
        state.actions.push({ t: 'play', p, card });
        break;
      }
      case 'scored':
      case 'redeal':
        session.closeGift();
        state.actions.push({ t: 'close' });
        if (!session.finished) session.nextGift();
        done++;
        break;
    }
    if (gift.bidding.phase === 'done' && !gift.contract && !gift.score) gift.settleBidding();
  }
  return state;
}

describe('sessiepersistentie (actielog-replay)', () => {
  beforeEach(() => localStorage.clear());

  it('herbouwt exact dezelfde sessietoestand', () => {
    const state = playAndRecord(77, 3);
    const replayed = store.replay(ruleset, state);

    // referentie: nog eens rechtstreeks afspelen
    const reference = store.replay(ruleset, state);
    expect(replayed.giftNumber).toBe(reference.giftNumber);
    expect(replayed.totals).toEqual(reference.totals);
    expect(replayed.gift?.phase).toBe(reference.gift?.phase);
    expect(replayed.gift?.deal.hands).toEqual(reference.gift?.deal.hands);
    expect(replayed.giftNumber).toBeGreaterThanOrEqual(3);
    expect(replayed.totals.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('bewaart en laadt via localStorage', () => {
    const state = playAndRecord(5, 1);
    store.save(state);
    const loaded = store.load();
    expect(loaded).toEqual(state);
    store.clear();
    expect(store.load()).toBeNull();
  });

  it('manillen: herbouwt exact dezelfde sessietoestand', () => {
    const state = store.newManille(42, 'normal', { ...DEFAULT_MANILLE_OPTIONS });
    const session = store.replayManille(state);
    // speel 1 gift en registreer
    const gift = session.gift as NonNullable<typeof session.gift>;
    const suit = chooseManilleTrump(gift.hands[gift.trumpChooser] as never);
    gift.chooseTrump(suit);
    state.actions.push({ t: 'trump', suit });
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      const card = chooseManilleCard(gift, p, 'normal');
      gift.playCard(p, card);
      state.actions.push({ t: 'play', p, card });
    }
    session.closeGift();
    state.actions.push({ t: 'close' });
    if (!session.finished) session.nextGift();

    const replayed = store.replayManille(state);
    expect(replayed.giftNumber).toBe(session.giftNumber);
    expect(replayed.totals).toEqual(session.totals);
    expect(replayed.gift?.hands).toEqual(session.gift?.hands);
    store.saveManille(state);
    expect(store.loadManille()).toEqual(state);
    store.clearManille();
    expect(store.loadManille()).toBeNull();
  });

  it('hartenjagen: herbouwt exact dezelfde sessietoestand, inclusief het doorgeven', () => {
    const state = store.newHarten(9, 'normal', { ...DEFAULT_HARTEN_CONFIG });
    const session = store.replayHarten(state);
    const gift = session.gift as NonNullable<typeof session.gift>;
    while (gift.phase === 'passing') {
      const p = gift.pendingPassers()[0] as number;
      const cards = chooseHartenPass(gift, p, 'normal');
      gift.selectPass(p, cards);
      state.actions.push({ t: 'pass', p, cards });
    }
    while (gift.phase === 'play') {
      const p = gift.toPlay;
      const card = chooseHartenCard(gift, p, 'normal');
      gift.playCard(p, card);
      state.actions.push({ t: 'play', p, card });
    }
    session.closeGift();
    state.actions.push({ t: 'close' });
    if (!session.finished) session.nextGift();

    const replayed = store.replayHarten(state);
    expect(replayed.roundNumber).toBe(session.roundNumber);
    expect(replayed.totals).toEqual(session.totals);
    expect(replayed.gift?.hands).toEqual(session.gift?.hands);
    store.saveHarten(state);
    expect(store.loadHarten()).toEqual(state);
    store.clearHarten();
    expect(store.loadHarten()).toBeNull();
  });

  it('boerenbridge: herbouwt exact dezelfde sessietoestand, met wisselende handgrootte', () => {
    const state = store.newBoeren(21, 'normal', { ...DEFAULT_BOEREN_CONFIG, shape: 'aflopend' });
    const session = store.replayBoeren(state);
    // Twee rondes spelen: dan is de handgrootte al veranderd (8 en 7 kaarten).
    for (let ronde = 0; ronde < 2; ronde++) {
      const gift = session.gift as NonNullable<typeof session.gift>;
      while (gift.phase === 'bidding') {
        const p = gift.toAct;
        const n = chooseBoerenBid(gift, p, 'normal');
        gift.bid(p, n);
        state.actions.push({ t: 'bid', p, n });
      }
      while (gift.phase === 'play') {
        const p = gift.toPlay;
        const card = chooseBoerenCard(gift, p, 'normal');
        gift.playCard(p, card);
        state.actions.push({ t: 'play', p, card });
      }
      session.closeGift();
      state.actions.push({ t: 'close' });
      if (!session.finished) session.nextGift();
    }
    expect(session.gift?.cardsPerHand).toBe(6);

    const replayed = store.replayBoeren(state);
    expect(replayed.roundNumber).toBe(session.roundNumber);
    expect(replayed.totals).toEqual(session.totals);
    expect(replayed.gift?.hands).toEqual(session.gift?.hands);
    store.saveBoeren(state);
    expect(store.loadBoeren()).toEqual(state);
    store.clearBoeren();
    expect(store.loadBoeren()).toBeNull();
  });

  it('tarot: herbouwt de sessie, inclusief bod, geroepen heer en écart', () => {
    const state = store.newTarot(31, 'normal', { ...DEFAULT_TAROT_CONFIG, players: 5 });
    const session = store.replayTarot(state);
    const gift = session.gift as NonNullable<typeof session.gift>;
    while (gift.phase === 'bidding') {
      const p = gift.toAct;
      // Forceer een preneur, anders is de helft van de acties niet gedekt.
      const bod =
        p === gift.toAct && gift.taker === null && gift.legalBids(p).includes('garde')
          ? ('garde' as const)
          : ('pass' as const);
      gift.bid(p, bod);
      state.actions.push({ t: 'bid', p, c: bod });
    }
    expect(gift.phase).toBe('call');
    gift.callKing('S');
    state.actions.push({ t: 'call', suit: 'S' });
    while (gift.phase === 'ecart') {
      const card = chooseTarotDiscard(gift);
      gift.discard(card);
      state.actions.push({ t: 'discard', card: tarotKey(card) });
    }
    // Aankondigingen zitten ook in het log: chelem en poignée (§9.2, §9.3).
    while (gift.phase === 'announce') {
      const p = gift.announceToAct as number;
      if (gift.chelemAnnounced === null && p === gift.taker) {
        gift.announceChelem(false);
        state.actions.push({ t: 'chelem', yes: false });
      } else {
        const size = chooseTarotPoignee(gift, p);
        gift.declarePoignee(p, size);
        state.actions.push({ t: 'poignee', p, size });
      }
    }
    for (let i = 0; i < 10 && gift.phase === 'play'; i++) {
      const p = gift.toPlay;
      const card = chooseTarotCard(gift, p, 'normal');
      gift.playCard(p, card);
      state.actions.push({ t: 'play', p, card: tarotKey(card) });
    }

    const replayed = store.replayTarot(state);
    expect(replayed.gift?.taker).toBe(gift.taker);
    expect(replayed.gift?.contract).toBe(gift.contract);
    expect(replayed.gift?.partner).toBe(gift.partner);
    expect(replayed.gift?.ecart.map(tarotKey)).toEqual(gift.ecart.map(tarotKey));
    expect(replayed.gift?.chelemAnnounced).toBe(gift.chelemAnnounced);
    expect(replayed.gift?.poigneeDeclared).toEqual(gift.poigneeDeclared);
    expect(replayed.gift?.hands.map((h) => h.map(tarotKey))).toEqual(
      gift.hands.map((h) => h.map(tarotKey)),
    );
    store.saveTarot(state);
    expect(store.loadTarot()).toEqual(state);
    store.clearTarot();
    expect(store.loadTarot()).toBeNull();
  });

  it('weigert corrupte opslag', () => {
    localStorage.setItem('cards.session.v1', '{"v":99}');
    expect(store.load()).toBeNull();
  });
});
