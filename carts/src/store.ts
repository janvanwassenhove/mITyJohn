// Sessiepersistentie via actielog-replay: de engine is deterministisch
// (seed + acties), dus we bewaren enkel de seed en elke gespeelde actie.
// Bij het laden wordt de sessie exact heropgebouwd.

import { mulberry32, type Card, type Suit } from './engine/cards';
import { Session } from './engine/game';
import type { BidAction } from './engine/bidding';
import type { Ruleset } from './ruleset';
import type { BotLevel } from './bots';

const STORAGE_KEY = 'carts.session.v1';

export type SessionAction =
  | { t: 'bid'; p: number; a: BidAction }
  | { t: 'alleen'; accept: boolean }
  | { t: 'trump'; suit: Suit }
  | { t: 'play'; p: number; card: Card }
  | { t: 'close' };

export interface PersistedSession {
  v: 1;
  rulesetId: string;
  seed: number;
  botLevel: BotLevel;
  actions: SessionAction[];
}

export function newPersisted(
  rulesetId: string,
  seed: number,
  botLevel: BotLevel,
): PersistedSession {
  return { v: 1, rulesetId, seed, botLevel, actions: [] };
}

export function save(state: PersistedSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* opslag vol of geblokkeerd — spel blijft gewoon werken */
  }
}

export function load(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedSession;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    return state;
  } catch {
    return null;
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Herbouw een sessie door het actielog af te spelen. Gooit bij corrupt log. */
export function replay(ruleset: Ruleset, state: PersistedSession): Session {
  const session = new Session(ruleset, mulberry32(state.seed));
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'bid':
        gift.bidding.act(action.p, action.a);
        break;
      case 'alleen':
        gift.bidding.chooseAlleen(action.accept);
        break;
      case 'trump':
        gift.settleBidding();
        gift.chooseTrump(action.suit);
        break;
      case 'play':
        if (!gift.contract) gift.settleBidding();
        gift.playCard(action.p, action.card);
        break;
      case 'close':
        session.closeGift();
        if (!session.finished) session.nextGift();
        break;
    }
    if (gift.bidding.phase === 'done' && !gift.contract && !gift.score) {
      gift.settleBidding();
    }
  }
  return session;
}
