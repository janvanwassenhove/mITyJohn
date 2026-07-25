import { beforeEach, describe, expect, it } from 'vitest';
import { handStrength, loadCoachEnabled, saveCoachEnabled, wiezenTip, WIZARD_STEPS } from './coach';
import { mulberry32, type Card, type Suit } from './engine/cards';
import { Session } from './engine/game';
import { getRuleset, type Ruleset } from './ruleset';

const ruleset = getRuleset('vlaams-standaard') as Ruleset;
const card = (suit: Suit, rank: number): Card => ({ suit, rank: rank as Card['rank'] });

describe('coach', () => {
  beforeEach(() => localStorage.clear());

  it('staat standaard aan en onthoudt uitschakelen', () => {
    expect(loadCoachEnabled()).toBe(true);
    saveCoachEnabled(false);
    expect(loadCoachEnabled()).toBe(false);
    saveCoachEnabled(true);
    expect(loadCoachEnabled()).toBe(true);
  });

  it('berekent handsterkte in honneurs', () => {
    expect(handStrength([card('S', 14), card('H', 13), card('D', 2)])).toBe(7); // 4 + 3 + 0
    expect(handStrength([card('C', 7), card('C', 8)])).toBe(0);
  });

  it('elk spel heeft wizardstappen', () => {
    expect(WIZARD_STEPS.wiezen).toBeGreaterThan(0);
    expect(WIZARD_STEPS.manille).toBeGreaterThan(0);
    expect(WIZARD_STEPS.bieden).toBeGreaterThan(0);
  });

  it('geeft een biedtip wanneer je aan zet bent, en niets als een ander speelt', () => {
    const session = new Session(ruleset, mulberry32(3));
    const gift = session.nextGift();
    const active = gift.bidding.toAct;
    const other = (active + 1) % 4;
    expect(wiezenTip(gift, active)).not.toBeNull();
    expect(wiezenTip(gift, other)).toBeNull();
  });

  it('waarschuwt voor volgplicht zodra er een kaart op tafel ligt', () => {
    const session = new Session(ruleset, mulberry32(11));
    const gift = session.nextGift();
    const b = gift.bidding;
    // forceer een gewoon contract zodat er gespeeld wordt
    if (!b.troel) {
      b.act(b.toAct, { type: 'bid', contractId: 'vraag-en-mee' });
      b.act(b.toAct, { type: 'join' });
    }
    while (b.phase === 'bidding') b.act(b.toAct, { type: 'pass' });
    if (b.phase === 'alleen-choice') b.chooseAlleen(true);
    gift.settleBidding();
    if (gift.phase === 'trump-choice' && gift.trumpChooser !== null) {
      gift.chooseTrump((gift.deal.hands[gift.trumpChooser]?.[0] as Card).suit);
    }
    // uitkomer krijgt een 'lead'-tip
    const leader = gift.toPlay;
    const leadTip = wiezenTip(gift, leader);
    expect(['lead', 'leadSetsTrump']).toContain(leadTip?.id);
    // na de eerste kaart krijgt de volgende speler volg-advies
    gift.playCard(leader, gift.legalCards(leader)[0] as Card);
    const next = gift.toPlay;
    expect(['mustFollow', 'cannotFollow']).toContain(wiezenTip(gift, next)?.id);
  });
});
