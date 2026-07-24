// Sessiepersistentie via actielog-replay: de engine is deterministisch
// (seed + acties), dus we bewaren enkel de seed en elke gespeelde actie.
// Bij het laden wordt de sessie exact heropgebouwd.

import { mulberry32, type Card, type Suit } from './engine/cards';
import { ManilleSession } from './engine/manille';
import { BiedenSession } from './engine/bieden';
import { Session } from './engine/game';
import type { BidAction } from './engine/bidding';
import type { Ruleset } from './ruleset';
import type { BotLevel } from './bots';
import {
  buildWiezenRuleset,
  DEFAULT_MANILLE_OPTIONS,
  DEFAULT_WIEZEN_OPTIONS,
  isManilleOptions,
  isWiezenOptions,
  type ManilleOptions,
  type WiezenOptions,
} from './options';

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
  options: WiezenOptions;
  actions: SessionAction[];
}

export function newPersisted(
  rulesetId: string,
  seed: number,
  botLevel: BotLevel,
  options: WiezenOptions,
): PersistedSession {
  return { v: 1, rulesetId, seed, botLevel, options, actions: [] };
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
    // Oudere opslag zonder opties: val terug op de defaults.
    if (!isWiezenOptions(state.options)) state.options = { ...DEFAULT_WIEZEN_OPTIONS };
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

/** Herbouw een sessie door het actielog af te spelen op de effectieve ruleset
 *  (basis-ruleset + gekozen opties). Gooit bij corrupt log. */
export function replay(ruleset: Ruleset, state: PersistedSession): Session {
  const effective = buildWiezenRuleset(ruleset, state.options);
  const session = new Session(effective, mulberry32(state.seed));
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

/* ---------- manillen (zelfde actielog-principe) ---------- */

const MANILLE_KEY = 'carts.manille.v1';

export type ManilleAction =
  { t: 'trump'; suit: Suit | null } | { t: 'play'; p: number; card: Card } | { t: 'close' };

export interface PersistedManille {
  v: 1;
  seed: number;
  botLevel: BotLevel;
  options: ManilleOptions;
  actions: ManilleAction[];
}

export function newManille(
  seed: number,
  botLevel: BotLevel,
  options: ManilleOptions,
): PersistedManille {
  return { v: 1, seed, botLevel, options, actions: [] };
}

export function saveManille(state: PersistedManille): void {
  try {
    localStorage.setItem(MANILLE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadManille(): PersistedManille | null {
  try {
    const raw = localStorage.getItem(MANILLE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedManille;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    if (!isManilleOptions(state.options)) state.options = { ...DEFAULT_MANILLE_OPTIONS };
    return state;
  } catch {
    return null;
  }
}

export function clearManille(): void {
  try {
    localStorage.removeItem(MANILLE_KEY);
  } catch {
    /* ignore */
  }
}

export function replayManille(state: PersistedManille): ManilleSession {
  const session = new ManilleSession(mulberry32(state.seed), 0, {
    pointModel: state.options.pointModel,
    trumpMode: state.options.trumpMode,
    multipliers: state.options.multipliers,
    maatLigt: state.options.maatLigt,
    targetPoints: state.options.targetPoints,
  });
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'trump':
        gift.chooseTrump(action.suit);
        break;
      case 'play':
        gift.playCard(action.p, action.card);
        break;
      case 'close':
        session.closeGift();
        if (!session.finished) session.nextGift();
        break;
    }
  }
  return session;
}

/* ---------- bieden (zelfde actielog-principe) ---------- */

const BIEDEN_KEY = 'carts.bieden.v1';

export type BiedenAction =
  | { t: 'bid'; p: number; bid: number | null }
  | { t: 'play'; p: number; card: Card }
  | { t: 'close' };

export interface PersistedBieden {
  v: 1;
  seed: number;
  botLevel: BotLevel;
  actions: BiedenAction[];
}

export function newBieden(seed: number, botLevel: BotLevel): PersistedBieden {
  return { v: 1, seed, botLevel, actions: [] };
}

export function saveBieden(state: PersistedBieden): void {
  try {
    localStorage.setItem(BIEDEN_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadBieden(): PersistedBieden | null {
  try {
    const raw = localStorage.getItem(BIEDEN_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedBieden;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    return state;
  } catch {
    return null;
  }
}

export function clearBieden(): void {
  try {
    localStorage.removeItem(BIEDEN_KEY);
  } catch {
    /* ignore */
  }
}

export function replayBieden(state: PersistedBieden): BiedenSession {
  const session = new BiedenSession(mulberry32(state.seed));
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'bid':
        gift.bidding.act(action.p, action.bid);
        break;
      case 'play':
        if (gift.declarer === null) gift.settle();
        gift.playCard(action.p, action.card);
        break;
      case 'close':
        session.closeGift();
        if (!session.finished) session.nextGift();
        break;
    }
    if (gift.bidding.phase === 'done' && gift.declarer === null && !gift.score) gift.settle();
  }
  return session;
}
