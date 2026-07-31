// Sessiepersistentie via actielog-replay: de engine is deterministisch
// (seed + acties), dus we bewaren enkel de seed en elke gespeelde actie.
// Bij het laden wordt de sessie exact heropgebouwd.

import { mulberry32, type Card, type Suit } from './engine/cards';
import { ManilleSession } from './engine/manille';
import { BiedenSession } from './engine/bieden';
import { BeloteSession, DEFAULT_BELOTE_CONFIG, type BeloteConfig } from './engine/belote';
import { DEFAULT_HARTEN_CONFIG, HartenSession, type HartenConfig } from './engine/hartenjagen';
import { BoerenSession, DEFAULT_BOEREN_CONFIG, type BoerenConfig } from './engine/boerenbridge';
import {
  DEFAULT_TAROT_CONFIG,
  TarotSession,
  type ContractId,
  type TarotConfig,
} from './engine/tarot';
import { parseTarotCard } from './engine/tarot-cards';
import {
  DEFAULT_KLAVERJAS_CONFIG,
  KlaverjasSession,
  type KlaverjasConfig,
} from './engine/klaverjassen';
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

const STORAGE_KEY = 'cards.session.v1';

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

const MANILLE_KEY = 'cards.manille.v1';

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

const BIEDEN_KEY = 'cards.bieden.v1';

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

/* ---------- klaverjassen ---------- */

const KLAVERJAS_KEY = 'cards.klaverjas.v1';

export type KlaverjasAction =
  | { t: 'trump'; suit: Suit }
  | { t: 'pass' }
  | { t: 'play'; p: number; card: Card }
  | { t: 'close' };

export interface PersistedKlaverjas {
  v: 1;
  seed: number;
  botLevel: BotLevel;
  config: KlaverjasConfig;
  actions: KlaverjasAction[];
}

export function newKlaverjas(
  seed: number,
  botLevel: BotLevel,
  config: KlaverjasConfig,
): PersistedKlaverjas {
  return { v: 1, seed, botLevel, config, actions: [] };
}

export function saveKlaverjas(state: PersistedKlaverjas): void {
  try {
    localStorage.setItem(KLAVERJAS_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadKlaverjas(): PersistedKlaverjas | null {
  try {
    const raw = localStorage.getItem(KLAVERJAS_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedKlaverjas;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    if (!state.config || typeof state.config !== 'object') {
      state.config = { ...DEFAULT_KLAVERJAS_CONFIG };
    }
    return state;
  } catch {
    return null;
  }
}

export function clearKlaverjas(): void {
  try {
    localStorage.removeItem(KLAVERJAS_KEY);
  } catch {
    /* ignore */
  }
}

export function replayKlaverjas(state: PersistedKlaverjas): KlaverjasSession {
  const session = new KlaverjasSession(mulberry32(state.seed), 0, state.config);
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'trump':
        gift.chooseTrump(action.suit);
        break;
      case 'pass':
        gift.pass();
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

/* ---------- belote ---------- */

const BELOTE_KEY = 'cards.belote.v1';

export type BeloteAction =
  { t: 'take'; suit: Suit } | { t: 'pass' } | { t: 'play'; p: number; card: Card } | { t: 'close' };

export interface PersistedBelote {
  v: 1;
  seed: number;
  botLevel: BotLevel;
  config: BeloteConfig;
  actions: BeloteAction[];
}

export function newBelote(seed: number, botLevel: BotLevel, config: BeloteConfig): PersistedBelote {
  return { v: 1, seed, botLevel, config, actions: [] };
}

export function saveBelote(state: PersistedBelote): void {
  try {
    localStorage.setItem(BELOTE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadBelote(): PersistedBelote | null {
  try {
    const raw = localStorage.getItem(BELOTE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedBelote;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    if (!state.config || typeof state.config !== 'object') {
      state.config = { ...DEFAULT_BELOTE_CONFIG };
    }
    return state;
  } catch {
    return null;
  }
}

export function clearBelote(): void {
  try {
    localStorage.removeItem(BELOTE_KEY);
  } catch {
    /* ignore */
  }
}

export function replayBelote(state: PersistedBelote): BeloteSession {
  const session = new BeloteSession(mulberry32(state.seed), 0, state.config);
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'take':
        gift.take(action.suit);
        break;
      case 'pass':
        gift.pass();
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

/* ---------- hartenjagen ---------- */

const HARTEN_KEY = 'cards.harten.v1';

export type HartenAction =
  { t: 'pass'; p: number; cards: Card[] } | { t: 'play'; p: number; card: Card } | { t: 'close' };

export interface PersistedHarten {
  v: 1;
  seed: number;
  botLevel: BotLevel;
  config: HartenConfig;
  actions: HartenAction[];
}

export function newHarten(seed: number, botLevel: BotLevel, config: HartenConfig): PersistedHarten {
  return { v: 1, seed, botLevel, config, actions: [] };
}

export function saveHarten(state: PersistedHarten): void {
  try {
    localStorage.setItem(HARTEN_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadHarten(): PersistedHarten | null {
  try {
    const raw = localStorage.getItem(HARTEN_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedHarten;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    if (!state.config || typeof state.config !== 'object') {
      state.config = { ...DEFAULT_HARTEN_CONFIG };
    }
    return state;
  } catch {
    return null;
  }
}

export function clearHarten(): void {
  try {
    localStorage.removeItem(HARTEN_KEY);
  } catch {
    /* ignore */
  }
}

export function replayHarten(state: PersistedHarten): HartenSession {
  const session = new HartenSession(mulberry32(state.seed), 0, state.config);
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'pass':
        gift.selectPass(action.p, action.cards);
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

/* ---------- boerenbridge ---------- */

const BOEREN_KEY = 'cards.boeren.v1';

export type BoerenAction =
  { t: 'bid'; p: number; n: number } | { t: 'play'; p: number; card: Card } | { t: 'close' };

export interface PersistedBoeren {
  v: 1;
  seed: number;
  botLevel: BotLevel;
  config: BoerenConfig;
  actions: BoerenAction[];
}

export function newBoeren(seed: number, botLevel: BotLevel, config: BoerenConfig): PersistedBoeren {
  return { v: 1, seed, botLevel, config, actions: [] };
}

export function saveBoeren(state: PersistedBoeren): void {
  try {
    localStorage.setItem(BOEREN_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadBoeren(): PersistedBoeren | null {
  try {
    const raw = localStorage.getItem(BOEREN_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedBoeren;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    if (!state.config || typeof state.config !== 'object') {
      state.config = { ...DEFAULT_BOEREN_CONFIG };
    }
    return state;
  } catch {
    return null;
  }
}

export function clearBoeren(): void {
  try {
    localStorage.removeItem(BOEREN_KEY);
  } catch {
    /* ignore */
  }
}

export function replayBoeren(state: PersistedBoeren): BoerenSession {
  const session = new BoerenSession(mulberry32(state.seed), 0, state.config);
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'bid':
        gift.bid(action.p, action.n);
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

/* ---------- frans tarot ---------- */

const TAROT_KEY = 'cards.tarot.v1';

/** Tarotkaarten gaan als sleutel het log in ("T21", "S14", "EX") — compacter dan
 *  een object, en meteen bestand tegen een gewijzigd kaartmodel. */
export type TarotAction =
  | { t: 'bid'; p: number; c: ContractId | 'pass' }
  | { t: 'call'; suit: Suit }
  | { t: 'discard'; card: string }
  | { t: 'play'; p: number; card: string }
  | { t: 'close' };

export interface PersistedTarot {
  v: 1;
  seed: number;
  botLevel: BotLevel;
  config: TarotConfig;
  actions: TarotAction[];
}

export function newTarot(seed: number, botLevel: BotLevel, config: TarotConfig): PersistedTarot {
  return { v: 1, seed, botLevel, config, actions: [] };
}

export function saveTarot(state: PersistedTarot): void {
  try {
    localStorage.setItem(TAROT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadTarot(): PersistedTarot | null {
  try {
    const raw = localStorage.getItem(TAROT_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PersistedTarot;
    if (state.v !== 1 || !Array.isArray(state.actions)) return null;
    if (!state.config || typeof state.config !== 'object') {
      state.config = { ...DEFAULT_TAROT_CONFIG };
    }
    return state;
  } catch {
    return null;
  }
}

export function clearTarot(): void {
  try {
    localStorage.removeItem(TAROT_KEY);
  } catch {
    /* ignore */
  }
}

export function replayTarot(state: PersistedTarot): TarotSession {
  const session = new TarotSession(mulberry32(state.seed), 0, state.config);
  session.nextGift();
  for (const action of state.actions) {
    const gift = session.gift;
    if (!gift) throw new Error('Actie na einde sessie');
    switch (action.t) {
      case 'bid':
        gift.bid(action.p, action.c);
        break;
      case 'call':
        gift.callKing(action.suit);
        break;
      case 'discard':
        gift.discard(parseTarotCard(action.card));
        break;
      case 'play':
        gift.playCard(action.p, parseTarotCard(action.card));
        break;
      case 'close':
        session.closeGift();
        if (!session.finished) session.nextGift();
        break;
    }
  }
  return session;
}
