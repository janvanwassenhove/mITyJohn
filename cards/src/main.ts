import './styles.css';
import { migrateStorageKeys } from './migrate';
import {
  LOCALES,
  detectLocale,
  getLocale,
  onLocaleChange,
  setLocale,
  t,
  type MessageKey,
} from './i18n';
import { THEMES, applyTheme, getTheme, initTheme, type Theme } from './theme';
import { getRuleset, rulesets, type Ruleset } from './ruleset';
import { sortHand, type Card, type Suit } from './engine/cards';
import { SUITS } from './engine/cards';
import { PLAYER_COUNT } from './engine/deal';
import type { Session } from './engine/game';
import { type Gift } from './engine/game';
import type { BidAction } from './engine/bidding';
import {
  BOT_LEVELS,
  chooseAlleen,
  chooseBid,
  chooseCard,
  chooseTrumpSuit,
  type BotLevel,
} from './bots';
import * as store from './store';
import * as sbw from './scorebord-wiezen';
import { strength, teamOf, type ManilleGift } from './engine/manille';
import type { ManilleSession } from './engine/manille';
import { chooseManilleCard, chooseManilleTrump } from './bots';
import { chooseKlaverjasCard, chooseKlaverjasPass, chooseKlaverjasTrump } from './bots';
import { chooseBeloteCard, chooseBeloteTake } from './bots';
import { chooseHartenCard, chooseHartenPass } from './bots';
import { chooseBoerenBid, chooseBoerenCard } from './bots';
import { chooseTarotBid, chooseTarotCall, chooseTarotCard, chooseTarotDiscard } from './bots';
import {
  CONTRACTS as TAROT_CONTRACTS,
  DEFAULT_TAROT_CONFIG,
  type PlayerCount,
  type TarotConfig,
  type TarotGift,
  type TarotSession,
} from './engine/tarot';
import {
  countBouts,
  formatHalfPoints,
  sortTarotHand,
  tarotKey,
  type TarotCard,
} from './engine/tarot-cards';
import {
  DEFAULT_BOEREN_CONFIG,
  type BoerenConfig,
  type BoerenGift,
  type BoerenSession,
} from './engine/boerenbridge';
import {
  DEFAULT_HARTEN_CONFIG,
  PASS_COUNT,
  TOTAL_PENALTY,
  type HartenConfig,
  type HartenGift,
  type HartenSession,
} from './engine/hartenjagen';
import {
  DEFAULT_BELOTE_CONFIG,
  teamOf as blTeamOf,
  type Annonce,
  type BeloteConfig,
  type BeloteGift,
  type BeloteSession,
} from './engine/belote';
import {
  DEFAULT_KLAVERJAS_CONFIG,
  teamOf as kTeamOf,
  type KlaverjasConfig,
  type KlaverjasGift,
  type KlaverjasSession,
  type RoemDetail,
} from './engine/klaverjassen';
import { teamOf as biedenTeamOf, type BiedenGift, type BiedenSession } from './engine/bieden';
import { chooseBiedenBid, chooseBiedenCard } from './bots';
import { initSound, sfxCard, sfxScore, sfxTrick, soundEnabled, toggleSound } from './sound';
import { clearStats, loadStats, recordGiftStat, recordSessionStat } from './stats';
import * as scorebord from './scorebord';
import {
  GUIDE_CHAPTERS,
  chapterForGame,
  getChapter,
  nextChapter,
  type GuideChapterId,
} from './guide';
import {
  WIZARD_STEPS,
  biedenTip,
  boerenTip,
  hartenTip,
  tarotTip,
  loadCoachEnabled,
  klaverjasTip,
  manilleTip,
  saveCoachEnabled,
  wiezenTip,
  type CoachTip,
} from './coach';
import {
  DEFAULT_MANILLE_OPTIONS,
  DEFAULT_WIEZEN_OPTIONS,
  isManilleOptions,
  isWiezenOptions,
  type ManilleOptions,
  type WiezenOptions,
} from './options';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app ontbreekt');

const RULESET_KEY = 'cards.ruleset';
let ruleset = getRuleset('vlaams-standaard') as Ruleset;
let view: 'home' | 'game' | 'stats' | 'scorebord' | 'wizard' | 'guide' = 'home';

// Coach & starterswizard.
let coachOn = loadCoachEnabled();
let wizardStep = 0;

// Regelgids: null = inhoudsopgave, anders het geopende hoofdstuk.
let guideChapter: GuideChapterId | null = null;
let guideStep = 0;

function openGuide(chapter: GuideChapterId | null): void {
  guideChapter = chapter;
  guideStep = 0;
  view = 'guide';
  render();
}

function setCoach(on: boolean): void {
  coachOn = on;
  saveCoachEnabled(on);
  render();
}

// Scorebord (fysiek spel): actief bord + setup-invoer.
let sbBoard: scorebord.Scorebord | null = null;
const SB_MODE_KEY = 'cards.scorebordMode';
let sbMode: scorebord.ScorebordMode = 'manueel';

function saveScorebordMode(): void {
  try {
    localStorage.setItem(SB_MODE_KEY, sbMode);
  } catch {
    /* ignore */
  }
}
let sbCount = 4;
let sbNames: string[] = [];
let sbTarget = '';
let sbLowWins = false;
// Wiezen-automodus: huidige invoer voor de volgende gift.
let sbWContract = 'vraag-en-mee';
let sbWDeclarer = 0;
let sbWPartner = 1;
let sbWTricks = '';
let sbWAceLed = true;
// Vijf stoelen: tarot speelt met 3, 4 of 5 (REGELS-TAROT.md §1).
const BOT_NAMES = ['', 'Miel', 'Rita', 'Staf', 'Lowie'];
const HUMAN = 0;
const BOT_DELAY = 650;
const TRICK_PAUSE = 1200;
const LEVEL_KEY = 'cards.botLevel';

type BidLogEntry =
  | { kind: 'pass' | 'join' | 'troel'; player: number }
  | { kind: 'bid'; player: number; contractId: string; suit?: Suit };

let session: Session | null = null;
let persisted: store.PersistedSession | null = null;
let restored: { state: store.PersistedSession; session: Session } | null = null;
let botLevel: BotLevel = 'normal';
let bidLog: BidLogEntry[] = [];
let generation = 0;

const GAME_KEY = 'cards.game';
const WIEZEN_OPTS_KEY = 'cards.wiezenOptions';
const MANILLE_OPTS_KEY = 'cards.manilleOptions';
type GameId =
  | 'wiezen'
  | 'manille'
  | 'bieden'
  | 'klaverjassen'
  | 'belote'
  | 'hartenjagen'
  | 'boerenbridge'
  | 'tarot';
let game: GameId = 'wiezen';
let hjSession: HartenSession | null = null;
let hjPersisted: store.PersistedHarten | null = null;
let hjRestored: { state: store.PersistedHarten; session: HartenSession } | null = null;
let hartenConfig: HartenConfig = { ...DEFAULT_HARTEN_CONFIG };
/** Wat de mens klaargelegd heeft om door te geven (§4) — leeg zodra geruild is. */
let hjSelected: Card[] = [];
let bbSession: BoerenSession | null = null;
let bbPersisted: store.PersistedBoeren | null = null;
let bbRestored: { state: store.PersistedBoeren; session: BoerenSession } | null = null;
let boerenConfig: BoerenConfig = { ...DEFAULT_BOEREN_CONFIG };
let ttSession: TarotSession | null = null;
let ttPersisted: store.PersistedTarot | null = null;
let ttRestored: { state: store.PersistedTarot; session: TarotSession } | null = null;
let tarotConfig: TarotConfig = { ...DEFAULT_TAROT_CONFIG };
const TAROT_PLAYERS_KEY = 'cards.tarotPlayers';
let kSession: KlaverjasSession | null = null;
let kPersisted: store.PersistedKlaverjas | null = null;
let kRestored: { state: store.PersistedKlaverjas; session: KlaverjasSession } | null = null;
let klaverjasConfig: KlaverjasConfig = { ...DEFAULT_KLAVERJAS_CONFIG };
let blSession: BeloteSession | null = null;
let blPersisted: store.PersistedBelote | null = null;
let blRestored: { state: store.PersistedBelote; session: BeloteSession } | null = null;
let beloteConfig: BeloteConfig = { ...DEFAULT_BELOTE_CONFIG };
let mSession: ManilleSession | null = null;
let mPersisted: store.PersistedManille | null = null;
let mRestored: { state: store.PersistedManille; session: ManilleSession } | null = null;
let bSession: BiedenSession | null = null;
let bPersisted: store.PersistedBieden | null = null;
let bRestored: { state: store.PersistedBieden; session: BiedenSession } | null = null;
let wiezenOptions: WiezenOptions = { ...DEFAULT_WIEZEN_OPTIONS };
let manilleOptions: ManilleOptions = { ...DEFAULT_MANILLE_OPTIONS };

function saveOptions(): void {
  try {
    localStorage.setItem(WIEZEN_OPTS_KEY, JSON.stringify(wiezenOptions));
    localStorage.setItem(MANILLE_OPTS_KEY, JSON.stringify(manilleOptions));
  } catch {
    /* ignore */
  }
}

const SUIT_GLYPH: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANK_LABEL: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

function playerName(p: number): string {
  return p === HUMAN ? t('player.you') : (BOT_NAMES[p] as string);
}

/** i18n-naam van het actieve spel ('manille' heet in de teksten 'manillen'). */
function gameLabel(): string {
  return t(game === 'manille' ? 'game.manillen' : (`game.${game}` as MessageKey));
}

function tContract(id: string): string {
  return t(`contract.${id}` as MessageKey);
}

function tSuit(suit: Suit): string {
  return t(`suit.${suit}` as MessageKey);
}

function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

function cardText(card: Card): string {
  return `${SUIT_GLYPH[card.suit]}${rankLabel(card.rank)}`;
}

/* ---------- persistentie ---------- */

function record(action: store.SessionAction): void {
  if (!persisted) return;
  persisted.actions.push(action);
  store.save(persisted);
}

/** Biedlog van de lopende gift heropbouwen uit het actielog (na herstel). */
function rebuildBidLog(state: store.PersistedSession): void {
  bidLog = [];
  const lastClose = state.actions.map((a) => a.t).lastIndexOf('close');
  for (const action of state.actions.slice(lastClose + 1)) {
    if (action.t === 'bid') {
      bidLog.push(
        action.a.type === 'bid'
          ? {
              kind: 'bid',
              player: action.p,
              contractId: action.a.contractId,
              ...(action.a.suit ? { suit: action.a.suit } : {}),
            }
          : { kind: action.a.type === 'join' ? 'join' : 'pass', player: action.p },
      );
    }
  }
  seedTroelLog(true);
}

/* ---------- spelverloop ---------- */

function startSession(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  persisted = store.newPersisted(ruleset.id, seed, botLevel, wiezenOptions);
  store.save(persisted);
  restored = null;
  session = store.replay(ruleset, persisted);
  bidLog = [];
  seedTroelLog(false);
  view = 'game';
  render();
  scheduleBots();
}

function continueSession(): void {
  if (!restored) return;
  ruleset = getRuleset(restored.state.rulesetId) ?? ruleset;
  persisted = restored.state;
  session = restored.session;
  botLevel = persisted.botLevel;
  restored = null;
  rebuildBidLog(persisted);
  view = 'game';
  render();
  scheduleBots();
}

function seedTroelLog(prepend: boolean): void {
  const troel = session?.gift?.bidding.troel;
  if (!troel) return;
  const entry: BidLogEntry = { kind: 'troel', player: troel.holder };
  if (prepend) bidLog.unshift(entry);
  else bidLog.push(entry);
}

function currentGift(): Gift | null {
  return session?.gift ?? null;
}

/** Wie moet er nu handelen, en is dat de mens? */
function actor(): { player: number; human: boolean } | null {
  const gift = currentGift();
  if (!gift) return null;
  switch (gift.phase) {
    case 'bidding':
      return { player: gift.bidding.toAct, human: gift.bidding.toAct === HUMAN };
    case 'alleen-choice': {
      const p = gift.bidding.current?.declarers[0] as number;
      return { player: p, human: p === HUMAN };
    }
    case 'trump-choice': {
      const p = gift.trumpChooser as number;
      return { player: p, human: p === HUMAN };
    }
    case 'play':
      return { player: gift.toPlay, human: gift.toPlay === HUMAN };
    default:
      return null;
  }
}

function afterBidAction(gift: Gift): void {
  if (gift.bidding.phase === 'done' && !gift.contract) gift.settleBidding();
}

function playCard(gift: Gift, player: number, card: Card): void {
  gift.playCard(player, card);
  record({ t: 'play', p: player, card });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.contract && gift.score) {
    const points = gift.score.points[HUMAN] ?? 0;
    sfxScore(points >= 0);
    const declarerIdx = gift.contract.declarers.indexOf(HUMAN);
    recordGiftStat(
      gift.contract.contract.id,
      declarerIdx >= 0,
      declarerIdx >= 0 && (gift.score.success[declarerIdx] ?? false),
      points,
    );
  }
}

function botStep(): boolean {
  const gift = currentGift();
  const who = actor();
  if (!gift || !who || who.human) return false;
  const p = who.player;
  switch (gift.phase) {
    case 'bidding': {
      const action = chooseBid(gift.bidding, p, gift.deal.hands[p] as Card[], botLevel);
      gift.bidding.act(p, action);
      record({ t: 'bid', p, a: action });
      bidLog.push(
        action.type === 'bid'
          ? {
              kind: 'bid',
              player: p,
              contractId: action.contractId,
              ...(action.suit ? { suit: action.suit } : {}),
            }
          : { kind: action.type === 'join' ? 'join' : 'pass', player: p },
      );
      afterBidAction(gift);
      return true;
    }
    case 'alleen-choice': {
      // Bij kleurenwiezen telt de kleur die hij zelf aankondigde, niet de gedraaide kaart.
      const alleenTrump = gift.bidding.announcedSuit ?? gift.bidding.turnedSuit;
      const accept = chooseAlleen(gift.deal.hands[p] as Card[], alleenTrump, botLevel);
      gift.bidding.chooseAlleen(accept);
      record({ t: 'alleen', accept });
      afterBidAction(gift);
      return true;
    }
    case 'trump-choice': {
      const suit = chooseTrumpSuit(gift.deal.hands[p] as Card[]);
      gift.chooseTrump(suit);
      record({ t: 'trump', suit });
      return true;
    }
    case 'play': {
      playCard(gift, p, chooseCard(gift, p, botLevel));
      return true;
    }
    default:
      return false;
  }
}

function scheduleBots(): void {
  const gen = ++generation;
  const who = actor();
  if (!who || who.human) return;
  const gift = currentGift();
  const pause = gift?.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'wiezen' || view !== 'game') return;
      if (botStep()) {
        render();
        scheduleBots();
      }
    },
    pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function closeAndNext(): void {
  if (!session) return;
  session.closeGift();
  record({ t: 'close' });
  if (!session.finished) {
    session.nextGift();
    bidLog = [];
    seedTroelLog(false);
  } else {
    recordSessionStat(ruleset.id, botLevel, session.totals, HUMAN);
    store.clear();
    persisted = null;
  }
  render();
  scheduleBots();
}

/* ---------- rendering ---------- */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const btn = el('button', className, label);
  btn.type = 'button';
  btn.addEventListener('click', () => {
    onClick();
  });
  return btn;
}

function segButton(label: string, pressed: boolean, onClick: () => void): HTMLButtonElement {
  const btn = button(label, '', onClick);
  btn.setAttribute('aria-pressed', String(pressed));
  return btn;
}

/** Speelkaart: rang boven, kleursymbool eronder — leesbaar op kleine schermen. */
function cardFace(node: HTMLElement, card: Card): void {
  node.append(
    el('span', 'card-rank', rankLabel(card.rank)),
    el('span', 'card-suit', SUIT_GLYPH[card.suit]),
  );
  node.setAttribute('aria-label', `${tSuit(card.suit)} ${rankLabel(card.rank)}`);
}

function cardEl(card: Card, opts?: { onClick?: () => void; disabled?: boolean }): HTMLElement {
  const red = card.suit === 'H' || card.suit === 'D';
  if (opts?.onClick) {
    const btn = button('', `card${red ? ' red' : ''}`, opts.onClick);
    btn.disabled = opts.disabled ?? false;
    cardFace(btn, card);
    return btn;
  }
  const span = el('span', `card static${red ? ' red' : ''}`);
  cardFace(span, card);
  return span;
}

/** Loopt er een spel in het geheugen dat je kan hervatten? */
function liveSession(): boolean {
  if (game === 'manille') return Boolean(mSession && !mSession.finished);
  if (game === 'bieden') return Boolean(bSession && !bSession.finished);
  if (game === 'klaverjassen') return Boolean(kSession && !kSession.finished);
  if (game === 'belote') return Boolean(blSession && !blSession.finished);
  if (game === 'hartenjagen') return Boolean(hjSession && !hjSession.finished);
  if (game === 'boerenbridge') return Boolean(bbSession && !bbSession.finished);
  if (game === 'tarot') return Boolean(ttSession && !ttSession.finished);
  return Boolean(session && !session.finished);
}

/** Terug naar het startscherm. Het spel blijft staan — botbeurten pauzeren. */
function goHome(): void {
  generation += 1; // hangende bottimers annuleren (alle drie de spellen delen de teller)
  view = 'home';
  render();
}

/** Verder waar je gebleven was, inclusief de botbeurt die aan de gang was. */
function resumeGame(): void {
  view = 'game';
  render();
  if (game === 'manille') scheduleManilleBots();
  else if (game === 'bieden') scheduleBiedenBots();
  else if (game === 'klaverjassen') scheduleKlaverjasBots();
  else if (game === 'belote') scheduleBeloteBots();
  else if (game === 'hartenjagen') scheduleHartenBots();
  else if (game === 'boerenbridge') scheduleBoerenBots();
  else if (game === 'tarot') scheduleTarotBots();
  else scheduleBots();
}

function topbar(): HTMLElement {
  const header = el('header', 'topbar');
  const left = el('div', 'topbar-left');
  // Zonder deze knop zit je in een spel of scherm vast: er was geen weg terug.
  if (view !== 'home') {
    left.append(button(`\u2039 ${t('controls.menu')}`, 'btn back', () => goHome()));
  }
  const brand = el('div', 'brand');
  brand.innerHTML =
    'Cards<span class="suits" aria-hidden="true"><span class="suit-black">♠</span>' +
    '<span class="suit-red">♥</span><span class="suit-black">♣</span><span class="suit-red">♦</span></span>';
  const controls = el('div', 'controls');

  const langGroup = el('div', 'control-group');
  langGroup.append(el('span', undefined, t('controls.language')));
  const langSeg = el('div', 'seg');
  langSeg.setAttribute('role', 'group');
  for (const locale of LOCALES) {
    langSeg.append(
      segButton(locale.toUpperCase(), getLocale() === locale, () => setLocale(locale)),
    );
  }
  langGroup.append(langSeg);

  const themeGroup = el('div', 'control-group');
  themeGroup.append(el('span', undefined, t('controls.theme')));
  const themeSeg = el('div', 'seg');
  themeSeg.setAttribute('role', 'group');
  const labels: Record<Theme, string> = {
    light: t('theme.light'),
    dark: t('theme.dark'),
    system: t('theme.system'),
  };
  for (const theme of THEMES) {
    themeSeg.append(
      segButton(labels[theme], getTheme() === theme, () => {
        applyTheme(theme);
        render();
      }),
    );
  }
  themeGroup.append(themeSeg);

  const soundBtn = button(soundEnabled() ? '🔊' : '🔇', 'btn sound', () => {
    toggleSound();
    render();
  });
  soundBtn.setAttribute('aria-label', t('controls.sound'));
  soundBtn.setAttribute('aria-pressed', String(soundEnabled()));

  controls.append(langGroup, themeGroup, soundBtn);
  left.append(brand);
  header.append(left, controls);
  return header;
}

function optionRow(
  label: string,
  choices: Array<{ label: string; active: boolean; onClick: () => void }>,
): HTMLElement {
  const group = el('div', 'control-group level-picker');
  group.append(el('span', undefined, label));
  const seg = el('div', 'seg');
  seg.setAttribute('role', 'group');
  for (const c of choices) seg.append(segButton(c.label, c.active, c.onClick));
  group.append(seg);
  return group;
}

function setWiezen<K extends keyof WiezenOptions>(key: K, value: WiezenOptions[K]): void {
  wiezenOptions = { ...wiezenOptions, [key]: value };
  saveOptions();
  render();
}

function setManille<K extends keyof ManilleOptions>(key: K, value: ManilleOptions[K]): void {
  manilleOptions = { ...manilleOptions, [key]: value };
  saveOptions();
  render();
}

function wiezenOptionsPanel(): HTMLElement {
  const box = el('div', 'options');
  box.append(el('div', 'options-title', t('options.title')));
  box.append(
    optionRow(t('opt.troelTarget'), [
      {
        label: '8',
        active: wiezenOptions.troelTarget === 8,
        onClick: () => setWiezen('troelTarget', 8),
      },
      {
        label: '9',
        active: wiezenOptions.troelTarget === 9,
        onClick: () => setWiezen('troelTarget', 9),
      },
    ]),
    optionRow(t('opt.troelOverbiddable'), [
      {
        label: t('opt.troelFromAb9'),
        active: wiezenOptions.troelOverbiddable,
        onClick: () => setWiezen('troelOverbiddable', true),
      },
      {
        label: t('opt.troelUnbeatable'),
        active: !wiezenOptions.troelOverbiddable,
        onClick: () => setWiezen('troelOverbiddable', false),
      },
    ]),
    optionRow(t('opt.kleineMiserie'), [
      {
        label: t('opt.off'),
        active: !wiezenOptions.kleineMiserie,
        onClick: () => setWiezen('kleineMiserie', false),
      },
      {
        label: t('opt.on'),
        active: wiezenOptions.kleineMiserie,
        onClick: () => setWiezen('kleineMiserie', true),
      },
    ]),
  );
  return box;
}

function manilleOptionsPanel(): HTMLElement {
  const box = el('div', 'options');
  box.append(el('div', 'options-title', t('options.title')));
  box.append(
    optionRow(t('opt.pointModel'), [
      {
        label: '60',
        active: manilleOptions.pointModel === 60,
        onClick: () => setManille('pointModel', 60),
      },
      {
        label: '68',
        active: manilleOptions.pointModel === 68,
        onClick: () => setManille('pointModel', 68),
      },
    ]),
    optionRow(t('opt.trumpMode'), [
      {
        label: t('opt.trumpDealer'),
        active: manilleOptions.trumpMode === 'dealer',
        onClick: () => setManille('trumpMode', 'dealer'),
      },
      {
        label: t('opt.trumpTurned'),
        active: manilleOptions.trumpMode === 'turned',
        onClick: () => setManille('trumpMode', 'turned'),
      },
      {
        label: t('opt.trumpPartner'),
        active: manilleOptions.trumpMode === 'partner',
        onClick: () => setManille('trumpMode', 'partner'),
      },
    ]),
    optionRow(t('opt.multipliers'), [
      {
        label: t('opt.off'),
        active: !manilleOptions.multipliers,
        onClick: () => setManille('multipliers', false),
      },
      {
        label: t('opt.on'),
        active: manilleOptions.multipliers,
        onClick: () => setManille('multipliers', true),
      },
    ]),
    optionRow(t('opt.maatLigt'), [
      {
        label: t('opt.off'),
        active: !manilleOptions.maatLigt,
        onClick: () => setManille('maatLigt', false),
      },
      {
        label: t('opt.on'),
        active: manilleOptions.maatLigt,
        onClick: () => setManille('maatLigt', true),
      },
    ]),
    optionRow(t('opt.targetPoints'), [
      {
        label: '101',
        active: manilleOptions.targetPoints === 101,
        onClick: () => setManille('targetPoints', 101),
      },
      {
        label: '61',
        active: manilleOptions.targetPoints === 61,
        onClick: () => setManille('targetPoints', 61),
      },
    ]),
  );
  return box;
}

function gameTile(id: GameId, icon: string, nameKey: MessageKey, descKey: MessageKey): HTMLElement {
  const tile = el('button', 'game-tile');
  tile.type = 'button';
  tile.setAttribute('aria-pressed', String(game === id));
  tile.append(el('span', 'tile-icon', icon));
  const body = el('span', 'tile-text');
  body.append(el('span', 'tile-name', t(nameKey)), el('span', 'tile-desc', t(descKey)));
  tile.append(body);
  tile.addEventListener('click', () => {
    game = id;
    try {
      localStorage.setItem(GAME_KEY, id);
    } catch {
      /* ignore */
    }
    render();
  });
  return tile;
}

/** Zichtbare keuze tussen gewoon wiezen, kleurenwiezen en de cafévariant. */
function rulesetPicker(): HTMLElement {
  const box = el('div', 'type-picker');
  box.append(el('span', 'type-label', t('ruleset.picker')));
  const seg = el('div', 'seg wide');
  seg.setAttribute('role', 'group');
  seg.setAttribute('aria-label', t('ruleset.picker'));
  for (const r of rulesets) {
    seg.append(
      segButton(t(`ruleset.${r.id}` as MessageKey), ruleset.id === r.id, () => {
        ruleset = r;
        try {
          localStorage.setItem(RULESET_KEY, r.id);
        } catch {
          /* ignore */
        }
        render();
      }),
    );
  }
  box.append(seg);
  box.append(el('p', 'type-hint', t(`ruleset.hint.${ruleset.id}` as MessageKey)));
  return box;
}

function startScreen(): HTMLElement {
  const main = el('main', 'hero');
  main.append(el('span', 'phase', t('app.phase')));
  main.append(el('h1', undefined, t('app.title')));
  main.append(el('p', 'tagline', t('app.tagline')));

  // Spelkeuze als grote, tapbare tegels — meteen duidelijk wat je kan spelen.
  const tiles = el('div', 'game-tiles');
  tiles.setAttribute('role', 'group');
  tiles.setAttribute('aria-label', t('game.picker'));
  tiles.append(
    gameTile('wiezen', '\u2660', 'game.wiezen', 'tile.wiezen'),
    gameTile('manille', '\u2665', 'game.manillen', 'tile.manillen'),
    gameTile('bieden', '\u2663', 'game.bieden', 'tile.bieden'),
    gameTile('klaverjassen', '\u2666', 'game.klaverjassen', 'tile.klaverjassen'),
    gameTile('belote', '\u{1F1EB}\u{1F1F7}', 'game.belote', 'tile.belote'),
    gameTile('hartenjagen', '\u{1F494}', 'game.hartenjagen', 'tile.hartenjagen'),
    gameTile('boerenbridge', '\u{1F3AF}', 'game.boerenbridge', 'tile.boerenbridge'),
    gameTile('tarot', '\u{1F52E}', 'game.tarot', 'tile.tarot'),
  );

  // Tarot is het enige spel met een keuze in het aantal spelers (§1).
  if (game === 'tarot') main.append(tarotPlayerPicker());
  main.append(tiles);

  // Speeltype staat bewust níét in de ingeklapte instellingen: gewoon wiezen en
  // kleurenwiezen zijn twee verschillende spellen, geen detailinstelling (REGELS.md §3bis).
  if (game === 'wiezen') main.append(rulesetPicker());

  const bodyKey =
    game === 'manille'
      ? 'manille.intro'
      : game === 'bieden'
        ? 'bieden.intro'
        : game === 'klaverjassen'
          ? 'klaverjas.intro'
          : game === 'belote'
            ? 'belote.intro'
            : game === 'hartenjagen'
              ? 'harten.intro'
              : game === 'boerenbridge'
                ? 'boeren.intro'
                : game === 'tarot'
                  ? 'tarot.intro'
                  : 'wiezen.intro';
  main.append(el('p', 'hint', t(bodyKey)));

  const hasRestore =
    game === 'manille'
      ? Boolean(mRestored && !mRestored.session.finished)
      : game === 'bieden'
        ? Boolean(bRestored && !bRestored.session.finished)
        : game === 'klaverjassen'
          ? Boolean(kRestored && !kRestored.session.finished)
          : game === 'belote'
            ? Boolean(blRestored && !blRestored.session.finished)
            : game === 'hartenjagen'
              ? Boolean(hjRestored && !hjRestored.session.finished)
              : game === 'boerenbridge'
                ? Boolean(bbRestored && !bbRestored.session.finished)
                : game === 'tarot'
                  ? Boolean(ttRestored && !ttRestored.session.finished)
                  : Boolean(restored && !restored.session.finished);

  // Primaire actie: groot en als eerste bereikbaar met de duim.
  const row = el('div', 'btn-row stack');
  if (liveSession()) {
    // Je stapte via de menuknop uit een lopend spel: hervatten mag niet
    // betekenen dat je die partij per ongeluk weggooit.
    row.append(button(t('start.resume'), 'btn primary big', resumeGame));
    row.append(
      button(t('start.new'), 'btn', () => {
        if (game === 'manille') {
          store.clearManille();
          mRestored = null;
          startManille();
        } else if (game === 'klaverjassen') {
          store.clearKlaverjas();
          kRestored = null;
          startKlaverjas();
        } else if (game === 'belote') {
          store.clearBelote();
          blRestored = null;
          startBelote();
        } else if (game === 'hartenjagen') {
          store.clearHarten();
          hjRestored = null;
          startHarten();
        } else if (game === 'boerenbridge') {
          store.clearBoeren();
          bbRestored = null;
          startBoeren();
        } else if (game === 'tarot') {
          store.clearTarot();
          ttRestored = null;
          startTarot();
        } else if (game === 'bieden') {
          store.clearBieden();
          bRestored = null;
          startBieden();
        } else {
          store.clear();
          restored = null;
          startSession();
        }
      }),
    );
  } else if (game === 'tarot') {
    if (hasRestore) {
      row.append(button(t('start.continue'), 'btn primary big', continueTarot));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearTarot();
          ttRestored = null;
          startTarot();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary big', startTarot));
    }
  } else if (game === 'boerenbridge') {
    if (hasRestore) {
      row.append(button(t('start.continue'), 'btn primary big', continueBoeren));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearBoeren();
          bbRestored = null;
          startBoeren();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary big', startBoeren));
    }
  } else if (game === 'hartenjagen') {
    if (hasRestore) {
      row.append(button(t('start.continue'), 'btn primary big', continueHarten));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearHarten();
          hjRestored = null;
          startHarten();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary big', startHarten));
    }
  } else if (game === 'belote') {
    if (hasRestore) {
      row.append(button(t('start.continue'), 'btn primary big', continueBelote));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearBelote();
          blRestored = null;
          startBelote();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary big', startBelote));
    }
  } else if (game === 'klaverjassen') {
    if (hasRestore) {
      row.append(button(t('start.continue'), 'btn primary big', continueKlaverjas));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearKlaverjas();
          kRestored = null;
          startKlaverjas();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary big', startKlaverjas));
    }
  } else if (game === 'bieden') {
    if (hasRestore) {
      row.append(button(t('start.continue'), 'btn primary big', continueBieden));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearBieden();
          bRestored = null;
          startBieden();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary big', startBieden));
    }
  } else if (game === 'manille') {
    if (hasRestore) {
      row.append(button(t('start.continue'), 'btn primary big', continueManille));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearManille();
          mRestored = null;
          startManille();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary big', startManille));
    }
  } else if (hasRestore) {
    row.append(button(t('start.continue'), 'btn primary big', continueSession));
    row.append(
      button(t('start.new'), 'btn', () => {
        store.clear();
        restored = null;
        startSession();
      }),
    );
  } else {
    row.append(button(t('game.start'), 'btn primary big', startSession));
  }
  main.append(row);

  // Nieuw? Leer het spel — prominent voor wie het spel niet kent.
  const learnRow = el('div', 'btn-row stack');
  learnRow.append(
    button(`\u{1F393} ${t('coach.learnButton')}`, 'btn', () => {
      wizardStep = 0;
      view = 'wizard';
      render();
    }),
    button(`\u{1F4D6} ${t('guide.button')}`, 'btn', () => openGuide(null)),
    button(t('scorebord.button'), 'btn', () => {
      view = 'scorebord';
      render();
    }),
    button(t('stats.button'), 'btn muted', () => {
      view = 'stats';
      render();
    }),
  );
  main.append(learnRow);

  // Instellingen en regelvarianten ingeklapt: rustig startscherm, alles
  // blijft bereikbaar voor wie het wil.
  const settings = el('details', 'settings');
  const summary = document.createElement('summary');
  summary.textContent = t('settings.title');
  settings.append(summary);
  const body = el('div', 'settings-body');

  const levelSeg = el('div', 'seg');
  levelSeg.setAttribute('role', 'group');
  for (const level of BOT_LEVELS) {
    levelSeg.append(
      segButton(t(`bots.${level}` as MessageKey), botLevel === level, () => {
        botLevel = level;
        try {
          localStorage.setItem(LEVEL_KEY, level);
        } catch {
          /* ignore */
        }
        render();
      }),
    );
  }
  const levelGroup = el('div', 'control-group');
  levelGroup.append(el('span', undefined, t('bots.level')), levelSeg);
  body.append(levelGroup);

  const coachSeg = el('div', 'seg');
  coachSeg.setAttribute('role', 'group');
  coachSeg.append(
    segButton(t('opt.on'), coachOn, () => setCoach(true)),
    segButton(t('opt.off'), !coachOn, () => setCoach(false)),
  );
  const coachGroup = el('div', 'control-group');
  coachGroup.append(el('span', undefined, t('coach.setting')), coachSeg);
  body.append(coachGroup);

  // Regelvarianten horen bij een nieuwe sessie; een hersteld spel heeft de
  // zijne al vastgelegd.
  // Enkel wiezen en manillen hebben regelvarianten; de andere spellen kregen
  // hier tot nu toe het wiezen-paneel te zien, wat nergens op sloeg.
  if (!hasRestore && (game === 'wiezen' || game === 'manille')) {
    body.append(game === 'manille' ? manilleOptionsPanel() : wiezenOptionsPanel());
  }

  settings.append(body);
  main.append(settings);

  if (game === 'wiezen') {
    main.append(
      el(
        'p',
        'ruleset',
        t('placeholder.ruleset', {
          name: ruleset.name[getLocale()],
          version: ruleset.version,
          contracts: ruleset.contracts.length,
        }),
      ),
    );
  }
  return main;
}

// De deelanimatie mag maar één keer per gift lopen: render() bouwt de tafel bij
// elke botzet opnieuw op, en zonder deze rem flikkert de hele hand telkens weer.
let dealtKey = '';

function tableGrid(): HTMLElement {
  const n =
    game === 'manille'
      ? (mSession?.giftNumber ?? 0)
      : game === 'bieden'
        ? (bSession?.giftNumber ?? 0)
        : game === 'klaverjassen'
          ? (kSession?.roundNumber ?? 0)
          : game === 'belote'
            ? (blSession?.roundNumber ?? 0)
            : game === 'hartenjagen'
              ? (hjSession?.roundNumber ?? 0)
              : game === 'boerenbridge'
                ? (bbSession?.roundNumber ?? 0)
                : game === 'tarot'
                  ? (ttSession?.giftNumber ?? 0)
                  : (session?.giftNumber ?? 0);
  const key = `${game}:${n}`;
  const table = el('div', 'table-grid');
  if (key !== dealtKey) {
    dealtKey = key;
    table.classList.add('dealing');
  }
  return table;
}

/** Coachtip als blokje boven de actieknoppen; alleen zichtbaar als de coach aanstaat. */
function coachBox(tip: CoachTip | null): HTMLElement | null {
  if (!coachOn || !tip) return null;
  const box = el('div', 'coach');
  box.append(el('span', 'coach-icon', '\u{1F393}'));
  const body = el('div', 'coach-body');
  body.append(el('strong', undefined, t('coach.title')));
  body.append(el('span', undefined, t(`coach.tip.${tip.id}` as MessageKey, tip.params)));
  box.append(body);
  return box;
}

/** Starterswizard: korte uitleg in stappen, per spel. */
/** Regelgids: inhoudsopgave, of één hoofdstuk in wizardstijl doorlopen. */
function guideScreen(): HTMLElement {
  const chapter = guideChapter ? getChapter(guideChapter) : undefined;
  return chapter ? guideChapterScreen(chapter) : guideIndexScreen();
}

function guideIndexScreen(): HTMLElement {
  const main = el('main', 'hero');
  main.append(el('span', 'phase', t('guide.toc')));
  main.append(el('h1', undefined, t('guide.title')));
  main.append(el('p', 'tagline', t('guide.intro')));

  const list = el('div', 'guide-list');
  for (const chapter of GUIDE_CHAPTERS) {
    const item = el('button', 'guide-item');
    item.type = 'button';
    item.append(el('span', 'tile-icon', chapter.icon));
    const body = el('span', 'tile-text');
    body.append(
      el('span', 'tile-name', t(`guide.${chapter.id}.title` as MessageKey)),
      el('span', 'tile-desc', t(`guide.${chapter.id}.summary` as MessageKey)),
      el('span', 'guide-count', t('guide.steps', { n: chapter.steps.length })),
    );
    item.append(body);
    item.addEventListener('click', () => openGuide(chapter.id));
    list.append(item);
  }
  main.append(list);

  const row = el('div', 'btn-row');
  row.append(
    button(t('wizard.close'), 'btn muted', () => {
      view = 'home';
      render();
    }),
  );
  main.append(row);
  return main;
}

function guideChapterScreen(chapter: { id: GuideChapterId; steps: string[] }): HTMLElement {
  const total = chapter.steps.length;
  const step = Math.min(Math.max(guideStep, 0), total - 1);
  const key = chapter.steps[step] as string;
  const main = el('main', 'hero wizard');
  main.append(el('span', 'phase', t('wizard.step', { n: step + 1, total })));
  main.append(el('h1', undefined, t(`guide.${chapter.id}.title` as MessageKey)));

  const dots = el('div', 'wizard-progress');
  dots.setAttribute('role', 'img');
  dots.setAttribute('aria-label', t('wizard.step', { n: step + 1, total }));
  for (let i = 0; i < total; i += 1) {
    dots.append(el('span', i <= step ? 'wizard-dot done' : 'wizard-dot'));
  }
  main.append(dots);

  const card = el('section', 'wizard-step');
  card.append(el('h2', undefined, t(`guide.${chapter.id}.${key}.title` as MessageKey)));
  card.append(el('p', undefined, t(`guide.${chapter.id}.${key}.body` as MessageKey)));
  main.append(card);

  const row = el('div', 'btn-row stack');
  if (step < total - 1) {
    row.append(
      button(t('wizard.next'), 'btn primary big', () => {
        guideStep = step + 1;
        render();
      }),
    );
  } else {
    const next = nextChapter(chapter.id);
    if (next) {
      row.append(
        button(
          t('guide.nextChapter', { name: t(`guide.${next.id}.title` as MessageKey) }),
          'btn primary big',
          () => openGuide(next.id),
        ),
      );
    } else {
      row.append(el('p', 'hint', t('guide.done')));
    }
  }

  const nav = el('div', 'btn-row');
  if (step > 0) {
    nav.append(
      button(t('wizard.prev'), 'btn', () => {
        guideStep = step - 1;
        render();
      }),
    );
  }
  nav.append(button(t('guide.toc'), 'btn', () => openGuide(null)));
  nav.append(
    button(t('wizard.close'), 'btn muted', () => {
      view = 'home';
      render();
    }),
  );
  row.append(nav);
  main.append(row);
  return main;
}

function wizardScreen(): HTMLElement {
  const total = WIZARD_STEPS[game];
  const step = Math.min(Math.max(wizardStep, 0), total - 1);
  const n = step + 1;
  const main = el('main', 'hero wizard');
  main.append(el('span', 'phase', t('wizard.step', { n, total })));
  main.append(el('h1', undefined, t('wizard.title', { game: gameLabel() })));

  // Je moest hiervoor eerst terug naar het startscherm om een ander spel te
  // leren; nu wissel je gewoon hier van spel.
  const games: [GameId, MessageKey][] = [
    ['wiezen', 'game.wiezen'],
    ['manille', 'game.manillen'],
    ['bieden', 'game.bieden'],
    ['klaverjassen', 'game.klaverjassen'],
    ['belote', 'game.belote'],
    ['hartenjagen', 'game.hartenjagen'],
  ];
  const picker = el('div', 'seg wide');
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', t('wizard.pickGame'));
  for (const [id, key] of games) {
    picker.append(
      segButton(t(key), game === id, () => {
        game = id;
        try {
          localStorage.setItem(GAME_KEY, id);
        } catch {
          /* ignore */
        }
        wizardStep = 0;
        render();
      }),
    );
  }
  main.append(picker);

  const dots = el('div', 'wizard-progress');
  dots.setAttribute('role', 'img');
  dots.setAttribute('aria-label', t('wizard.step', { n, total }));
  for (let i = 0; i < total; i += 1) {
    dots.append(el('span', i <= step ? 'wizard-dot done' : 'wizard-dot'));
  }
  main.append(dots);

  const card = el('section', 'wizard-step');
  card.append(el('h2', undefined, t(`wizard.${game}.${n}.title` as MessageKey)));
  card.append(el('p', undefined, t(`wizard.${game}.${n}.body` as MessageKey)));
  main.append(card);

  const row = el('div', 'btn-row stack');
  if (step < total - 1) {
    row.append(
      button(t('wizard.next'), 'btn primary big', () => {
        wizardStep = step + 1;
        render();
      }),
    );
  } else {
    row.append(
      button(t('wizard.startPlaying'), 'btn primary big', () => {
        view = 'home';
        render();
      }),
    );
  }
  const nav = el('div', 'btn-row');
  if (step === total - 1) {
    // Wie meer wil: door naar het volledige hoofdstuk over dit speltype.
    nav.append(
      button(t('guide.readMore'), 'btn', () => openGuide(chapterForGame(game, ruleset.id))),
    );
  }
  if (step > 0) {
    nav.append(
      button(t('wizard.prev'), 'btn', () => {
        wizardStep = step - 1;
        render();
      }),
    );
  }
  nav.append(
    button(t('wizard.close'), 'btn muted', () => {
      view = 'home';
      render();
    }),
  );
  row.append(nav);
  main.append(row);
  return main;
}

function statsScreen(): HTMLElement {
  const stats = loadStats();
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('stats.title')));

  const sessions = stats.sessions.length;
  const won = stats.sessions.filter((s) => s.won).length;
  const points = Object.values(stats.contracts).reduce((sum, c) => sum + c.points, 0);
  const summary = el('div', 'status');
  summary.append(
    el('span', 'chip', `${t('stats.sessions')}: ${sessions}`),
    el('span', 'chip', `${t('stats.won')}: ${won}`),
    el('span', 'chip strong', `${t('stats.points')}: ${formatPoints(points)}`),
  );
  main.append(summary);

  const entries = Object.entries(stats.contracts);
  if (entries.length === 0) {
    main.append(el('p', 'hint', t('stats.empty')));
  } else {
    const table = el('table', 'score-table');
    const head = el('tr');
    for (const label of [
      t('stats.contract'),
      t('stats.played'),
      t('stats.declared'),
      t('stats.declaredWon'),
      t('score.points'),
    ]) {
      head.append(el('th', undefined, label));
    }
    table.append(head);
    const order = new Map(ruleset.contracts.map((c, i) => [c.id, i]));
    entries.sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99));
    for (const [id, c] of entries) {
      const tr = el('tr');
      tr.append(el('th', undefined, tContract(id)));
      tr.append(el('td', undefined, String(c.played)));
      tr.append(el('td', undefined, String(c.declared)));
      tr.append(el('td', undefined, String(c.declaredWon)));
      tr.append(el('td', undefined, formatPoints(c.points)));
      table.append(tr);
    }
    main.append(table);
  }

  const row = el('div', 'btn-row');
  row.append(
    button(t('stats.back'), 'btn primary', () => {
      view = 'home';
      render();
    }),
  );
  row.append(
    button(t('stats.reset'), 'btn muted', () => {
      clearStats();
      render();
    }),
  );
  main.append(row);
  return main;
}

function statusBar(gift: Gift): HTMLElement {
  const s = session as Session;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('game.gift', { n: s.giftNumber, total: s.totalGiften })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.deal.dealer) })),
  );
  const contract = gift.contract;
  if (contract) {
    bar.append(
      el(
        'span',
        'chip strong',
        t('play.contract', {
          contract: tContract(contract.contract.id),
          names: contract.declarers.map(playerName).join(' + '),
        }),
      ),
    );
    if (contract.trumpSuit) {
      bar.append(
        el(
          'span',
          'chip',
          t('game.trump', {
            suit: `${SUIT_GLYPH[contract.trumpSuit]} ${tSuit(contract.trumpSuit)}`,
          }),
        ),
      );
    } else if (contract.contract.trump === 'first-card-led') {
      bar.append(el('span', 'chip', t('game.trumpPending', { name: playerName(contract.leader) })));
    } else {
      bar.append(el('span', 'chip', t('game.noTrump')));
    }
  } else if (announcesTrump(gift)) {
    // Kleurenwiezen: er ligt geen kaart open; de vrager noemt de kleur (§3bis).
    const announced = gift.bidding.announcedSuit;
    bar.append(
      el(
        'span',
        'chip',
        announced
          ? t('game.announced', { suit: `${SUIT_GLYPH[announced]} ${tSuit(announced)}` })
          : t('game.noTurned'),
      ),
    );
  } else {
    bar.append(el('span', 'chip', t('game.turned', { card: cardText(gift.deal.turnedCard) })));
  }
  return bar;
}

/** Kleurenwiezen? Dan wordt de troefkleur aangekondigd i.p.v. omgedraaid (REGELS.md §3bis). */
function announcesTrump(gift: Gift): boolean {
  return gift.bidding.ruleset.contracts.some(
    (c) => c.id === 'vraag-en-mee' && c.trump === 'announced',
  );
}

function goalLine(gift: Gift): string | null {
  if (!gift.contract) return null;
  // Het doel dat écht geldt: bij troel schuift het op als de uitkomer zijn aas
  // niet legde (REGELS.md §5.4).
  const contract = gift.effectiveContract;
  if (contract.target.tricks === 0) return t('play.goalZero');
  const key = contract.target.combined ? 'play.goalTogether' : 'play.goal';
  const line = t(key, { tricks: contract.target.tricks });
  return gift.troelPenalty > 0 ? `${line} — ${t('play.troelPenalty')}` : line;
}

function seat(gift: Gift, player: number): HTMLElement {
  const who = actor();
  const box = el('div', `seat seat-${player}${who?.player === player ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  head.append(el('span', 'seat-tricks', `${t('score.tricks')}: ${gift.tricksWon[player] ?? 0}`));
  box.append(head);

  const hand = el('div', 'hand');
  const cards = sortHand(gift.deal.hands[player] as Card[]);
  const contract = gift.contract;
  const openMiserie =
    contract?.contract.openCardsAfterTrick !== undefined &&
    gift.tricksPlayed >= contract.contract.openCardsAfterTrick &&
    contract.declarers.includes(player);

  if (player === HUMAN) {
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
      hand.append(
        cardEl(card, {
          disabled: !isLegal,
          onClick: () => {
            if (!isLegal) return;
            playCard(gift, HUMAN, card);
            render();
            scheduleBots();
          },
        }),
      );
    }
  } else if (openMiserie) {
    for (const card of cards) hand.append(cardEl(card));
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

function trickArea(gift: Gift): HTMLElement {
  const area = el('div', 'trick');
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick as { player: number; card: Card }[]) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(cardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  return area;
}

function bidLogView(): HTMLElement {
  const list = el('div', 'bidlog');
  for (const entry of bidLog.slice(-6)) {
    const name = playerName(entry.player);
    const line =
      entry.kind === 'bid'
        ? entry.suit
          ? t('bidding.bidsInSuit', {
              name,
              bid: tContract(entry.contractId),
              suit: `${SUIT_GLYPH[entry.suit]} ${tSuit(entry.suit)}`,
            })
          : t('bidding.bids', { name, bid: tContract(entry.contractId) })
        : entry.kind === 'join'
          ? t('bidding.joins', { name })
          : entry.kind === 'troel'
            ? t('bidding.troel', { name })
            : t('bidding.passed', { name });
    list.append(el('div', 'bidlog-line', line));
  }
  return list;
}

function actionPanel(gift: Gift): HTMLElement {
  const panel = el('div', 'panel');
  const who = actor();
  const tip = coachBox(who?.human ? wiezenTip(gift, HUMAN) : null);
  if (tip) panel.append(tip);

  switch (gift.phase) {
    case 'bidding': {
      panel.append(el('h2', undefined, t('bidding.title')));
      panel.append(bidLogView());
      if (who?.human) {
        const row = el('div', 'btn-row');
        if (gift.bidding.canJoin(HUMAN)) {
          row.append(
            button(t('bidding.join'), 'btn primary', () => {
              gift.bidding.act(HUMAN, { type: 'join' });
              record({ t: 'bid', p: HUMAN, a: { type: 'join' } });
              bidLog.push({ kind: 'join', player: HUMAN });
              afterBidAction(gift);
              render();
              scheduleBots();
            }),
          );
        }
        const placeBid = (contractId: string, suit?: Suit): void => {
          const action: BidAction = suit
            ? { type: 'bid', contractId, suit }
            : { type: 'bid', contractId };
          gift.bidding.act(HUMAN, action);
          record({ t: 'bid', p: HUMAN, a: action });
          bidLog.push({
            kind: 'bid',
            player: HUMAN,
            contractId,
            ...(suit ? { suit } : {}),
          });
          afterBidAction(gift);
          render();
          scheduleBots();
        };
        for (const contract of gift.bidding.legalBids(HUMAN)) {
          if (contract.trump === 'announced') {
            // Kleurenwiezen: je vraagt in een kleur, dus één knop per kleur (§3bis).
            for (const suit of SUITS) {
              const red = suit === 'H' || suit === 'D';
              row.append(
                button(
                  `${tContract(contract.id)} ${SUIT_GLYPH[suit]}`,
                  `btn${red ? ' red' : ''}`,
                  () => placeBid(contract.id, suit),
                ),
              );
            }
          } else {
            row.append(button(tContract(contract.id), 'btn', () => placeBid(contract.id)));
          }
        }
        row.append(
          button(t('bidding.pass'), 'btn muted', () => {
            gift.bidding.act(HUMAN, { type: 'pass' });
            record({ t: 'bid', p: HUMAN, a: { type: 'pass' } });
            bidLog.push({ kind: 'pass', player: HUMAN });
            afterBidAction(gift);
            render();
            scheduleBots();
          }),
        );
        panel.append(row);
      } else if (who) {
        panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
      }
      return panel;
    }
    case 'alleen-choice': {
      if (who?.human) {
        panel.append(el('p', undefined, t('bidding.alleenQuestion')));
        const row = el('div', 'btn-row');
        row.append(
          button(t('bidding.accept'), 'btn primary', () => {
            gift.bidding.chooseAlleen(true);
            record({ t: 'alleen', accept: true });
            afterBidAction(gift);
            render();
            scheduleBots();
          }),
          button(t('bidding.decline'), 'btn muted', () => {
            gift.bidding.chooseAlleen(false);
            record({ t: 'alleen', accept: false });
            afterBidAction(gift);
            render();
            scheduleBots();
          }),
        );
        panel.append(row);
      } else if (who) {
        panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
      }
      return panel;
    }
    case 'trump-choice': {
      if (who?.human) {
        panel.append(el('p', undefined, t('trump.choose')));
        const row = el('div', 'btn-row');
        for (const suit of SUITS) {
          const red = suit === 'H' || suit === 'D';
          row.append(
            button(`${SUIT_GLYPH[suit]} ${tSuit(suit)}`, `btn${red ? ' red' : ''}`, () => {
              gift.chooseTrump(suit);
              record({ t: 'trump', suit });
              render();
              scheduleBots();
            }),
          );
        }
        panel.append(row);
      } else if (who) {
        panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
      }
      return panel;
    }
    case 'redeal': {
      panel.append(el('p', undefined, t('bidding.redeal')));
      panel.append(button(t('bidding.continue'), 'btn primary', closeAndNext));
      return panel;
    }
    case 'play': {
      const goal = goalLine(gift);
      if (goal) panel.append(el('p', 'hint', goal));
      if (who?.human) panel.append(el('p', 'strong', t('play.yourTurn')));
      return panel;
    }
    case 'scored': {
      panel.append(el('h2', undefined, t('score.title')));
      const contract = gift.contract;
      const score = gift.score;
      if (contract && score) {
        contract.declarers.forEach((d, i) => {
          panel.append(
            el(
              'p',
              score.success[i] ? 'made' : 'failed',
              `${playerName(d)} — ${tContract(contract.contract.id)}: ${
                score.success[i] ? t('score.made') : t('score.failed')
              }`,
            ),
          );
        });
        panel.append(scoreTable(gift));
      }
      panel.append(button(t('score.next'), 'btn primary', closeAndNext));
      return panel;
    }
  }
}

function scoreTable(gift: Gift): HTMLElement {
  const s = session as Session;
  const table = el('table', 'score-table');
  const head = el('tr');
  head.append(el('th'));
  for (let p = 0; p < PLAYER_COUNT; p++) head.append(el('th', undefined, playerName(p)));
  table.append(head);
  const rows: Array<[string, (p: number) => string]> = [
    [t('score.tricks'), (p) => String(gift.tricksWon[p] ?? 0)],
    [t('score.points'), (p) => formatPoints(gift.score?.points[p] ?? 0)],
    [t('score.total'), (p) => formatPoints((s.totals[p] ?? 0) + (gift.score?.points[p] ?? 0))],
  ];
  for (const [label, value] of rows) {
    const tr = el('tr');
    tr.append(el('th', undefined, label));
    for (let p = 0; p < PLAYER_COUNT; p++) tr.append(el('td', undefined, value(p)));
    table.append(tr);
  }
  return table;
}

function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

function endScreen(): HTMLElement {
  const s = session as Session;
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  const best = s.totals.indexOf(Math.max(...s.totals));
  main.append(
    el('p', 'strong', t('session.winner', { name: playerName(best), points: s.totals[best] ?? 0 })),
  );
  const table = el('table', 'score-table');
  const head = el('tr');
  const row = el('tr');
  for (let p = 0; p < PLAYER_COUNT; p++) {
    head.append(el('th', undefined, playerName(p)));
    row.append(el('td', undefined, formatPoints(s.totals[p] ?? 0)));
  }
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startSession));
  return main;
}

function render(): void {
  if (!app) return;
  app.replaceChildren();
  const wrap = el('div', 'wrap game');
  wrap.append(topbar());

  const gift = currentGift();
  const mGift = mSession?.gift ?? null;
  const bGift = bSession?.gift ?? null;
  if (view === 'guide') {
    wrap.append(guideScreen());
  } else if (view === 'wizard') {
    wrap.append(wizardScreen());
  } else if (view === 'scorebord') {
    wrap.append(scorebordScreen());
  } else if (view === 'stats') {
    wrap.append(statsScreen());
  } else if (view === 'home') {
    wrap.append(startScreen());
  } else if (game === 'tarot') {
    const ttGift = ttSession?.gift ?? null;
    if (!ttSession || (!ttGift && !ttSession.finished)) {
      wrap.append(startScreen());
    } else if (!ttGift && ttSession.finished) {
      wrap.append(tarotEndScreen());
    } else if (ttGift) {
      wrap.append(tarotStatusBar(ttGift), tarotTable(ttGift), tarotActionPanel(ttGift));
    }
  } else if (game === 'boerenbridge') {
    const bbGift = bbSession?.gift ?? null;
    if (!bbSession || (!bbGift && !bbSession.finished)) {
      wrap.append(startScreen());
    } else if (!bbGift && bbSession.finished) {
      wrap.append(boerenEndScreen());
    } else if (bbGift) {
      wrap.append(boerenStatusBar(bbGift));
      const table = tableGrid();
      table.append(boerenSeat(bbGift, 2));
      const middle = el('div', 'table-middle');
      middle.append(boerenSeat(bbGift, 1), boerenTrickArea(bbGift), boerenSeat(bbGift, 3));
      table.append(middle);
      table.append(boerenSeat(bbGift, HUMAN));
      wrap.append(table, boerenActionPanel(bbGift));
    }
  } else if (game === 'hartenjagen') {
    const hjGift = hjSession?.gift ?? null;
    if (!hjSession || (!hjGift && !hjSession.finished)) {
      wrap.append(startScreen());
    } else if (!hjGift && hjSession.finished) {
      wrap.append(hartenEndScreen());
    } else if (hjGift) {
      wrap.append(hartenStatusBar(hjGift));
      const table = tableGrid();
      table.append(hartenSeat(hjGift, 2));
      const middle = el('div', 'table-middle');
      middle.append(hartenSeat(hjGift, 1), hartenTrickArea(hjGift), hartenSeat(hjGift, 3));
      table.append(middle);
      table.append(hartenSeat(hjGift, HUMAN));
      wrap.append(table, hartenActionPanel(hjGift));
    }
  } else if (game === 'belote') {
    const blGift = blSession?.gift ?? null;
    if (!blSession || (!blGift && !blSession.finished)) {
      wrap.append(startScreen());
    } else if (!blGift && blSession.finished) {
      wrap.append(beloteEndScreen());
    } else if (blGift) {
      wrap.append(beloteStatusBar(blGift));
      const table = tableGrid();
      table.append(beloteSeat(blGift, 2));
      const middle = el('div', 'table-middle');
      middle.append(beloteSeat(blGift, 1), beloteTrickArea(blGift), beloteSeat(blGift, 3));
      table.append(middle);
      table.append(beloteSeat(blGift, HUMAN));
      wrap.append(table, beloteActionPanel(blGift));
    }
  } else if (game === 'klaverjassen') {
    const kGift = kSession?.gift ?? null;
    if (!kSession || (!kGift && !kSession.finished)) {
      wrap.append(startScreen());
    } else if (!kGift && kSession.finished) {
      wrap.append(klaverjasEndScreen());
    } else if (kGift) {
      wrap.append(klaverjasStatusBar(kGift));
      const table = tableGrid();
      table.append(klaverjasSeat(kGift, 2));
      const middle = el('div', 'table-middle');
      middle.append(klaverjasSeat(kGift, 1), klaverjasTrickArea(kGift), klaverjasSeat(kGift, 3));
      table.append(middle);
      table.append(klaverjasSeat(kGift, HUMAN));
      wrap.append(table, klaverjasActionPanel(kGift));
    }
  } else if (game === 'bieden') {
    if (!bSession || (!bGift && !bSession.finished)) {
      wrap.append(startScreen());
    } else if (!bGift && bSession.finished) {
      wrap.append(biedenEndScreen());
    } else if (bGift) {
      wrap.append(biedenStatusBar(bGift));
      const table = tableGrid();
      table.append(biedenSeat(bGift, 2));
      const middle = el('div', 'table-middle');
      middle.append(biedenSeat(bGift, 1), biedenTrickArea(bGift), biedenSeat(bGift, 3));
      table.append(middle);
      table.append(biedenSeat(bGift, HUMAN));
      wrap.append(table, biedenActionPanel(bGift));
    }
  } else if (game === 'manille') {
    if (!mSession || (!mGift && !mSession.finished)) {
      wrap.append(startScreen());
    } else if (!mGift && mSession.finished) {
      wrap.append(manilleEndScreen());
    } else if (mGift) {
      wrap.append(manilleStatusBar(mGift));
      const table = tableGrid();
      table.append(manilleSeat(mGift, 2));
      const middle = el('div', 'table-middle');
      middle.append(manilleSeat(mGift, 1), manilleTrickArea(mGift), manilleSeat(mGift, 3));
      table.append(middle);
      table.append(manilleSeat(mGift, HUMAN));
      wrap.append(table, manilleActionPanel(mGift));
    }
  } else if (!session || (!gift && !session.finished)) {
    wrap.append(startScreen());
  } else if (!gift && session.finished) {
    wrap.append(endScreen());
  } else if (gift) {
    wrap.append(statusBar(gift));
    const table = tableGrid();
    table.append(seat(gift, 2));
    const middle = el('div', 'table-middle');
    middle.append(seat(gift, 1), trickArea(gift), seat(gift, 3));
    table.append(middle);
    table.append(seat(gift, HUMAN));
    wrap.append(table, actionPanel(gift));
  }
  app.append(wrap);
}

/* ---------- manillen (Fase 4b) ---------- */

const SUIT_DISPLAY_ORDER: Record<Suit, number> = { S: 0, H: 1, C: 2, D: 3 };

function manilleSortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) =>
    a.suit === b.suit
      ? strength(b.rank) - strength(a.rank)
      : SUIT_DISPLAY_ORDER[a.suit] - SUIT_DISPLAY_ORDER[b.suit],
  );
}

function mTeamName(team: number): string {
  return team === teamOf(HUMAN) ? t('team.we') : t('team.they');
}

function recordM(action: store.ManilleAction): void {
  if (!mPersisted) return;
  mPersisted.actions.push(action);
  store.saveManille(mPersisted);
}

function startManille(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  mPersisted = store.newManille(seed, botLevel, manilleOptions);
  store.saveManille(mPersisted);
  mRestored = null;
  mSession = store.replayManille(mPersisted);
  view = 'game';
  render();
  scheduleManilleBots();
}

function continueManille(): void {
  if (!mRestored) return;
  mPersisted = mRestored.state;
  mSession = mRestored.session;
  botLevel = mPersisted.botLevel;
  mRestored = null;
  view = 'game';
  render();
  scheduleManilleBots();
}

function manilleActor(): { player: number; human: boolean } | null {
  const gift = mSession?.gift;
  if (!gift) return null;
  if (gift.phase === 'trump-choice') {
    return { player: gift.trumpChooser, human: gift.trumpChooser === HUMAN };
  }
  if (gift.phase === 'play') return { player: gift.toPlay, human: gift.toPlay === HUMAN };
  return null;
}

function playManilleCard(gift: ManilleGift, player: number, card: Card): void {
  gift.playCard(player, card);
  recordM({ t: 'play', p: player, card });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.score) {
    sfxScore(gift.score.winner === teamOf(HUMAN));
  }
}

function manilleBotStep(): boolean {
  const gift = mSession?.gift;
  const who = manilleActor();
  if (!gift || !who || who.human) return false;
  if (gift.phase === 'trump-choice') {
    const suit = chooseManilleTrump(gift.hands[who.player] as Card[]);
    gift.chooseTrump(suit);
    recordM({ t: 'trump', suit });
    return true;
  }
  playManilleCard(gift, who.player, chooseManilleCard(gift, who.player, botLevel));
  return true;
}

function scheduleManilleBots(): void {
  const gen = ++generation;
  const who = manilleActor();
  if (!who || who.human) return;
  const gift = mSession?.gift;
  const pause = gift?.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'manille' || view !== 'game') return;
      if (manilleBotStep()) {
        render();
        scheduleManilleBots();
      }
    },
    pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function manilleCloseAndNext(): void {
  if (!mSession) return;
  mSession.closeGift();
  recordM({ t: 'close' });
  if (!mSession.finished) {
    mSession.nextGift();
  } else {
    recordSessionStat('manillen', botLevel, mSession.totals, teamOf(HUMAN));
    store.clearManille();
    mPersisted = null;
  }
  render();
  scheduleManilleBots();
}

function manilleStatusBar(gift: ManilleGift): HTMLElement {
  const s = mSession as ManilleSession;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('manille.gift', { n: s.giftNumber })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.dealer) })),
  );
  if (gift.trumpSuit) {
    bar.append(
      el(
        'span',
        'chip',
        t('game.trump', { suit: `${SUIT_GLYPH[gift.trumpSuit]} ${tSuit(gift.trumpSuit)}` }),
      ),
    );
  } else if (gift.phase === 'trump-choice') {
    bar.append(
      el('span', 'chip', t('manille.trumpPending', { name: playerName(gift.trumpChooser) })),
    );
  } else {
    // Zonder troef gekozen (×2).
    bar.append(el('span', 'chip strong', `${t('manille.noTrump')} ×${gift.multiplier}`));
  }
  const we = teamOf(HUMAN);
  bar.append(
    el(
      'span',
      'chip strong',
      `${t('team.we')} ${s.totals[we] ?? 0} — ${t('team.they')} ${s.totals[1 - we] ?? 0}`,
    ),
    el('span', 'chip', t('manille.target', { points: s.targetPoints })),
  );
  return bar;
}

function manilleSeat(gift: ManilleGift, player: number): HTMLElement {
  const who = manilleActor();
  const box = el('div', `seat seat-${player}${who?.player === player ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  head.append(el('span', 'seat-tricks', `${t('score.tricks')}: ${gift.tricksWon[player] ?? 0}`));
  box.append(head);
  const hand = el('div', 'hand');
  const cards = manilleSortHand(gift.hands[player] as Card[]);
  if (player === HUMAN) {
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
      hand.append(
        cardEl(card, {
          disabled: !isLegal,
          onClick: () => {
            if (!isLegal) return;
            playManilleCard(gift, HUMAN, card);
            render();
            scheduleManilleBots();
          },
        }),
      );
    }
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

function manilleTrickArea(gift: ManilleGift): HTMLElement {
  const area = el('div', 'trick');
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick as { player: number; card: Card }[]) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(cardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  return area;
}

function manilleActionPanel(gift: ManilleGift): HTMLElement {
  const panel = el('div', 'panel');
  const who = manilleActor();
  const tip = coachBox(who?.human ? manilleTip(gift, HUMAN) : null);
  if (tip) panel.append(tip);
  switch (gift.phase) {
    case 'trump-choice': {
      if (who?.human) {
        panel.append(el('p', undefined, t('manille.trumpChoose')));
        const row = el('div', 'btn-row');
        for (const suit of SUITS) {
          const red = suit === 'H' || suit === 'D';
          row.append(
            button(`${SUIT_GLYPH[suit]} ${tSuit(suit)}`, `btn${red ? ' red' : ''}`, () => {
              gift.chooseTrump(suit);
              recordM({ t: 'trump', suit });
              render();
              scheduleManilleBots();
            }),
          );
        }
        if (gift.config.multipliers) {
          row.append(
            button(t('manille.noTrump'), 'btn muted', () => {
              gift.chooseTrump(null);
              recordM({ t: 'trump', suit: null });
              render();
              scheduleManilleBots();
            }),
          );
        }
        panel.append(row);
      } else if (who) {
        panel.append(el('p', 'hint', t('manille.trumpPending', { name: playerName(who.player) })));
      }
      return panel;
    }
    case 'play': {
      panel.append(el('p', 'hint', t('manille.goal')));
      if (who?.human) panel.append(el('p', 'strong', t('play.yourTurn')));
      return panel;
    }
    case 'scored': {
      panel.append(el('h2', undefined, t('score.title')));
      const score = gift.score;
      if (score) {
        if (score.winner === null) {
          panel.append(el('p', 'failed', t('manille.tied')));
        } else {
          panel.append(
            el(
              'p',
              score.winner === teamOf(HUMAN) ? 'made' : 'failed',
              t('manille.giftWon', {
                team: mTeamName(score.winner),
                points: score.teamPoints[score.winner] ?? 0,
                score: score.score,
              }),
            ),
          );
        }
        const s = mSession as ManilleSession;
        const we = teamOf(HUMAN);
        const table = el('table', 'score-table');
        const head = el('tr');
        head.append(
          el('th'),
          el('th', undefined, t('team.we')),
          el('th', undefined, t('team.they')),
        );
        table.append(head);
        const rows: Array<[string, number, number]> = [
          [t('manille.points'), score.teamPoints[we] ?? 0, score.teamPoints[1 - we] ?? 0],
          [
            t('score.total'),
            (s.totals[we] ?? 0) + (score.winner === we ? score.score : 0),
            (s.totals[1 - we] ?? 0) + (score.winner === 1 - we ? score.score : 0),
          ],
        ];
        for (const [label, a, b] of rows) {
          const tr = el('tr');
          tr.append(el('th', undefined, label));
          tr.append(el('td', undefined, String(a)));
          tr.append(el('td', undefined, String(b)));
          table.append(tr);
        }
        panel.append(table);
      }
      panel.append(button(t('score.next'), 'btn primary', manilleCloseAndNext));
      return panel;
    }
  }
}

function manilleEndScreen(): HTMLElement {
  const s = mSession as ManilleSession;
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  const winner = (s.totals[0] ?? 0) >= (s.totals[1] ?? 0) ? 0 : 1;
  main.append(el('p', 'strong', t('manille.sessionWon', { team: mTeamName(winner) })));
  const we = teamOf(HUMAN);
  const table = el('table', 'score-table');
  const head = el('tr');
  const row = el('tr');
  head.append(el('th', undefined, t('team.we')), el('th', undefined, t('team.they')));
  row.append(
    el('td', undefined, String(s.totals[we] ?? 0)),
    el('td', undefined, String(s.totals[1 - we] ?? 0)),
  );
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startManille));
  return main;
}

/* ---------- bieden (Fase 4d) ---------- */

let biedenLog: Array<{ kind: 'bid' | 'pass'; player: number; points?: number }> = [];

function bTeamName(team: number): string {
  return team === biedenTeamOf(HUMAN) ? t('team.we') : t('team.they');
}

function recordB(action: store.BiedenAction): void {
  if (!bPersisted) return;
  bPersisted.actions.push(action);
  store.saveBieden(bPersisted);
}

function startBieden(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  bPersisted = store.newBieden(seed, botLevel);
  store.saveBieden(bPersisted);
  bRestored = null;
  bSession = store.replayBieden(bPersisted);
  biedenLog = [];
  view = 'game';
  render();
  scheduleBiedenBots();
}

function continueBieden(): void {
  if (!bRestored) return;
  bPersisted = bRestored.state;
  bSession = bRestored.session;
  botLevel = bPersisted.botLevel;
  bRestored = null;
  biedenLog = [];
  view = 'game';
  render();
  scheduleBiedenBots();
}

function biedenActor(): { player: number; human: boolean } | null {
  const gift = bSession?.gift;
  if (!gift) return null;
  if (gift.phase === 'bidding') {
    return { player: gift.bidding.toAct, human: gift.bidding.toAct === HUMAN };
  }
  if (gift.phase === 'play') return { player: gift.toPlay, human: gift.toPlay === HUMAN };
  return null;
}

function playBiedenCard(gift: BiedenGift, player: number, card: Card): void {
  gift.playCard(player, card);
  recordB({ t: 'play', p: player, card });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.score) {
    const we = biedenTeamOf(HUMAN);
    sfxScore((gift.score.points[we] ?? 0) >= 0);
  }
}

function biedenBotStep(): boolean {
  const gift = bSession?.gift;
  const who = biedenActor();
  if (!gift || !who || who.human) return false;
  if (gift.phase === 'bidding') {
    const bid = chooseBiedenBid(gift, who.player);
    gift.bidding.act(who.player, bid);
    recordB({ t: 'bid', p: who.player, bid });
    biedenLog.push(
      bid === null
        ? { kind: 'pass', player: who.player }
        : { kind: 'bid', player: who.player, points: bid },
    );
    if (gift.bidding.phase === 'done' && gift.declarer === null) gift.settle();
    return true;
  }
  playBiedenCard(gift, who.player, chooseBiedenCard(gift, who.player, botLevel));
  return true;
}

function scheduleBiedenBots(): void {
  const gen = ++generation;
  const who = biedenActor();
  if (!who || who.human) return;
  const gift = bSession?.gift;
  const pause = gift?.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'bieden' || view !== 'game') return;
      if (biedenBotStep()) {
        render();
        scheduleBiedenBots();
      }
    },
    pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function biedenCloseAndNext(): void {
  if (!bSession) return;
  bSession.closeGift();
  recordB({ t: 'close' });
  if (!bSession.finished) {
    bSession.nextGift();
    biedenLog = [];
  } else {
    recordSessionStat('bieden', botLevel, bSession.totals, biedenTeamOf(HUMAN));
    store.clearBieden();
    bPersisted = null;
  }
  render();
  scheduleBiedenBots();
}

function biedenStatusBar(gift: BiedenGift): HTMLElement {
  const s = bSession as BiedenSession;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('manille.gift', { n: s.giftNumber })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.dealer) })),
  );
  if (gift.declarer !== null && gift.bidding.highBid !== null) {
    bar.append(
      el(
        'span',
        'chip strong',
        t('bieden.declarer', { name: playerName(gift.declarer), points: gift.bidding.highBid }),
      ),
    );
  }
  if (gift.trumpSuit) {
    bar.append(
      el(
        'span',
        'chip',
        t('game.trump', { suit: `${SUIT_GLYPH[gift.trumpSuit]} ${tSuit(gift.trumpSuit)}` }),
      ),
    );
  } else if (gift.declarer !== null) {
    bar.append(el('span', 'chip', t('bieden.trumpPending', { name: playerName(gift.declarer) })));
  }
  const we = biedenTeamOf(HUMAN);
  bar.append(
    el(
      'span',
      'chip strong',
      `${t('team.we')} ${s.totals[we] ?? 0} — ${t('team.they')} ${s.totals[1 - we] ?? 0}`,
    ),
    el('span', 'chip', t('manille.target', { points: s.targetPoints })),
  );
  return bar;
}

function biedenSeat(gift: BiedenGift, player: number): HTMLElement {
  const who = biedenActor();
  const box = el('div', `seat seat-${player}${who?.player === player ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  head.append(el('span', 'seat-tricks', `${t('score.tricks')}: ${gift.tricksWon[player] ?? 0}`));
  box.append(head);
  const hand = el('div', 'hand');
  const cards = sortHand(gift.hands[player] as Card[]);
  if (player === HUMAN) {
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
      hand.append(
        cardEl(card, {
          disabled: !isLegal,
          onClick: () => {
            if (!isLegal) return;
            playBiedenCard(gift, HUMAN, card);
            render();
            scheduleBiedenBots();
          },
        }),
      );
    }
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

function biedenTrickArea(gift: BiedenGift): HTMLElement {
  const area = el('div', 'trick');
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick as { player: number; card: Card }[]) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(cardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  return area;
}

function biedenLogView(): HTMLElement {
  const list = el('div', 'bidlog');
  for (const entry of biedenLog.slice(-6)) {
    const name = playerName(entry.player);
    list.append(
      el(
        'div',
        'bidlog-line',
        entry.kind === 'bid'
          ? t('bieden.bids', { name, points: entry.points ?? 0 })
          : t('bieden.passed', { name }),
      ),
    );
  }
  return list;
}

function biedenActionPanel(gift: BiedenGift): HTMLElement {
  const panel = el('div', 'panel');
  const who = biedenActor();
  const tip = coachBox(who?.human ? biedenTip(gift, HUMAN) : null);
  if (tip) panel.append(tip);
  switch (gift.phase) {
    case 'bidding': {
      panel.append(el('h2', undefined, t('bieden.title')));
      panel.append(biedenLogView());
      if (who?.human) {
        const row = el('div', 'btn-row');
        for (const bid of gift.bidding.legalBids(HUMAN)) {
          row.append(
            button(t('bieden.bidLabel', { points: bid }), 'btn', () => {
              gift.bidding.act(HUMAN, bid);
              recordB({ t: 'bid', p: HUMAN, bid });
              biedenLog.push({ kind: 'bid', player: HUMAN, points: bid });
              if (gift.bidding.phase === 'done' && gift.declarer === null) gift.settle();
              render();
              scheduleBiedenBots();
            }),
          );
        }
        row.append(
          button(t('bieden.pass'), 'btn muted', () => {
            gift.bidding.act(HUMAN, null);
            recordB({ t: 'bid', p: HUMAN, bid: null });
            biedenLog.push({ kind: 'pass', player: HUMAN });
            if (gift.bidding.phase === 'done' && gift.declarer === null) gift.settle();
            render();
            scheduleBiedenBots();
          }),
        );
        panel.append(row);
      } else if (who) {
        panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
      }
      return panel;
    }
    case 'redeal': {
      panel.append(el('p', undefined, t('bieden.redeal')));
      panel.append(button(t('bidding.continue'), 'btn primary', biedenCloseAndNext));
      return panel;
    }
    case 'play': {
      if (gift.declarer !== null && gift.bidding.highBid !== null) {
        panel.append(
          el(
            'p',
            'hint',
            t('bieden.goal', { name: playerName(gift.declarer), points: gift.bidding.highBid }),
          ),
        );
      }
      if (who?.human) panel.append(el('p', 'strong', t('play.yourTurn')));
      return panel;
    }
    case 'scored': {
      panel.append(el('h2', undefined, t('score.title')));
      const score = gift.score;
      if (score) {
        panel.append(
          el(
            'p',
            score.made ? 'made' : 'failed',
            `${bTeamName(score.declaringTeam)} — ${score.bid}: ${score.made ? t('bieden.made') : t('bieden.failed')}`,
          ),
        );
        const s = bSession as BiedenSession;
        const we = biedenTeamOf(HUMAN);
        const table = el('table', 'score-table');
        const head = el('tr');
        head.append(
          el('th'),
          el('th', undefined, t('team.we')),
          el('th', undefined, t('team.they')),
        );
        table.append(head);
        const rows: Array<[string, number, number]> = [
          [t('manille.points'), score.teamPoints[we] ?? 0, score.teamPoints[1 - we] ?? 0],
          [t('score.points'), score.points[we] ?? 0, score.points[1 - we] ?? 0],
          [
            t('score.total'),
            (s.totals[we] ?? 0) + (score.points[we] ?? 0),
            (s.totals[1 - we] ?? 0) + (score.points[1 - we] ?? 0),
          ],
        ];
        for (const [label, a, b] of rows) {
          const tr = el('tr');
          tr.append(el('th', undefined, label));
          tr.append(el('td', undefined, formatPoints(a)));
          tr.append(el('td', undefined, formatPoints(b)));
          table.append(tr);
        }
        panel.append(table);
      }
      panel.append(button(t('score.next'), 'btn primary', biedenCloseAndNext));
      return panel;
    }
  }
}

function biedenEndScreen(): HTMLElement {
  const s = bSession as BiedenSession;
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  const winner = (s.totals[0] ?? 0) >= (s.totals[1] ?? 0) ? 0 : 1;
  main.append(el('p', 'strong', t('manille.sessionWon', { team: bTeamName(winner) })));
  const we = biedenTeamOf(HUMAN);
  const table = el('table', 'score-table');
  const head = el('tr');
  const row = el('tr');
  head.append(el('th', undefined, t('team.we')), el('th', undefined, t('team.they')));
  row.append(
    el('td', undefined, formatPoints(s.totals[we] ?? 0)),
    el('td', undefined, formatPoints(s.totals[1 - we] ?? 0)),
  );
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startBieden));
  return main;
}

/* ---------- scorebord (Fase 5: fysiek spel) ---------- */

function sbParticipantName(i: number): string {
  const name = sbBoard?.participants[i]?.trim();
  return name && name.length > 0 ? name : t('scorebord.defaultName', { n: i + 1 });
}

function numberInput(value: string, placeholder = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'numeric';
  input.className = 'sb-input';
  input.value = value;
  if (placeholder) input.placeholder = placeholder;
  return input;
}

function selectInput(
  options: Array<{ value: string; label: string }>,
  selected: string,
  onChange: (value: string) => void,
): HTMLSelectElement {
  const sel = document.createElement('select');
  sel.className = 'sb-input sb-select';
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === selected) opt.selected = true;
    sel.append(opt);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

/** Label voor een ingegeven gift, bv. "Troel — Jan + Miel · 9/8 slagen".
 *  Wordt bij élke render opnieuw opgebouwd uit scorebord.meta, zodat het label
 *  meeverandert met de taalkeuze — een opgeslagen tekst deed dat niet. */
function wiezenRoundLabel(meta: scorebord.WiezenRoundMeta): string {
  const names = meta.declarers.map((d) => sbParticipantName(d)).join(' + ');
  const tricks =
    meta.target === 0
      ? t('scorebord.tricksOfZero', { tricks: meta.tricks })
      : t('scorebord.tricksOf', { tricks: meta.tricks, target: meta.target });
  return `${tContract(meta.contractId)} — ${names} · ${tricks}`;
}

/** De gestructureerde beschrijving van een net berekende ronde. */
function wiezenRoundMeta(result: sbw.WiezenRoundResult): scorebord.WiezenRoundMeta {
  return {
    contractId: result.contract.id,
    declarers: [...result.declarers],
    tricks: result.tricks,
    target: result.contract.target.tricks,
  };
}

function scorebordSetup(): HTMLElement {
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('scorebord.title')));
  main.append(el('p', undefined, t('scorebord.intro')));

  if (sbNames.length === 0) sbNames = ['', '', '', ''];
  const wiezenMode = sbMode === 'wiezen';
  if (wiezenMode) sbCount = 4; // wiezen = altijd 4 spelers

  const modeGroup = el('div', 'control-group level-picker');
  modeGroup.append(el('span', undefined, t('scorebord.mode')));
  const modeSeg = el('div', 'seg');
  modeSeg.setAttribute('role', 'group');
  modeSeg.append(
    segButton(t('scorebord.modeManual'), sbMode === 'manueel', () => {
      sbMode = 'manueel';
      saveScorebordMode();
      render();
    }),
    segButton(t('scorebord.modeWiezen'), sbMode === 'wiezen', () => {
      sbMode = 'wiezen';
      saveScorebordMode();
      render();
    }),
  );
  modeGroup.append(modeSeg);
  main.append(modeGroup);
  if (wiezenMode) main.append(el('p', 'hint', t('scorebord.wiezenHint')));

  const countGroup = el('div', 'control-group level-picker');
  countGroup.append(el('span', undefined, t('scorebord.participants')));
  const countSeg = el('div', 'seg');
  countSeg.setAttribute('role', 'group');
  for (const n of [2, 3, 4]) {
    const btn = segButton(String(n), sbCount === n, () => {
      sbCount = n;
      render();
    });
    if (wiezenMode) btn.disabled = true;
    countSeg.append(btn);
  }
  countGroup.append(countSeg);
  main.append(countGroup);

  const nameBox = el('div', 'sb-names');
  for (let i = 0; i < sbCount; i++) {
    const row = el('div', 'control-group');
    row.append(el('span', undefined, t('scorebord.name', { n: i + 1 })));
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sb-input sb-name';
    input.value = sbNames[i] ?? '';
    input.placeholder = t('scorebord.defaultName', { n: i + 1 });
    input.addEventListener('input', () => {
      sbNames[i] = input.value;
    });
    row.append(input);
    nameBox.append(row);
  }
  main.append(nameBox);

  const targetGroup = el('div', 'control-group level-picker');
  targetGroup.append(el('span', undefined, t('scorebord.target')));
  const targetInput = numberInput(sbTarget);
  targetInput.addEventListener('input', () => {
    sbTarget = targetInput.value;
  });
  targetGroup.append(targetInput);
  main.append(targetGroup);

  const dirGroup = el('div', 'control-group level-picker');
  dirGroup.append(el('span', undefined, t('scorebord.direction')));
  const dirSeg = el('div', 'seg');
  dirSeg.setAttribute('role', 'group');
  dirSeg.append(
    segButton(t('scorebord.highWins'), !sbLowWins, () => {
      sbLowWins = false;
      render();
    }),
    segButton(t('scorebord.lowWins'), sbLowWins, () => {
      sbLowWins = true;
      render();
    }),
  );
  dirGroup.append(dirSeg);
  main.append(dirGroup);

  const row = el('div', 'btn-row');
  row.append(
    button(t('scorebord.start'), 'btn primary', () => {
      const names = Array.from({ length: sbCount }, (_, i) => sbNames[i] ?? '');
      const target = sbTarget.trim() === '' ? null : Number(sbTarget);
      sbBoard = scorebord.newScorebord(
        names,
        Number.isFinite(target) ? target : null,
        sbLowWins,
        sbMode,
      );
      scorebord.save(sbBoard);
      render();
    }),
    button(t('scorebord.back'), 'btn muted', () => {
      view = 'home';
      render();
    }),
  );
  main.append(row);
  return main;
}

function manualRoundForm(board: scorebord.Scorebord): HTMLElement {
  const form = el('div', 'sb-newround');
  form.append(el('div', 'options-title', t('scorebord.newRound')));
  const inputs: HTMLInputElement[] = [];
  const inputRow = el('div', 'sb-inputs');
  for (let i = 0; i < board.participants.length; i++) {
    const cell = el('div', 'sb-inputcell');
    cell.append(el('div', 'trick-player', sbParticipantName(i)));
    const input = numberInput('', '0');
    inputs.push(input);
    cell.append(input);
    inputRow.append(cell);
  }
  form.append(inputRow);
  form.append(
    button(t('scorebord.add'), 'btn primary', () => {
      const points = inputs.map((inp) => {
        const n = Number(inp.value);
        return Number.isFinite(n) ? n : 0;
      });
      sbBoard = scorebord.addRound(board, points);
      scorebord.save(sbBoard);
      sfxCard();
      render();
    }),
  );
  return form;
}

/** Huidige maatkeuze, gecorrigeerd voor het gekozen contract. */
function currentPartner(): number {
  if (sbWPartner === sbw.ALONE) {
    // "Alleen" bestaat enkel na een vraag; elders valt hij terug op de overbuur.
    return sbw.canGoAlone(sbWContract) ? sbw.ALONE : (sbWDeclarer + 2) % 4;
  }
  return sbWPartner === sbWDeclarer ? (sbWDeclarer + 2) % 4 : sbWPartner;
}

function wiezenRoundForm(board: scorebord.Scorebord): HTMLElement {
  const form = el('div', 'sb-newround');
  form.append(el('div', 'options-title', t('scorebord.newRound')));
  const isTeam = sbw.needsPartner(sbWContract);
  const playerOptions = board.participants.map((_, i) => ({
    value: String(i),
    label: sbParticipantName(i),
  }));

  const rows = el('div', 'sb-wiezen');

  const cGroup = el('div', 'control-group');
  cGroup.append(el('span', undefined, t('scorebord.contract')));
  cGroup.append(
    selectInput(
      sbw.scorebordContracts().map((c) => ({ value: c.id, label: tContract(c.id) })),
      sbWContract,
      (v) => {
        sbWContract = v;
        render();
      },
    ),
  );
  rows.append(cGroup);

  const dGroup = el('div', 'control-group');
  dGroup.append(el('span', undefined, t('scorebord.declarer')));
  dGroup.append(
    selectInput(playerOptions, String(sbWDeclarer), (v) => {
      sbWDeclarer = Number(v);
      render();
    }),
  );
  rows.append(dGroup);

  const partner = currentPartner();
  if (isTeam) {
    // Na een vraag kan niemand meegaan: dan speelt de vrager alleen (§5.2).
    const options = playerOptions.filter((o) => Number(o.value) !== sbWDeclarer);
    if (sbw.canGoAlone(sbWContract)) {
      options.unshift({ value: String(sbw.ALONE), label: t('scorebord.alone') });
    }
    const pGroup = el('div', 'control-group');
    pGroup.append(el('span', undefined, t('scorebord.partner')));
    pGroup.append(
      selectInput(options, String(partner), (v) => {
        sbWPartner = Number(v);
        render();
      }),
    );
    rows.append(pGroup);
  }

  if (sbw.asksAceLed(sbWContract)) {
    // Troel: kwam de vierde aas uit? Zo niet, dan ligt het doel een slag hoger.
    const aceGroup = el('div', 'control-group');
    aceGroup.append(el('span', undefined, t('scorebord.troelAce')));
    const aceSeg = el('div', 'seg');
    aceSeg.setAttribute('role', 'group');
    aceSeg.append(
      segButton(t('opt.yes'), sbWAceLed, () => {
        sbWAceLed = true;
        render();
      }),
      segButton(t('opt.no'), !sbWAceLed, () => {
        sbWAceLed = false;
        render();
      }),
    );
    aceGroup.append(aceSeg);
    rows.append(aceGroup);
  }

  const tGroup = el('div', 'control-group');
  tGroup.append(el('span', undefined, t('scorebord.tricks')));
  const tricksInput = numberInput(sbWTricks, '0');
  tricksInput.addEventListener('input', () => {
    sbWTricks = tricksInput.value;
  });
  tGroup.append(tricksInput);
  rows.append(tGroup);

  form.append(rows);

  // Toon meteen welk contract er gerekend wordt en wat het doel is.
  const preview = sbw.computeWiezenRound({
    contractId: sbWContract,
    declarer: sbWDeclarer,
    partner,
    tricks: Number(sbWTricks) || 0,
    aceLed: sbWAceLed,
  });
  const target = preview.contract.target;
  form.append(
    el(
      'p',
      'hint',
      target.tricks === 0
        ? `${tContract(preview.contract.id)} — ${t('play.goalZero')}`
        : `${tContract(preview.contract.id)} — ${
            target.combined
              ? t('play.goalTogether', { tricks: target.tricks })
              : t('play.goal', { tricks: target.tricks })
          }`,
    ),
  );

  form.append(
    button(t('scorebord.add'), 'btn primary', () => {
      const tricks = Number(sbWTricks);
      const result = sbw.computeWiezenRound({
        contractId: sbWContract,
        declarer: sbWDeclarer,
        partner: currentPartner(),
        tricks: Number.isFinite(tricks) ? tricks : 0,
        aceLed: sbWAceLed,
      });
      const meta = wiezenRoundMeta(result);
      sbBoard = scorebord.addRound(board, result.points, wiezenRoundLabel(meta), meta);
      scorebord.save(sbBoard);
      sbWTricks = '';
      sbWAceLed = true;
      sfxCard();
      render();
    }),
  );
  return form;
}

function scorebordBoard(board: scorebord.Scorebord): HTMLElement {
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('scorebord.title')));

  const totals = scorebord.totals(board);
  const win = scorebord.winner(board);
  const lead = scorebord.leader(board);
  if (win !== null) {
    main.append(
      el(
        'p',
        'strong made',
        t('scorebord.winner', { name: sbParticipantName(win), points: totals[win] ?? 0 }),
      ),
    );
  } else if (lead >= 0) {
    main.append(el('p', 'hint', t('scorebord.leader', { name: sbParticipantName(lead) })));
  }

  const table = el('table', 'score-table sb-table');
  const head = el('tr');
  head.append(el('th', undefined, '#'));
  for (let i = 0; i < board.participants.length; i++) {
    head.append(el('th', undefined, sbParticipantName(i)));
  }
  head.append(el('th'));
  table.append(head);

  board.rounds.forEach((r, idx) => {
    const tr = el('tr');
    // Gestructureerde rondes krijgen hun label in de huidige taal; oudere
    // borden vallen terug op de tekst die toen bewaard werd.
    const meta = board.meta[idx];
    const stored = board.labels[idx];
    const label = meta ? wiezenRoundLabel(meta) : stored;
    tr.append(el('th', 'sb-roundlabel', label && label.length > 0 ? label : String(idx + 1)));
    for (let i = 0; i < board.participants.length; i++) {
      tr.append(el('td', undefined, formatPoints(r[i] ?? 0)));
    }
    const del = el('td');
    const btn = button('✕', 'btn muted sb-del', () => {
      sbBoard = scorebord.removeRound(board, idx);
      scorebord.save(sbBoard);
      render();
    });
    btn.setAttribute('aria-label', t('scorebord.deleteRound'));
    del.append(btn);
    tr.append(del);
    table.append(tr);
  });

  const totalRow = el('tr', 'sb-total');
  totalRow.append(el('th', undefined, t('scorebord.total')));
  for (let i = 0; i < board.participants.length; i++) {
    totalRow.append(el('td', undefined, formatPoints(totals[i] ?? 0)));
  }
  totalRow.append(el('td'));
  table.append(totalRow);
  main.append(table);

  if (board.rounds.length === 0) main.append(el('p', 'hint', t('scorebord.empty')));

  // Modus wisselen op een lopend bord: koos je bij de start de verkeerde, dan
  // moest je vroeger opnieuw beginnen en was je stand weg.
  const modeGroup = el('div', 'control-group');
  modeGroup.append(el('span', undefined, t('scorebord.mode')));
  const modeSeg = el('div', 'seg');
  modeSeg.setAttribute('role', 'group');
  modeSeg.append(
    segButton(t('scorebord.modeManual'), board.mode === 'manueel', () => {
      sbBoard = scorebord.setMode(board, 'manueel');
      sbMode = 'manueel';
      saveScorebordMode();
      scorebord.save(sbBoard);
      render();
    }),
  );
  const wiezenBtn = segButton(t('scorebord.modeWiezen'), board.mode === 'wiezen', () => {
    sbBoard = scorebord.setMode(board, 'wiezen');
    sbMode = 'wiezen';
    saveScorebordMode();
    scorebord.save(sbBoard);
    render();
  });
  if (!scorebord.canUseWiezenMode(board)) wiezenBtn.disabled = true;
  modeSeg.append(wiezenBtn);
  modeGroup.append(modeSeg);
  main.append(modeGroup);
  if (!scorebord.canUseWiezenMode(board)) {
    main.append(el('p', 'hint', t('scorebord.wiezenNeedsFour')));
  }

  main.append(board.mode === 'wiezen' ? wiezenRoundForm(board) : manualRoundForm(board));

  const row = el('div', 'btn-row');
  row.append(
    button(t('scorebord.reset'), 'btn', () => {
      sbBoard = scorebord.resetRounds(board);
      scorebord.save(sbBoard);
      render();
    }),
    button(t('scorebord.new'), 'btn muted', () => {
      scorebord.clear();
      sbBoard = null;
      render();
    }),
    button(t('scorebord.back'), 'btn muted', () => {
      view = 'home';
      render();
    }),
  );
  main.append(row);
  return main;
}

/* ---------- klaverjassen ---------- */

function recordK(action: store.KlaverjasAction): void {
  if (!kPersisted) return;
  kPersisted.actions.push(action);
  store.saveKlaverjas(kPersisted);
}

function startKlaverjas(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  kPersisted = store.newKlaverjas(seed, botLevel, klaverjasConfig);
  store.saveKlaverjas(kPersisted);
  kRestored = null;
  kSession = store.replayKlaverjas(kPersisted);
  view = 'game';
  render();
  scheduleKlaverjasBots();
}

function continueKlaverjas(): void {
  if (!kRestored) return;
  kPersisted = kRestored.state;
  kSession = kRestored.session;
  botLevel = kPersisted.botLevel;
  klaverjasConfig = kPersisted.config;
  kRestored = null;
  view = 'game';
  render();
  scheduleKlaverjasBots();
}

function klaverjasActor(): { player: number; human: boolean } | null {
  const gift = kSession?.gift;
  if (!gift) return null;
  if (gift.phase === 'trump-choice') {
    return { player: gift.chooser, human: gift.chooser === HUMAN };
  }
  if (gift.phase === 'play') return { player: gift.toPlay, human: gift.toPlay === HUMAN };
  return null;
}

function playKlaverjasCard(gift: KlaverjasGift, player: number, card: Card): void {
  gift.playCard(player, card);
  recordK({ t: 'play', p: player, card });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.score) {
    sfxScore(gift.score.made === (gift.score.declaringTeam === kTeamOf(HUMAN)));
  }
}

function klaverjasBotStep(): boolean {
  const gift = kSession?.gift;
  const who = klaverjasActor();
  if (!gift || !who || who.human) return false;
  if (gift.phase === 'trump-choice') {
    const hand = gift.hands[who.player] as Card[];
    if (chooseKlaverjasPass(gift, hand, botLevel)) {
      gift.pass();
      recordK({ t: 'pass' });
    } else {
      const suit = chooseKlaverjasTrump(hand).suit;
      gift.chooseTrump(suit);
      recordK({ t: 'trump', suit });
    }
    return true;
  }
  playKlaverjasCard(gift, who.player, chooseKlaverjasCard(gift, who.player, botLevel));
  return true;
}

function scheduleKlaverjasBots(): void {
  const gen = ++generation;
  const who = klaverjasActor();
  if (!who || who.human) return;
  const gift = kSession?.gift;
  const pause = gift?.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'klaverjassen' || view !== 'game') return;
      if (klaverjasBotStep()) {
        render();
        scheduleKlaverjasBots();
      }
    },
    pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function klaverjasCloseAndNext(): void {
  if (!kSession) return;
  kSession.closeGift();
  recordK({ t: 'close' });
  if (!kSession.finished) {
    kSession.nextGift();
  } else {
    recordSessionStat('klaverjassen', botLevel, kSession.totals, kTeamOf(HUMAN));
    store.clearKlaverjas();
    kPersisted = null;
  }
  render();
  scheduleKlaverjasBots();
}

function klaverjasStatusBar(gift: KlaverjasGift): HTMLElement {
  const s = kSession as KlaverjasSession;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('klaverjas.round', { n: s.roundNumber })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.dealer) })),
  );
  if (gift.trumpSuit) {
    bar.append(
      el(
        'span',
        'chip',
        t('game.trump', { suit: `${SUIT_GLYPH[gift.trumpSuit]} ${tSuit(gift.trumpSuit)}` }),
      ),
    );
    if (gift.declarer !== null) {
      bar.append(el('span', 'chip', t('klaverjas.declarer', { name: playerName(gift.declarer) })));
    }
  } else {
    bar.append(el('span', 'chip', t('klaverjas.trumpPending', { name: playerName(gift.chooser) })));
  }
  const we = kTeamOf(HUMAN);
  bar.append(
    el(
      'span',
      'chip strong',
      `${t('team.we')} ${s.totals[we] ?? 0} — ${t('team.they')} ${s.totals[1 - we] ?? 0}`,
    ),
  );
  return bar;
}

function klaverjasSeat(gift: KlaverjasGift, player: number): HTMLElement {
  const who = klaverjasActor();
  const box = el('div', `seat seat-${player}${who?.player === player ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  head.append(el('span', 'seat-tricks', `${t('score.tricks')}: ${gift.tricksWon[player] ?? 0}`));
  box.append(head);
  const hand = el('div', 'hand');
  const cards = sortHand(gift.hands[player] as Card[]);
  if (player === HUMAN) {
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
      hand.append(
        cardEl(card, {
          disabled: !isLegal,
          onClick: () => {
            if (!isLegal) return;
            playKlaverjasCard(gift, HUMAN, card);
            render();
            scheduleKlaverjasBots();
          },
        }),
      );
    }
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

function klaverjasTrickArea(gift: KlaverjasGift): HTMLElement {
  const area = el('div', 'trick');
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick as { player: number; card: Card }[]) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(cardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  // Roem van de vorige slag meteen melden — anders zie je alleen het eindtotaal.
  if (showLast && gift.lastRoem.length > 0) {
    area.append(el('div', 'trick-label strong', roemLine(gift.lastRoem)));
  }
  return area;
}

/** "Roem: 20 (drie op volgorde)" — de reden erbij, anders is het een raadsel. */
function roemLine(details: RoemDetail[]): string {
  const total = details.reduce((sum, d) => sum + d.points, 0);
  const namen = details.map((d) => t(`klaverjas.roem.${d.kind}` as MessageKey)).join(', ');
  return t('klaverjas.roemLine', { points: total, kinds: namen });
}

function klaverjasActionPanel(gift: KlaverjasGift): HTMLElement {
  const panel = el('div', 'panel');
  const who = klaverjasActor();
  const tip = coachBox(who?.human ? klaverjasTip(gift, HUMAN) : null);
  if (tip) panel.append(tip);

  if (gift.phase === 'trump-choice') {
    if (who?.human) {
      panel.append(
        el(
          'p',
          undefined,
          gift.mustChoose ? t('klaverjas.mustChoose') : t('klaverjas.chooseOrPass'),
        ),
      );
      const row = el('div', 'btn-row');
      for (const suit of SUITS) {
        const red = suit === 'H' || suit === 'D';
        row.append(
          button(`${SUIT_GLYPH[suit]} ${tSuit(suit)}`, `btn${red ? ' red' : ''}`, () => {
            gift.chooseTrump(suit);
            recordK({ t: 'trump', suit });
            render();
            scheduleKlaverjasBots();
          }),
        );
      }
      if (!gift.mustChoose) {
        row.append(
          button(t('bidding.pass'), 'btn muted', () => {
            gift.pass();
            recordK({ t: 'pass' });
            render();
            scheduleKlaverjasBots();
          }),
        );
      }
      panel.append(row);
    } else if (who) {
      panel.append(el('p', 'hint', t('klaverjas.trumpPending', { name: playerName(who.player) })));
    }
    return panel;
  }

  if (gift.phase === 'scored' && gift.score) {
    const s = gift.score;
    const we = kTeamOf(HUMAN);
    panel.append(
      el(
        'h2',
        undefined,
        s.made
          ? t('klaverjas.made', { team: s.declaringTeam === we ? t('team.we') : t('team.they') })
          : t('klaverjas.nat', { team: s.declaringTeam === we ? t('team.we') : t('team.they') }),
      ),
    );
    if (s.pit) panel.append(el('p', 'strong made', t('klaverjas.pit')));
    const table = el('table', 'score-table');
    const head = el('tr');
    head.append(el('th'), el('th', undefined, t('team.we')), el('th', undefined, t('team.they')));
    table.append(head);
    const rij = (label: string, waarden: number[]) => {
      const tr = el('tr');
      tr.append(el('th', undefined, label));
      tr.append(el('td', undefined, String(waarden[we] ?? 0)));
      tr.append(el('td', undefined, String(waarden[1 - we] ?? 0)));
      table.append(tr);
    };
    rij(t('klaverjas.cardPoints'), s.cardPoints);
    rij(t('klaverjas.roemTotal'), s.roem);
    rij(t('klaverjas.roundTotal'), s.points);
    panel.append(table);
    panel.append(
      button(t('score.next'), 'btn primary', () => {
        klaverjasCloseAndNext();
      }),
    );
    return panel;
  }

  if (who && !who.human) {
    panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
  } else if (who?.human) {
    panel.append(el('p', 'hint', t('play.yourTurn')));
  }
  panel.append(el('p', 'hint', t('klaverjas.goal')));
  return panel;
}

function klaverjasEndScreen(): HTMLElement {
  const s = kSession as KlaverjasSession;
  const we = kTeamOf(HUMAN);
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  const mine = s.totals[we] ?? 0;
  const theirs = s.totals[1 - we] ?? 0;
  main.append(
    el(
      'p',
      'strong',
      t('manille.sessionWon', {
        team: mine >= theirs ? t('team.we') : t('team.they'),
      }),
    ),
  );
  const table = el('table', 'score-table');
  const head = el('tr');
  head.append(el('th'), el('th', undefined, t('team.we')), el('th', undefined, t('team.they')));
  const row = el('tr');
  row.append(el('th', undefined, t('score.points')));
  row.append(el('td', undefined, String(mine)));
  row.append(el('td', undefined, String(theirs)));
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startKlaverjas));
  return main;
}

/* ---------- belote ---------- */

function recordB2(action: store.BeloteAction): void {
  if (!blPersisted) return;
  blPersisted.actions.push(action);
  store.saveBelote(blPersisted);
}

function startBelote(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  blPersisted = store.newBelote(seed, botLevel, beloteConfig);
  store.saveBelote(blPersisted);
  blRestored = null;
  blSession = store.replayBelote(blPersisted);
  view = 'game';
  render();
  scheduleBeloteBots();
}

function continueBelote(): void {
  if (!blRestored) return;
  blPersisted = blRestored.state;
  blSession = blRestored.session;
  botLevel = blPersisted.botLevel;
  beloteConfig = blPersisted.config;
  blRestored = null;
  view = 'game';
  render();
  scheduleBeloteBots();
}

function beloteActor(): { player: number; human: boolean } | null {
  const gift = blSession?.gift;
  if (!gift) return null;
  if (gift.phase === 'bidding') {
    return { player: gift.toAct, human: gift.toAct === HUMAN };
  }
  if (gift.phase === 'play') return { player: gift.toPlay, human: gift.toPlay === HUMAN };
  return null;
}

function playBeloteCard(gift: BeloteGift, player: number, card: Card): void {
  gift.playCard(player, card);
  recordB2({ t: 'play', p: player, card });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.score) {
    sfxScore(gift.score.made === (gift.score.takingTeam === blTeamOf(HUMAN)));
  }
}

function beloteBotStep(): boolean {
  const gift = blSession?.gift;
  const who = beloteActor();
  if (!gift || !who || who.human) return false;
  if (gift.phase === 'bidding') {
    const suit = chooseBeloteTake(gift, who.player);
    if (suit) {
      gift.take(suit);
      recordB2({ t: 'take', suit });
    } else {
      gift.pass();
      recordB2({ t: 'pass' });
    }
    return true;
  }
  playBeloteCard(gift, who.player, chooseBeloteCard(gift, who.player, botLevel));
  return true;
}

function scheduleBeloteBots(): void {
  const gen = ++generation;
  const who = beloteActor();
  if (!who || who.human) return;
  const gift = blSession?.gift;
  const pause = gift?.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'belote' || view !== 'game') return;
      if (beloteBotStep()) {
        render();
        scheduleBeloteBots();
      }
    },
    pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function beloteCloseAndNext(): void {
  if (!blSession) return;
  blSession.closeGift();
  recordB2({ t: 'close' });
  if (!blSession.finished) {
    blSession.nextGift();
  } else {
    recordSessionStat('belote', botLevel, blSession.totals, blTeamOf(HUMAN));
    store.clearBelote();
    blPersisted = null;
  }
  render();
  scheduleBeloteBots();
}

function beloteStatusBar(gift: BeloteGift): HTMLElement {
  const s = blSession as BeloteSession;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('belote.roundNo', { n: s.roundNumber })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.dealer) })),
  );
  if (gift.trumpSuit) {
    bar.append(
      el(
        'span',
        'chip',
        t('game.trump', { suit: `${SUIT_GLYPH[gift.trumpSuit]} ${tSuit(gift.trumpSuit)}` }),
      ),
    );
    if (gift.taker !== null) {
      bar.append(el('span', 'chip', t('belote.taker', { name: playerName(gift.taker) })));
    }
  } else {
    bar.append(el('span', 'chip', t('belote.turned', { card: cardText(gift.turnedCard) })));
    bar.append(el('span', 'chip', t('belote.round', { n: gift.biddingRound })));
  }
  const we = blTeamOf(HUMAN);
  bar.append(
    el(
      'span',
      'chip strong',
      `${t('team.we')} ${s.totals[we] ?? 0} — ${t('team.they')} ${s.totals[1 - we] ?? 0}`,
    ),
  );
  return bar;
}

function beloteSeat(gift: BeloteGift, player: number): HTMLElement {
  const who = beloteActor();
  const box = el('div', `seat seat-${player}${who?.player === player ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  head.append(el('span', 'seat-tricks', `${t('score.tricks')}: ${gift.tricksWon[player] ?? 0}`));
  box.append(head);
  const hand = el('div', 'hand');
  const cards = sortHand(gift.hands[player] as Card[]);
  if (player === HUMAN) {
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
      hand.append(
        cardEl(card, {
          disabled: !isLegal,
          onClick: () => {
            if (!isLegal) return;
            playBeloteCard(gift, HUMAN, card);
            render();
            scheduleBeloteBots();
          },
        }),
      );
    }
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

function beloteTrickArea(gift: BeloteGift): HTMLElement {
  const area = el('div', 'trick');
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick as { player: number; card: Card }[]) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(cardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  return area;
}

/** "Annonces: 70 (tierce, cinquante)" — bij belote komen ze uit de hand, niet uit
 *  de slag; zonder die regel weet je niet waar de extra punten vandaan komen. */
function annonceLine(list: Annonce[]): string {
  const total = list.reduce((sum, a) => sum + a.points, 0);
  const namen = list.map((a) => t(`belote.annonce.${a.kind}` as MessageKey)).join(', ');
  return t('belote.annonceLine', { points: total, kinds: namen });
}

function beloteActionPanel(gift: BeloteGift): HTMLElement {
  const panel = el('div', 'panel');
  const who = beloteActor();
  // Annonces zijn bij belote handinformatie: meld ze zodra de troef vastligt.
  if (gift.phase === 'play' && (gift.declared[HUMAN]?.length ?? 0) > 0) {
    panel.append(el('p', 'hint strong', annonceLine(gift.declared[HUMAN] as Annonce[])));
  }

  if (gift.phase === 'bidding') {
    if (who?.human) {
      panel.append(
        el(
          'p',
          undefined,
          gift.biddingRound === 1
            ? t('belote.takeTurned', { card: cardText(gift.turnedCard) })
            : t('belote.nameSuit'),
        ),
      );
      const row = el('div', 'btn-row');
      for (const suit of gift.legalTakes()) {
        const red = suit === 'H' || suit === 'D';
        row.append(
          button(`${SUIT_GLYPH[suit]} ${tSuit(suit)}`, `btn${red ? ' red' : ''}`, () => {
            gift.take(suit);
            recordB2({ t: 'take', suit });
            render();
            scheduleBeloteBots();
          }),
        );
      }
      row.append(
        button(t('bidding.pass'), 'btn muted', () => {
          gift.pass();
          recordB2({ t: 'pass' });
          render();
          scheduleBeloteBots();
        }),
      );
      panel.append(row);
    } else if (who) {
      panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
    }
    return panel;
  }

  if (gift.phase === 'redeal') {
    panel.append(el('p', undefined, t('belote.redeal')));
    panel.append(button(t('bidding.continue'), 'btn primary', () => beloteCloseAndNext()));
    return panel;
  }

  if (gift.phase === 'scored' && gift.score) {
    const s = gift.score;
    const we = blTeamOf(HUMAN);
    panel.append(
      el(
        'h2',
        undefined,
        s.made
          ? t('belote.made', { team: s.takingTeam === we ? t('team.we') : t('team.they') })
          : t('belote.nat', { team: s.takingTeam === we ? t('team.we') : t('team.they') }),
      ),
    );
    if (s.capot) panel.append(el('p', 'strong made', t('belote.capot')));
    const table = el('table', 'score-table');
    const head = el('tr');
    head.append(el('th'), el('th', undefined, t('team.we')), el('th', undefined, t('team.they')));
    table.append(head);
    const rij = (label: string, waarden: number[]) => {
      const tr = el('tr');
      tr.append(el('th', undefined, label));
      tr.append(el('td', undefined, String(waarden[we] ?? 0)));
      tr.append(el('td', undefined, String(waarden[1 - we] ?? 0)));
      table.append(tr);
    };
    rij(t('belote.cardPoints'), s.cardPoints);
    rij(t('belote.annonceTotal'), s.annonces);
    rij(t('belote.beloteTotal'), s.belote);
    rij(t('belote.roundTotal'), s.points);
    panel.append(table);
    panel.append(
      button(t('score.next'), 'btn primary', () => {
        beloteCloseAndNext();
      }),
    );
    return panel;
  }

  if (who && !who.human) {
    panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
  } else if (who?.human) {
    panel.append(el('p', 'hint', t('play.yourTurn')));
  }
  panel.append(el('p', 'hint', t('belote.goal')));
  return panel;
}

function beloteEndScreen(): HTMLElement {
  const s = blSession as BeloteSession;
  const we = blTeamOf(HUMAN);
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  const mine = s.totals[we] ?? 0;
  const theirs = s.totals[1 - we] ?? 0;
  main.append(
    el(
      'p',
      'strong',
      t('manille.sessionWon', {
        team: mine >= theirs ? t('team.we') : t('team.they'),
      }),
    ),
  );
  const table = el('table', 'score-table');
  const head = el('tr');
  head.append(el('th'), el('th', undefined, t('team.we')), el('th', undefined, t('team.they')));
  const row = el('tr');
  row.append(el('th', undefined, t('score.points')));
  row.append(el('td', undefined, String(mine)));
  row.append(el('td', undefined, String(theirs)));
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startBelote));
  return main;
}

/* ---------- hartenjagen ---------- */

function recordHJ(action: store.HartenAction): void {
  if (!hjPersisted) return;
  hjPersisted.actions.push(action);
  store.saveHarten(hjPersisted);
}

function startHarten(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  hjPersisted = store.newHarten(seed, botLevel, hartenConfig);
  store.saveHarten(hjPersisted);
  hjRestored = null;
  hjSelected = [];
  hjSession = store.replayHarten(hjPersisted);
  view = 'game';
  render();
  scheduleHartenBots();
}

function continueHarten(): void {
  if (!hjRestored) return;
  hjPersisted = hjRestored.state;
  hjSession = hjRestored.session;
  botLevel = hjPersisted.botLevel;
  hartenConfig = hjPersisted.config;
  hjRestored = null;
  hjSelected = [];
  view = 'game';
  render();
  scheduleHartenBots();
}

/** Wie is er aan zet? Tijdens het doorgeven kiest iedereen tegelijk, dus dan
 *  telt enkel of de mens zelf nog moet kiezen. */
function hartenActor(): { player: number; human: boolean } | null {
  const gift = hjSession?.gift;
  if (!gift) return null;
  if (gift.phase === 'passing') {
    const wachtend = gift.pendingPassers();
    if (wachtend.length === 0) return null;
    const eerste = wachtend.includes(HUMAN) ? HUMAN : (wachtend[0] as number);
    return { player: eerste, human: eerste === HUMAN };
  }
  if (gift.phase === 'play') return { player: gift.toPlay, human: gift.toPlay === HUMAN };
  return null;
}

function playHartenCard(gift: HartenGift, player: number, card: Card): void {
  gift.playCard(player, card);
  recordHJ({ t: 'play', p: player, card });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.score) {
    // "Goed" is hier: zo weinig mogelijk strafpunten — onder je eerlijke deel.
    sfxScore((gift.score.points[HUMAN] ?? 0) <= TOTAL_PENALTY / PLAYER_COUNT);
  }
}

function hartenBotStep(): boolean {
  const gift = hjSession?.gift;
  if (!gift) return false;
  if (gift.phase === 'passing') {
    const wachtend = gift.pendingPassers().filter((p) => p !== HUMAN);
    const p = wachtend[0];
    if (p === undefined) return false;
    const cards = chooseHartenPass(gift, p, botLevel);
    gift.selectPass(p, cards);
    recordHJ({ t: 'pass', p, cards });
    return true;
  }
  const who = hartenActor();
  if (!who || who.human) return false;
  playHartenCard(gift, who.player, chooseHartenCard(gift, who.player, botLevel));
  return true;
}

function scheduleHartenBots(): void {
  const gen = ++generation;
  const gift = hjSession?.gift;
  if (!gift) return;
  const passing = gift.phase === 'passing' && gift.pendingPassers().some((p) => p !== HUMAN);
  const who = hartenActor();
  if (!passing && (!who || who.human)) return;
  const pause = gift.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'hartenjagen' || view !== 'game') return;
      if (hartenBotStep()) {
        render();
        scheduleHartenBots();
      }
    },
    pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function hartenCloseAndNext(): void {
  if (!hjSession) return;
  hjSession.closeGift();
  recordHJ({ t: 'close' });
  hjSelected = [];
  if (!hjSession.finished) {
    hjSession.nextGift();
  } else {
    // Bij hartenjagen wint de láágste score — dat moet de statistiek weten.
    recordSessionStat('hartenjagen', botLevel, hjSession.totals, HUMAN, true);
    store.clearHarten();
    hjPersisted = null;
  }
  render();
  scheduleHartenBots();
}

function hartenStatusBar(gift: HartenGift): HTMLElement {
  const s = hjSession as HartenSession;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('harten.roundNo', { n: s.roundNumber })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.dealer) })),
    el(
      'span',
      'chip',
      t('harten.passChip', { dir: t(`harten.pass.${gift.passDirection}` as MessageKey) }),
    ),
  );
  if (gift.phase !== 'passing') {
    bar.append(el('span', 'chip', gift.heartsBroken ? t('harten.broken') : t('harten.notBroken')));
  }
  bar.append(
    el('span', 'chip strong', s.totals.map((n, p) => `${playerName(p)} ${n}`).join(' — ')),
  );
  return bar;
}

function hartenSeat(gift: HartenGift, player: number): HTMLElement {
  const who = hartenActor();
  const passing = gift.phase === 'passing';
  const actief = passing ? gift.selected[player] === null : who?.player === player;
  const box = el('div', `seat seat-${player}${actief ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  head.append(el('span', 'seat-tricks', `${t('harten.penalty')}: ${gift.penalties[player] ?? 0}`));
  box.append(head);
  const hand = el('div', 'hand');
  const cards = sortHand(gift.hands[player] as Card[]);
  if (player === HUMAN) {
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      if (passing) {
        // Tijdens het doorgeven tik je drie kaarten aan; een tweede tik haalt ze
        // weer weg. Wie al gekozen heeft, kan niets meer wijzigen.
        const gekozen = hjSelected.some((c) => c.suit === card.suit && c.rank === card.rank);
        const vast = gift.selected[HUMAN] !== null;
        const btn = cardEl(card, {
          disabled: vast || (!gekozen && hjSelected.length >= PASS_COUNT),
          onClick: () => {
            hjSelected = gekozen
              ? hjSelected.filter((c) => !(c.suit === card.suit && c.rank === card.rank))
              : [...hjSelected, card];
            render();
          },
        });
        if (gekozen) btn.classList.add('selected');
        hand.append(btn);
        continue;
      }
      const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
      hand.append(
        cardEl(card, {
          disabled: !isLegal,
          onClick: () => {
            if (!isLegal) return;
            playHartenCard(gift, HUMAN, card);
            render();
            scheduleHartenBots();
          },
        }),
      );
    }
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

function hartenTrickArea(gift: HartenGift): HTMLElement {
  const area = el('div', 'trick');
  if (gift.phase === 'passing') {
    area.append(el('div', 'trick-label', t(`harten.pass.${gift.passDirection}` as MessageKey)));
    return area;
  }
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick as { player: number; card: Card }[]) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(cardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  return area;
}

function hartenActionPanel(gift: HartenGift): HTMLElement {
  const panel = el('div', 'panel');
  const who = hartenActor();
  const tip = coachBox(who?.human ? hartenTip(gift, HUMAN) : null);
  if (tip) panel.append(tip);

  if (gift.phase === 'passing') {
    if (gift.selected[HUMAN] === null) {
      panel.append(
        el(
          'p',
          undefined,
          t('harten.passPrompt', {
            n: PASS_COUNT,
            dir: t(`harten.pass.${gift.passDirection}` as MessageKey),
          }),
        ),
      );
      const knop = button(
        t('harten.passConfirm', { n: hjSelected.length, total: PASS_COUNT }),
        'btn primary',
        () => {
          if (hjSelected.length !== PASS_COUNT) return;
          const cards = [...hjSelected];
          hjSelected = [];
          gift.selectPass(HUMAN, cards);
          recordHJ({ t: 'pass', p: HUMAN, cards });
          render();
          scheduleHartenBots();
        },
      );
      knop.disabled = hjSelected.length !== PASS_COUNT;
      panel.append(knop);
    } else {
      panel.append(el('p', 'hint', t('harten.passWaiting')));
    }
    return panel;
  }

  if (gift.phase === 'scored' && gift.score) {
    const s = gift.score;
    const total = hjSession as HartenSession;
    panel.append(el('h2', undefined, t('harten.roundDone')));
    if (s.moonShooter !== null) {
      panel.append(el('p', 'strong made', t('harten.moon', { name: playerName(s.moonShooter) })));
    }
    const table = el('table', 'score-table');
    const head = el('tr');
    head.append(el('th'));
    for (let p = 0; p < PLAYER_COUNT; p++) head.append(el('th', undefined, playerName(p)));
    table.append(head);
    const rij = (label: string, waarde: (p: number) => string) => {
      const tr = el('tr');
      tr.append(el('th', undefined, label));
      for (let p = 0; p < PLAYER_COUNT; p++) tr.append(el('td', undefined, waarde(p)));
      table.append(tr);
    };
    rij(t('harten.penalty'), (p) => String(s.penalties[p] ?? 0));
    rij(t('harten.roundTotal'), (p) => String(s.points[p] ?? 0));
    rij(t('score.total'), (p) => String((total.totals[p] ?? 0) + (s.points[p] ?? 0)));
    panel.append(table);
    panel.append(button(t('score.next'), 'btn primary', () => hartenCloseAndNext()));
    return panel;
  }

  // Wat je zonet kreeg blijft handig zolang de eerste slag loopt.
  if (gift.firstTrick && (gift.received[HUMAN]?.length ?? 0) > 0) {
    const line = el('p', 'hint strong', `${t('harten.received')} `);
    for (const card of gift.received[HUMAN] as Card[]) line.append(cardEl(card));
    panel.append(line);
  }
  if (who && !who.human) {
    panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
  } else if (who?.human) {
    panel.append(el('p', 'hint', t('play.yourTurn')));
  }
  panel.append(el('p', 'hint', t('harten.goal', { n: hartenConfig.targetPoints })));
  return panel;
}

function hartenEndScreen(): HTMLElement {
  const s = hjSession as HartenSession;
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  main.append(
    el(
      'p',
      'strong',
      t('harten.sessionWon', {
        name: playerName(s.winner),
        points: s.totals[s.winner] ?? 0,
      }),
    ),
  );
  const table = el('table', 'score-table');
  const head = el('tr');
  const row = el('tr');
  for (let p = 0; p < PLAYER_COUNT; p++) {
    head.append(el('th', undefined, playerName(p)));
    row.append(el('td', undefined, String(s.totals[p] ?? 0)));
  }
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startHarten));
  return main;
}

/* ---------- boerenbridge ---------- */

function recordBB(action: store.BoerenAction): void {
  if (!bbPersisted) return;
  bbPersisted.actions.push(action);
  store.saveBoeren(bbPersisted);
}

function startBoeren(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  bbPersisted = store.newBoeren(seed, botLevel, boerenConfig);
  store.saveBoeren(bbPersisted);
  bbRestored = null;
  bbSession = store.replayBoeren(bbPersisted);
  view = 'game';
  render();
  scheduleBoerenBots();
}

function continueBoeren(): void {
  if (!bbRestored) return;
  bbPersisted = bbRestored.state;
  bbSession = bbRestored.session;
  botLevel = bbPersisted.botLevel;
  boerenConfig = bbPersisted.config;
  bbRestored = null;
  view = 'game';
  render();
  scheduleBoerenBots();
}

function boerenActor(): { player: number; human: boolean } | null {
  const gift = bbSession?.gift;
  if (!gift) return null;
  if (gift.phase === 'bidding') return { player: gift.toAct, human: gift.toAct === HUMAN };
  if (gift.phase === 'play') return { player: gift.toPlay, human: gift.toPlay === HUMAN };
  return null;
}

function playBoerenCard(gift: BoerenGift, player: number, card: Card): void {
  gift.playCard(player, card);
  recordBB({ t: 'play', p: player, card });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.score) {
    // "Goed" is hier: exact gehaald wat je voorspeld had (§7).
    sfxScore(gift.score.bids[HUMAN] === gift.score.made[HUMAN]);
  }
}

function boerenBotStep(): boolean {
  const gift = bbSession?.gift;
  const who = boerenActor();
  if (!gift || !who || who.human) return false;
  if (gift.phase === 'bidding') {
    const n = chooseBoerenBid(gift, who.player, botLevel);
    gift.bid(who.player, n);
    recordBB({ t: 'bid', p: who.player, n });
    return true;
  }
  playBoerenCard(gift, who.player, chooseBoerenCard(gift, who.player, botLevel));
  return true;
}

function scheduleBoerenBots(): void {
  const gen = ++generation;
  const who = boerenActor();
  if (!who || who.human) return;
  const gift = bbSession?.gift;
  const pause = gift?.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'boerenbridge' || view !== 'game') return;
      if (boerenBotStep()) {
        render();
        scheduleBoerenBots();
      }
    },
    pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function boerenCloseAndNext(): void {
  if (!bbSession) return;
  bbSession.closeGift();
  recordBB({ t: 'close' });
  if (!bbSession.finished) {
    bbSession.nextGift();
  } else {
    recordSessionStat('boerenbridge', botLevel, bbSession.totals, HUMAN);
    store.clearBoeren();
    bbPersisted = null;
  }
  render();
  scheduleBoerenBots();
}

function boerenStatusBar(gift: BoerenGift): HTMLElement {
  const s = bbSession as BoerenSession;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('boeren.roundNo', { n: s.roundNumber, total: s.totalRounds })),
    // Het aantal kaarten wisselt per ronde — dat is hier de belangrijkste chip.
    el('span', 'chip strong', t('boeren.cards', { n: gift.cardsPerHand })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.dealer) })),
  );
  if (gift.trumpSuit) {
    bar.append(
      el(
        'span',
        'chip',
        t('game.trump', { suit: `${SUIT_GLYPH[gift.trumpSuit]} ${tSuit(gift.trumpSuit)}` }),
      ),
    );
  } else {
    bar.append(el('span', 'chip', t('boeren.noTrump')));
  }
  if (gift.phase !== 'bidding') {
    bar.append(
      el('span', 'chip', t('boeren.bidTotal', { bids: gift.bidTotal, tricks: gift.cardsPerHand })),
    );
  }
  bar.append(
    el('span', 'chip strong', s.totals.map((n, p) => `${playerName(p)} ${n}`).join(' — ')),
  );
  return bar;
}

function boerenSeat(gift: BoerenGift, player: number): HTMLElement {
  const who = boerenActor();
  const box = el('div', `seat seat-${player}${who?.player === player ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  const bod = gift.bids[player] ?? null;
  head.append(
    el(
      'span',
      'seat-tricks',
      bod === null
        ? t('boeren.noBid')
        : t('boeren.madeOfBid', { made: gift.tricksWon[player] ?? 0, bid: bod }),
    ),
  );
  box.append(head);
  const hand = el('div', 'hand');
  const cards = sortHand(gift.hands[player] as Card[]);
  if (player === HUMAN) {
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      const isLegal = legal.some((c) => c.suit === card.suit && c.rank === card.rank);
      hand.append(
        cardEl(card, {
          disabled: !isLegal,
          onClick: () => {
            if (!isLegal) return;
            playBoerenCard(gift, HUMAN, card);
            render();
            scheduleBoerenBots();
          },
        }),
      );
    }
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

function boerenTrickArea(gift: BoerenGift): HTMLElement {
  const area = el('div', 'trick');
  if (gift.phase === 'bidding' && gift.turnedCard) {
    area.append(el('div', 'trick-label', t('boeren.turned')));
    const row = el('div', 'trick-cards');
    const cell = el('div', 'trick-cell');
    cell.append(cardEl(gift.turnedCard));
    row.append(cell);
    area.append(row);
    return area;
  }
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick as { player: number; card: Card }[]) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(cardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  return area;
}

function boerenActionPanel(gift: BoerenGift): HTMLElement {
  const panel = el('div', 'panel');
  const who = boerenActor();
  const tip = coachBox(who?.human ? boerenTip(gift, HUMAN) : null);
  if (tip) panel.append(tip);

  if (gift.phase === 'bidding') {
    if (who?.human) {
      panel.append(el('p', undefined, t('boeren.bidPrompt', { n: gift.cardsPerHand })));
      const row = el('div', 'btn-row bids');
      for (const n of gift.legalBids(HUMAN)) {
        row.append(
          button(String(n), 'btn bid', () => {
            gift.bid(HUMAN, n);
            recordBB({ t: 'bid', p: HUMAN, n });
            render();
            scheduleBoerenBots();
          }),
        );
      }
      panel.append(row);
    } else if (who) {
      panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
    }
    return panel;
  }

  if (gift.phase === 'scored' && gift.score) {
    const s = gift.score;
    const total = bbSession as BoerenSession;
    panel.append(el('h2', undefined, t('boeren.roundDone')));
    const table = el('table', 'score-table');
    const head = el('tr');
    head.append(el('th'));
    for (let p = 0; p < PLAYER_COUNT; p++) head.append(el('th', undefined, playerName(p)));
    table.append(head);
    const rij = (label: string, waarde: (p: number) => string) => {
      const tr = el('tr');
      tr.append(el('th', undefined, label));
      for (let p = 0; p < PLAYER_COUNT; p++) tr.append(el('td', undefined, waarde(p)));
      table.append(tr);
    };
    rij(t('boeren.bid'), (p) => String(s.bids[p] ?? 0));
    rij(t('boeren.made'), (p) => String(s.made[p] ?? 0));
    rij(t('boeren.roundTotal'), (p) => formatPoints(s.points[p] ?? 0));
    rij(t('score.total'), (p) => String((total.totals[p] ?? 0) + (s.points[p] ?? 0)));
    panel.append(table);
    panel.append(button(t('score.next'), 'btn primary', () => boerenCloseAndNext()));
    return panel;
  }

  if (who && !who.human) {
    panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
  } else if (who?.human) {
    panel.append(el('p', 'hint', t('play.yourTurn')));
  }
  panel.append(el('p', 'hint', t('boeren.goal')));
  return panel;
}

function boerenEndScreen(): HTMLElement {
  const s = bbSession as BoerenSession;
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  main.append(
    el(
      'p',
      'strong',
      t('session.winner', { name: playerName(s.winner), points: s.totals[s.winner] ?? 0 }),
    ),
  );
  const table = el('table', 'score-table');
  const head = el('tr');
  const row = el('tr');
  for (let p = 0; p < PLAYER_COUNT; p++) {
    head.append(el('th', undefined, playerName(p)));
    row.append(el('td', undefined, String(s.totals[p] ?? 0)));
  }
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startBoeren));
  return main;
}

/* ---------- frans tarot ---------- */

const TAROT_SUIT_GLYPH = SUIT_GLYPH;
const TAROT_RANK_LABEL: Record<number, string> = { 11: 'V', 12: 'C', 13: 'D', 14: 'R' };

/** Tarotkaarten hebben een eigen gezicht: atouts tonen hun nummer, de excuse een
 *  ster, en de kleuren hebben vier pop-kaarten in plaats van drie (§2). */
function tarotCardEl(
  card: TarotCard,
  opts?: { onClick?: () => void; disabled?: boolean; selected?: boolean },
): HTMLButtonElement | HTMLSpanElement {
  const rood = card.kind === 'suit' && (card.suit === 'H' || card.suit === 'D');
  const soort =
    card.kind === 'trump' ? ' trump' : card.kind === 'excuse' ? ' excuse' : rood ? ' red' : '';
  const boven =
    card.kind === 'trump'
      ? String(card.value)
      : card.kind === 'excuse'
        ? '★'
        : (TAROT_RANK_LABEL[card.rank] ?? String(card.rank));
  const onder =
    card.kind === 'trump' ? '✦' : card.kind === 'excuse' ? 'EXC' : TAROT_SUIT_GLYPH[card.suit];
  const vul = (host: HTMLElement) => {
    host.append(el('span', 'card-rank', boven), el('span', 'card-suit', onder));
    host.setAttribute('aria-label', tarotCardLabel(card));
  };
  if (opts?.onClick) {
    const btn = button('', `card${soort}${opts.selected ? ' selected' : ''}`, opts.onClick);
    btn.disabled = opts.disabled ?? false;
    vul(btn);
    return btn;
  }
  const span = el('span', `card static${soort}`);
  vul(span);
  return span;
}

function tarotCardLabel(card: TarotCard): string {
  if (card.kind === 'excuse') return t('tarot.excuse');
  if (card.kind === 'trump') return t('tarot.atout', { n: card.value });
  const rang = TAROT_RANK_LABEL[card.rank]
    ? t(`tarot.rank.${card.rank}` as MessageKey)
    : String(card.rank);
  return `${rang} ${tSuit(card.suit)}`;
}

function recordT(action: store.TarotAction): void {
  if (!ttPersisted) return;
  ttPersisted.actions.push(action);
  store.saveTarot(ttPersisted);
}

function setTarotPlayers(n: PlayerCount): void {
  tarotConfig = { ...tarotConfig, players: n };
  try {
    localStorage.setItem(TAROT_PLAYERS_KEY, String(n));
  } catch {
    /* ignore */
  }
  render();
}

function tarotPlayerPicker(): HTMLElement {
  const box = el('div', 'type-picker');
  box.append(el('span', 'type-label', t('tarot.playerPicker')));
  const seg = el('div', 'seg wide');
  seg.setAttribute('role', 'group');
  seg.setAttribute('aria-label', t('tarot.playerPicker'));
  for (const n of [3, 4, 5] as PlayerCount[]) {
    seg.append(
      segButton(t('tarot.playerCount', { n }), tarotConfig.players === n, () => setTarotPlayers(n)),
    );
  }
  box.append(seg);
  box.append(el('p', 'type-hint', t(`tarot.hint.${tarotConfig.players}` as MessageKey)));
  return box;
}

function startTarot(): void {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  ttPersisted = store.newTarot(seed, botLevel, tarotConfig);
  store.saveTarot(ttPersisted);
  ttRestored = null;
  ttSession = store.replayTarot(ttPersisted);
  view = 'game';
  render();
  scheduleTarotBots();
}

function continueTarot(): void {
  if (!ttRestored) return;
  ttPersisted = ttRestored.state;
  ttSession = ttRestored.session;
  botLevel = ttPersisted.botLevel;
  tarotConfig = ttPersisted.config;
  ttRestored = null;
  view = 'game';
  render();
  scheduleTarotBots();
}

function tarotActor(): { player: number; human: boolean } | null {
  const gift = ttSession?.gift;
  if (!gift) return null;
  if (gift.phase === 'bidding') return { player: gift.toAct, human: gift.toAct === HUMAN };
  if (gift.phase === 'call' || gift.phase === 'ecart') {
    const p = gift.taker as number;
    return { player: p, human: p === HUMAN };
  }
  if (gift.phase === 'play') return { player: gift.toPlay, human: gift.toPlay === HUMAN };
  return null;
}

function playTarotCard(gift: TarotGift, player: number, card: TarotCard): void {
  gift.playCard(player, card);
  recordT({ t: 'play', p: player, card: tarotKey(card) });
  sfxCard();
  if (gift.trick.length === 0 && gift.phase === 'play') sfxTrick();
  if (gift.phase === 'scored' && gift.score) {
    sfxScore((gift.score.pointsHalf[HUMAN] ?? 0) >= 0);
  }
}

function tarotBotStep(): boolean {
  const gift = ttSession?.gift;
  const who = tarotActor();
  if (!gift || !who || who.human) return false;
  if (gift.phase === 'bidding') {
    const bod = chooseTarotBid(gift, who.player, botLevel);
    gift.bid(who.player, bod);
    recordT({ t: 'bid', p: who.player, c: bod });
    return true;
  }
  if (gift.phase === 'call') {
    const suit = chooseTarotCall(gift);
    gift.callKing(suit);
    recordT({ t: 'call', suit });
    return true;
  }
  if (gift.phase === 'ecart') {
    const card = chooseTarotDiscard(gift);
    gift.discard(card);
    recordT({ t: 'discard', card: tarotKey(card) });
    return true;
  }
  playTarotCard(gift, who.player, chooseTarotCard(gift, who.player, botLevel));
  return true;
}

function scheduleTarotBots(): void {
  const gen = ++generation;
  const who = tarotActor();
  const gift = ttSession?.gift;
  if (!gift || !who || who.human) return;
  // De écart gaat kaart per kaart; die stappen mogen vlug gaan.
  const snel = gift.phase === 'ecart';
  const pause = gift.phase === 'play' && gift.trick.length === 0 && gift.lastTrick;
  window.setTimeout(
    () => {
      if (gen !== generation || game !== 'tarot' || view !== 'game') return;
      if (tarotBotStep()) {
        render();
        scheduleTarotBots();
      }
    },
    snel ? 120 : pause ? TRICK_PAUSE : BOT_DELAY,
  );
}

function tarotCloseAndNext(): void {
  if (!ttSession) return;
  ttSession.closeGift();
  recordT({ t: 'close' });
  if (!ttSession.finished) {
    ttSession.nextGift();
  } else {
    recordSessionStat('tarot', botLevel, ttSession.totalsHalf, HUMAN);
    store.clearTarot();
    ttPersisted = null;
  }
  render();
  scheduleTarotBots();
}

function tarotStatusBar(gift: TarotGift): HTMLElement {
  const s = ttSession as TarotSession;
  const bar = el('div', 'status');
  bar.append(
    el('span', 'chip', t('tarot.giftNo', { n: s.giftNumber + 1, total: s.totalGiften })),
    el('span', 'chip', t('game.dealer', { name: playerName(gift.dealer) })),
  );
  if (gift.contract && gift.taker !== null) {
    bar.append(
      el(
        'span',
        'chip strong',
        t('tarot.taker', {
          name: playerName(gift.taker),
          contract: t(`tarot.contract.${gift.contract}` as MessageKey),
        }),
      ),
    );
  }
  if (gift.calledCard) {
    bar.append(el('span', 'chip', t('tarot.called', { card: tarotCardLabel(gift.calledCard) })));
    if (gift.partnerRevealed) {
      bar.append(
        el(
          'span',
          'chip',
          gift.partner === null
            ? t('tarot.alone')
            : t('tarot.partner', { name: playerName(gift.partner) }),
        ),
      );
    }
  }
  bar.append(
    el(
      'span',
      'chip strong',
      s.totalsHalf.map((n, p) => `${playerName(p)} ${formatHalfPoints(n)}`).join(' — '),
    ),
  );
  return bar;
}

function tarotSeat(gift: TarotGift, player: number): HTMLElement {
  const who = tarotActor();
  const box = el('div', `seat seat-${player}${who?.player === player ? ' active' : ''}`);
  const head = el('div', 'seat-head');
  head.append(el('span', 'seat-name', playerName(player)));
  const bouts = countBouts(gift.won[player] ?? []);
  head.append(
    el(
      'span',
      'seat-tricks',
      `${t('score.tricks')}: ${gift.tricksWon[player] ?? 0}${bouts > 0 ? ` · ${t('tarot.bouts', { n: bouts })}` : ''}`,
    ),
  );
  box.append(head);
  const hand = el('div', 'hand');
  const cards = sortTarotHand(gift.hands[player] ?? []);
  if (player === HUMAN) {
    const ecartBeurt = gift.phase === 'ecart' && gift.taker === HUMAN;
    const mag = ecartBeurt ? gift.legalDiscards() : [];
    const legal = gift.phase === 'play' && gift.toPlay === HUMAN ? gift.legalCards(HUMAN) : [];
    for (const card of cards) {
      if (ecartBeurt) {
        const kan = mag.some((c) => tarotKey(c) === tarotKey(card));
        hand.append(
          tarotCardEl(card, {
            disabled: !kan,
            onClick: () => {
              if (!kan) return;
              gift.discard(card);
              render();
              scheduleTarotBots();
            },
          }),
        );
        continue;
      }
      const kan = legal.some((c) => tarotKey(c) === tarotKey(card));
      hand.append(
        tarotCardEl(card, {
          disabled: !kan,
          onClick: () => {
            if (!kan) return;
            playTarotCard(gift, HUMAN, card);
            render();
            scheduleTarotBots();
          },
        }),
      );
    }
  } else {
    for (let i = 0; i < cards.length; i++) hand.append(el('span', 'card back'));
  }
  box.append(hand);
  return box;
}

/** Drie, vier of vijf stoelen: links en rechts flankeren de slag, wat ertussen
 *  zit komt bovenaan. Bij drie spelers blijft die bovenrij dus leeg. */
function tarotTable(gift: TarotGift): HTMLElement {
  const n = gift.players;
  const anderen: number[] = [];
  for (let i = 1; i < n; i++) anderen.push((HUMAN + i) % n);
  const links = anderen[0] as number;
  const rechts = anderen[anderen.length - 1] as number;
  const boven = anderen.slice(1, -1);

  const table = tableGrid();
  if (boven.length > 0) {
    const rij = el('div', 'seat-row');
    for (const p of boven) rij.append(tarotSeat(gift, p));
    table.append(rij);
  }
  const middle = el('div', 'table-middle');
  middle.append(tarotSeat(gift, links), tarotTrickArea(gift), tarotSeat(gift, rechts));
  table.append(middle);
  table.append(tarotSeat(gift, HUMAN));
  return table;
}

function tarotTrickArea(gift: TarotGift): HTMLElement {
  const area = el('div', 'trick');
  // §5 — de open chien is het enige moment waarop iedereen die kaarten ziet.
  if (gift.chienOpen && gift.phase === 'ecart') {
    area.append(el('div', 'trick-label', t('tarot.chien')));
    const row = el('div', 'trick-cards');
    for (const card of gift.chien) {
      const cell = el('div', 'trick-cell');
      cell.append(tarotCardEl(card));
      row.append(cell);
    }
    area.append(row);
    return area;
  }
  const showLast = gift.trick.length === 0 && gift.lastTrick && gift.phase === 'play';
  const plays = showLast ? (gift.lastTrick ?? []) : gift.trick;
  if (showLast) area.append(el('div', 'trick-label', t('play.lastTrick')));
  const row = el('div', 'trick-cards');
  for (const play of plays) {
    const cell = el('div', 'trick-cell');
    cell.append(el('div', 'trick-player', playerName(play.player)));
    cell.append(tarotCardEl(play.card));
    row.append(cell);
  }
  area.append(row);
  return area;
}

function tarotActionPanel(gift: TarotGift): HTMLElement {
  const panel = el('div', 'panel');
  const who = tarotActor();
  const tip = coachBox(who?.human ? tarotTip(gift, HUMAN) : null);
  if (tip) panel.append(tip);

  if (gift.phase === 'bidding') {
    if (who?.human) {
      panel.append(el('p', undefined, t('tarot.bidPrompt')));
      const row = el('div', 'btn-row');
      for (const c of TAROT_CONTRACTS) {
        if (!gift.legalBids(HUMAN).includes(c.id)) continue;
        row.append(
          button(`${t(`tarot.contract.${c.id}` as MessageKey)} ×${c.multiplier}`, 'btn', () => {
            gift.bid(HUMAN, c.id);
            recordT({ t: 'bid', p: HUMAN, c: c.id });
            render();
            scheduleTarotBots();
          }),
        );
      }
      row.append(
        button(t('bidding.pass'), 'btn muted', () => {
          gift.bid(HUMAN, 'pass');
          recordT({ t: 'bid', p: HUMAN, c: 'pass' });
          render();
          scheduleTarotBots();
        }),
      );
      panel.append(row);
    } else if (who) {
      panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
    }
    return panel;
  }

  if (gift.phase === 'redeal') {
    panel.append(el('p', undefined, t('tarot.redeal')));
    panel.append(button(t('bidding.continue'), 'btn primary', () => tarotCloseAndNext()));
    return panel;
  }

  if (gift.phase === 'call') {
    if (who?.human) {
      panel.append(
        el(
          'p',
          undefined,
          t('tarot.callPrompt', { rank: t(`tarot.rank.${gift.callRank()}` as MessageKey) }),
        ),
      );
      const row = el('div', 'btn-row');
      for (const suit of SUITS) {
        const rood = suit === 'H' || suit === 'D';
        row.append(
          button(`${SUIT_GLYPH[suit]} ${tSuit(suit)}`, `btn${rood ? ' red' : ''}`, () => {
            gift.callKing(suit);
            recordT({ t: 'call', suit });
            render();
            scheduleTarotBots();
          }),
        );
      }
      panel.append(row);
    } else if (who) {
      panel.append(el('p', 'hint', t('tarot.callWait', { name: playerName(who.player) })));
    }
    return panel;
  }

  if (gift.phase === 'ecart') {
    if (who?.human) {
      panel.append(
        el(
          'p',
          undefined,
          t('tarot.ecartPrompt', { done: gift.ecart.length, total: gift.chien.length }),
        ),
      );
      if (gift.ecart.length > 0) {
        const row = el('div', 'btn-row');
        for (const card of gift.ecart) row.append(tarotCardEl(card));
        row.append(
          button(t('tarot.undo'), 'btn muted', () => {
            gift.undoLastDiscard();
            render();
          }),
        );
        panel.append(row);
      }
    } else if (who) {
      panel.append(el('p', 'hint', t('tarot.ecartWait', { name: playerName(who.player) })));
    }
    return panel;
  }

  if (gift.phase === 'scored' && gift.score) {
    const s = gift.score;
    const total = ttSession as TarotSession;
    panel.append(
      el(
        'h2',
        undefined,
        s.made
          ? t('tarot.made', { name: playerName(gift.taker as number) })
          : t('tarot.failed', { name: playerName(gift.taker as number) }),
      ),
    );
    panel.append(
      el(
        'p',
        'strong',
        t('tarot.result', {
          points: formatHalfPoints(s.preneurHalf),
          target: formatHalfPoints(s.targetHalf),
          bouts: s.bouts,
        }),
      ),
    );
    if (s.petitAuBout !== 0) {
      panel.append(el('p', s.petitAuBout > 0 ? 'strong made' : 'strong', t('tarot.petitAuBout')));
    }
    if (s.chelem) panel.append(el('p', 'strong made', t('tarot.chelem')));
    const table = el('table', 'score-table');
    const head = el('tr');
    head.append(el('th'));
    for (let p = 0; p < gift.players; p++) head.append(el('th', undefined, playerName(p)));
    table.append(head);
    const rij = (label: string, waarde: (p: number) => string) => {
      const tr = el('tr');
      tr.append(el('th', undefined, label));
      for (let p = 0; p < gift.players; p++) tr.append(el('td', undefined, waarde(p)));
      table.append(tr);
    };
    rij(t('tarot.roundTotal'), (p) => {
      const half = s.pointsHalf[p] ?? 0;
      return `${half > 0 ? '+' : ''}${formatHalfPoints(half)}`;
    });
    rij(t('score.total'), (p) =>
      formatHalfPoints((total.totalsHalf[p] ?? 0) + (s.pointsHalf[p] ?? 0)),
    );
    panel.append(table);
    panel.append(button(t('score.next'), 'btn primary', () => tarotCloseAndNext()));
    return panel;
  }

  if (who && !who.human) {
    panel.append(el('p', 'hint', t('bidding.turn', { name: playerName(who.player) })));
  } else if (who?.human) {
    panel.append(el('p', 'hint', t('play.yourTurn')));
  }
  panel.append(el('p', 'hint', t('tarot.goal')));
  return panel;
}

function tarotEndScreen(): HTMLElement {
  const s = ttSession as TarotSession;
  const main = el('main', 'hero');
  main.append(el('h1', undefined, t('session.end')));
  main.append(
    el(
      'p',
      'strong',
      t('tarot.sessionWon', {
        name: playerName(s.winner),
        points: formatHalfPoints(s.totalsHalf[s.winner] ?? 0),
      }),
    ),
  );
  const table = el('table', 'score-table');
  const head = el('tr');
  const row = el('tr');
  for (let p = 0; p < s.players; p++) {
    head.append(el('th', undefined, playerName(p)));
    row.append(el('td', undefined, formatHalfPoints(s.totalsHalf[p] ?? 0)));
  }
  table.append(head, row);
  main.append(table);
  main.append(button(t('session.again'), 'btn primary', startTarot));
  return main;
}

function scorebordScreen(): HTMLElement {
  return sbBoard ? scorebordBoard(sbBoard) : scorebordSetup();
}

/* ---------- opstart ---------- */

// Eerst de oude `carts.*`-sleutels overzetten: initTheme() en setLocale() lezen
// hun waarde meteen daarna.
migrateStorageKeys();
initTheme();
initSound();
setLocale(detectLocale());
try {
  const storedLevel = localStorage.getItem(LEVEL_KEY);
  if ((BOT_LEVELS as readonly string[]).includes(storedLevel ?? '')) {
    botLevel = storedLevel as BotLevel;
  }
} catch {
  /* ignore */
}
try {
  const storedMode = localStorage.getItem(SB_MODE_KEY);
  if (storedMode === 'wiezen' || storedMode === 'manueel') sbMode = storedMode;
} catch {
  /* ignore */
}
try {
  const storedRuleset = localStorage.getItem(RULESET_KEY);
  ruleset = getRuleset(storedRuleset ?? '') ?? ruleset;
} catch {
  /* ignore */
}
try {
  const w = JSON.parse(localStorage.getItem(WIEZEN_OPTS_KEY) ?? 'null') as unknown;
  if (isWiezenOptions(w)) wiezenOptions = w;
  const m = JSON.parse(localStorage.getItem(MANILLE_OPTS_KEY) ?? 'null') as unknown;
  if (isManilleOptions(m)) manilleOptions = m;
} catch {
  /* ignore */
}
try {
  const storedGame = localStorage.getItem(GAME_KEY);
  if (
    storedGame === 'manille' ||
    storedGame === 'wiezen' ||
    storedGame === 'bieden' ||
    storedGame === 'klaverjassen' ||
    storedGame === 'belote' ||
    storedGame === 'hartenjagen' ||
    storedGame === 'boerenbridge' ||
    storedGame === 'tarot'
  ) {
    game = storedGame;
  }
} catch {
  /* ignore */
}
const savedManille = store.loadManille();
if (savedManille) {
  try {
    mRestored = { state: savedManille, session: store.replayManille(savedManille) };
  } catch {
    store.clearManille();
  }
}
const savedBieden = store.loadBieden();
if (savedBieden) {
  try {
    bRestored = { state: savedBieden, session: store.replayBieden(savedBieden) };
  } catch {
    store.clearBieden();
  }
}
const savedBelote = store.loadBelote();
if (savedBelote) {
  try {
    blRestored = { state: savedBelote, session: store.replayBelote(savedBelote) };
    beloteConfig = savedBelote.config;
  } catch {
    store.clearBelote();
  }
}
try {
  const n = Number(localStorage.getItem(TAROT_PLAYERS_KEY));
  if (n === 3 || n === 4 || n === 5) tarotConfig = { ...tarotConfig, players: n };
} catch {
  /* ignore */
}
const savedTarot = store.loadTarot();
if (savedTarot) {
  try {
    ttRestored = { state: savedTarot, session: store.replayTarot(savedTarot) };
    tarotConfig = savedTarot.config;
  } catch {
    store.clearTarot();
  }
}
const savedBoeren = store.loadBoeren();
if (savedBoeren) {
  try {
    bbRestored = { state: savedBoeren, session: store.replayBoeren(savedBoeren) };
    boerenConfig = savedBoeren.config;
  } catch {
    store.clearBoeren();
  }
}
const savedHarten = store.loadHarten();
if (savedHarten) {
  try {
    hjRestored = { state: savedHarten, session: store.replayHarten(savedHarten) };
    hartenConfig = savedHarten.config;
  } catch {
    store.clearHarten();
  }
}
const savedKlaverjas = store.loadKlaverjas();
if (savedKlaverjas) {
  try {
    kRestored = { state: savedKlaverjas, session: store.replayKlaverjas(savedKlaverjas) };
    klaverjasConfig = savedKlaverjas.config;
  } catch {
    store.clearKlaverjas();
  }
}
sbBoard = scorebord.load();
const savedState = store.load();
const savedRuleset = savedState ? getRuleset(savedState.rulesetId) : undefined;
if (savedState && savedRuleset) {
  try {
    restored = { state: savedState, session: store.replay(savedRuleset, savedState) };
  } catch {
    store.clear();
  }
}
onLocaleChange(render);
render();

// PWA: service worker voor offline gebruik / installatie op gsm.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline-modus is nice-to-have */
    });
  });
}
