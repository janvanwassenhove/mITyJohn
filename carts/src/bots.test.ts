import { describe, expect, it } from 'vitest';
import { mulberry32, type Card } from './engine/cards';
import { Session } from './engine/game';
import { chooseAlleen, chooseBid, chooseCard, chooseTrumpSuit } from './bots';
import { getRuleset, type Ruleset } from './ruleset';

const ruleset = getRuleset('vlaams-standaard') as Ruleset;

/** Speel een volledige sessie met vier bots; elke stap moet legaal zijn. */
function simulateSession(seed: number): Session {
  const session = new Session(ruleset, mulberry32(seed));
  let safety = 100_000;
  while (!session.finished) {
    const gift = session.gift ?? session.nextGift();
    while (gift.phase !== 'scored' && gift.phase !== 'redeal') {
      if (--safety <= 0) throw new Error('Simulatie loopt vast');
      switch (gift.phase) {
        case 'bidding': {
          const p = gift.bidding.toAct;
          gift.bidding.act(p, chooseBid(gift.bidding, p, gift.deal.hands[p] as Card[]));
          break;
        }
        case 'alleen-choice': {
          const p = gift.bidding.current?.declarers[0] as number;
          gift.bidding.chooseAlleen(
            chooseAlleen(gift.deal.hands[p] as Card[], gift.bidding.turnedSuit),
          );
          break;
        }
        case 'trump-choice': {
          const p = gift.trumpChooser as number;
          gift.chooseTrump(chooseTrumpSuit(gift.deal.hands[p] as Card[]));
          break;
        }
        case 'play': {
          const p = gift.toPlay;
          gift.playCard(p, chooseCard(gift, p));
          break;
        }
      }
      if (gift.bidding.phase === 'done' && !gift.contract) gift.settleBidding();
    }
    session.closeGift();
  }
  return session;
}

describe('bots', () => {
  it('spelen tientallen volledige sessies zonder illegale zetten, zero-sum', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const session = simulateSession(seed);
      expect(session.giftNumber).toBe(session.totalGiften);
      expect(session.totals.reduce((a, b) => a + b, 0)).toBe(0);
    }
  });
});
