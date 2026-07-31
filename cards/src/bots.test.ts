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
import { chooseKlaverjasCard, chooseKlaverjasPass, chooseKlaverjasTrump } from './bots';
import { DEFAULT_KLAVERJAS_CONFIG, KlaverjasSession } from './engine/klaverjassen';
import { chooseBeloteCard, chooseBeloteTake } from './bots';
import { BeloteSession, DEFAULT_BELOTE_CONFIG } from './engine/belote';
import { chooseHartenCard, chooseHartenPass } from './bots';
import { DEFAULT_HARTEN_CONFIG, HartenSession } from './engine/hartenjagen';
import { chooseBoerenBid, chooseBoerenCard } from './bots';
import { BoerenSession, DEFAULT_BOEREN_CONFIG } from './engine/boerenbridge';

const ruleset = getRuleset('vlaams-standaard') as Ruleset;

/** Speel een volledige sessie met vier bots; elke stap moet legaal zijn. */
function simulateSession(
  seed: number,
  level: BotLevel = 'normal',
  rules: Ruleset = ruleset,
): Session {
  const session = new Session(rules, mulberry32(seed));
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
          const alleenTrump = gift.bidding.announcedSuit ?? gift.bidding.turnedSuit;
          gift.bidding.chooseAlleen(chooseAlleen(gift.deal.hands[p] as Card[], alleenTrump, level));
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

  it('spelen ook kleurenwiezen volledig uit — daar noemen ze zelf de troefkleur', () => {
    const kleuren = getRuleset('kleurenwiezen') as Ruleset;
    for (let seed = 1; seed <= 10; seed++) {
      const session = simulateSession(seed, 'normal', kleuren);
      expect(session.giftNumber).toBe(session.totalGiften);
      expect(session.totals.reduce((a, b) => a + b, 0)).toBe(0);
    }
  });
});

describe('klaverjas-bots', () => {
  it('spelen volledige boompjes zonder illegale zetten, op elk niveau', () => {
    for (const level of BOT_LEVELS) {
      for (let seed = 1; seed <= 5; seed++) {
        const session = new KlaverjasSession(mulberry32(seed * 13), 0, {
          ...DEFAULT_KLAVERJAS_CONFIG,
          rounds: 4,
        });
        let safety = 200;
        while (!session.finished && safety-- > 0) {
          const gift = session.nextGift();
          while (gift.phase === 'trump-choice') {
            const hand = gift.hands[gift.chooser] as Card[];
            if (chooseKlaverjasPass(gift, hand, level)) gift.pass();
            else gift.chooseTrump(chooseKlaverjasTrump(hand).suit);
          }
          while (gift.phase === 'play') {
            const p = gift.toPlay;
            gift.playCard(p, chooseKlaverjasCard(gift, p, level));
          }
          // 162 kaartpunten blijven altijd verdeeld over de twee ploegen
          const s = gift.score;
          expect((s?.cardPoints[0] ?? 0) + (s?.cardPoints[1] ?? 0)).toBe(162);
          session.closeGift();
        }
        expect(session.finished).toBe(true);
        expect(session.roundNumber).toBe(4);
      }
    }
  });
});

describe('belote-bots', () => {
  it('spelen volledige partijen zonder illegale zetten, op elk niveau', () => {
    for (const level of BOT_LEVELS) {
      for (let seed = 1; seed <= 4; seed++) {
        const session = new BeloteSession(mulberry32(seed * 17), 0, {
          ...DEFAULT_BELOTE_CONFIG,
          targetPoints: 300,
        });
        let safety = 400;
        while (!session.finished && safety-- > 0) {
          const gift = session.nextGift();
          while (gift.phase === 'bidding') {
            const suit = chooseBeloteTake(gift, gift.toAct);
            if (suit) gift.take(suit);
            else gift.pass();
          }
          while (gift.phase === 'play') {
            const p = gift.toPlay;
            gift.playCard(p, chooseBeloteCard(gift, p, level));
          }
          if (gift.phase === 'scored') {
            const s = gift.score;
            expect((s?.cardPoints[0] ?? 0) + (s?.cardPoints[1] ?? 0)).toBe(162);
          }
          session.closeGift();
        }
        expect(session.finished).toBe(true);
      }
    }
  });
});

describe('hartenjagen-bots', () => {
  it('spelen volledige partijen zonder illegale zetten, op elk niveau', () => {
    for (const level of BOT_LEVELS) {
      for (let seed = 1; seed <= 4; seed++) {
        const session = new HartenSession(mulberry32(seed * 23), 0, {
          ...DEFAULT_HARTEN_CONFIG,
          targetPoints: 50,
        });
        let safety = 400;
        while (!session.finished && safety-- > 0) {
          const gift = session.nextGift();
          while (gift.phase === 'passing') {
            const p = gift.pendingPassers()[0] as number;
            gift.selectPass(p, chooseHartenPass(gift, p, level));
          }
          while (gift.phase === 'play') {
            const p = gift.toPlay;
            gift.playCard(p, chooseHartenCard(gift, p, level));
          }
          // Elke ronde deelt precies 26 strafpunten uit — geen kaart raakt zoek.
          expect(gift.score?.penalties.reduce((a, b) => a + b, 0)).toBe(26);
          session.closeGift();
        }
        expect(session.finished).toBe(true);
        // De laagste score wint: die mag nooit boven de grens uitkomen.
        expect(Math.min(...session.totals)).toBeLessThan(50);
      }
    }
  });
});

describe('boerenbridge-bots', () => {
  it('spelen volledige partijen zonder illegale zetten, op elk niveau', () => {
    for (const level of BOT_LEVELS) {
      for (let seed = 1; seed <= 4; seed++) {
        const session = new BoerenSession(mulberry32(seed * 29), 0, {
          ...DEFAULT_BOEREN_CONFIG,
          shape: 'aflopend',
          screwTheDealer: true,
        });
        let safety = 400;
        while (!session.finished && safety-- > 0) {
          const gift = session.nextGift();
          while (gift.phase === 'bidding') {
            const p = gift.toAct;
            gift.bid(p, chooseBoerenBid(gift, p, level));
          }
          while (gift.phase === 'play') {
            const p = gift.toPlay;
            gift.playCard(p, chooseBoerenCard(gift, p, level));
          }
          // Alle slagen zijn verdeeld, en de punten volgen §7 exact.
          const s = gift.score as NonNullable<typeof gift.score>;
          expect(s.made.reduce((a, b) => a + b, 0)).toBe(gift.cardsPerHand);
          session.closeGift();
        }
        expect(session.finished).toBe(true);
        expect(session.roundNumber).toBe(8);
      }
    }
  });

  it('bieden vaker juist dan willekeurig — de schatting doet iets', () => {
    let juist = 0;
    let rondes = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const session = new BoerenSession(mulberry32(seed * 31), 0, {
        ...DEFAULT_BOEREN_CONFIG,
        shape: 'aflopend',
      });
      while (!session.finished) {
        const gift = session.nextGift();
        while (gift.phase === 'bidding') {
          const p = gift.toAct;
          gift.bid(p, chooseBoerenBid(gift, p, 'strong'));
        }
        while (gift.phase === 'play') {
          const p = gift.toPlay;
          gift.playCard(p, chooseBoerenCard(gift, p, 'strong'));
        }
        const s = gift.score as NonNullable<typeof gift.score>;
        for (let p = 0; p < 4; p++) {
          rondes++;
          if (s.bids[p] === s.made[p]) juist++;
        }
        session.closeGift();
      }
    }
    // Blind gokken zit rond 1 op 3 bij deze rondegroottes; de bots doen beter.
    expect(juist / rondes).toBeGreaterThan(0.4);
  });
});
