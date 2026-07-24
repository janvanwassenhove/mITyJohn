import { beforeEach, describe, expect, it } from 'vitest';
import { mulberry32, type Card } from './engine/cards';
import { Session } from './engine/game';
import { chooseBid, chooseCard } from './bots';
import * as store from './store';
import { getRuleset, type Ruleset } from './ruleset';

const ruleset = getRuleset('vlaams-standaard') as Ruleset;

/** Speel N giften uit met bots en registreer elke actie zoals de UI dat doet. */
function playAndRecord(seed: number, giften: number): store.PersistedSession {
  const state = store.newPersisted(ruleset.id, seed, 'normal');
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

  it('weigert corrupte opslag', () => {
    localStorage.setItem('carts.session.v1', '{"v":99}');
    expect(store.load()).toBeNull();
  });
});
