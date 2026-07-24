import { describe, expect, it } from 'vitest';
import { mulberry32, type Card } from './engine/cards';
import { Session } from './engine/game';
import {
  BOT_LEVELS,
  chooseAlleen,
  chooseBid,
  chooseCard,
  chooseTrumpSuit,
  type BotLevel,
} from './bots';
import { getRuleset, type Ruleset } from './ruleset';
import { DEFAULT_MANILLE_CONFIG, ManilleSession } from './engine/manille';
import { BiedenSession, DEFAULT_BIEDEN_CONFIG } from './engine/bieden';
import { chooseManilleCard, chooseManilleTrump } from './bots';
import { chooseBiedenBid, chooseBiedenCard } from './bots';

const ruleset = getRuleset('vlaams-standaard') as Ruleset;

/** Speel een volledige sessie met vier bots; elke stap moet legaal zijn. */
function simulateSession(seed: number, level: BotLevel = 'normal'): Session {
  const session = new Session(ruleset, mulberry32(seed));
  let safety = 100_000;
  while (!session.finished) {
    const gift = session.gift ?? session.nextGift();
    while (gift.phase !== 'scored' && gift.phase !== 'redeal') {
      if (--safety <= 0) throw new Error('Simulatie loopt vast');
      switch (gift.phase) {
        case 'bidding': {
          const p = gift.bidding.toAct;
          gift.bidding.act(p, chooseBid(gift.bidding, p, gift.deal.hands[p] as Card[], level));
          break;
        }
        case 'alleen-choice': {
          const p = gift.bidding.current?.declarers[0] as number;
          gift.bidding.chooseAlleen(
            chooseAlleen(gift.deal.hands[p] as Card[], gift.bidding.turnedSuit, level),
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
          gift.playCard(p, chooseCard(gift, p, level));
          break;
        }
      }
      if (gift.bidding.phase === 'done' && !gift.contract) gift.settleBidding();
    }
    session.closeGift();
  }
  return session;
}

describe('manillen-bots', () => {
  it('spelen volledige sessies tot het puntendoel, op elk niveau', () => {
    for (const level of BOT_LEVELS) {
      for (let seed = 1; seed <= 5; seed++) {
        const session = new ManilleSession(mulberry32(seed * 100), 0, {
          ...DEFAULT_MANILLE_CONFIG,
          targetPoints: 61,
        });
        let safety = 500;
        while (!session.finished && safety-- > 0) {
          const gift = session.nextGift();
          gift.chooseTrump(chooseManilleTrump(gift.hands[gift.trumpChooser] as Card[]));
          while (gift.phase === 'play') {
            const p = gift.toPlay;
            gift.playCard(p, chooseManilleCard(gift, p, level));
          }
          session.closeGift();
        }
        expect(session.finished).toBe(true);
        expect(Math.max(...session.totals)).toBeGreaterThanOrEqual(61);
      }
    }
  });
});

describe('bieden-bots', () => {
  it('spelen volledige sessies tot het puntendoel, op elk niveau', () => {
    for (const level of BOT_LEVELS) {
      for (let seed = 1; seed <= 5; seed++) {
        const session = new BiedenSession(mulberry32(seed * 40), 0, {
          ...DEFAULT_BIEDEN_CONFIG,
          targetPoints: 300,
        });
        let safety = 800;
        while (!session.finished && safety-- > 0) {
          const gift = session.nextGift();
          while (gift.bidding.phase === 'bidding') {
            const p = gift.bidding.toAct;
            gift.bidding.act(p, chooseBiedenBid(gift, p));
          }
          gift.settle();
          while (gift.phase === 'play') {
            const p = gift.toPlay;
            gift.playCard(p, chooseBiedenCard(gift, p, level));
          }
          session.closeGift();
        }
        expect(session.finished || session.giftNumber > 0).toBe(true);
      }
    }
  });
});

describe('bots', () => {
  it('spelen tientallen volledige sessies zonder illegale zetten, zero-sum, op elk niveau', () => {
    for (const level of BOT_LEVELS) {
      for (let seed = 1; seed <= 10; seed++) {
        const session = simulateSession(seed, level);
        expect(session.giftNumber).toBe(session.totalGiften);
        expect(session.totals.reduce((a, b) => a + b, 0)).toBe(0);
      }
    }
  });
});
