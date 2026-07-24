import './styles.css';
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
import {
  BOT_LEVELS,
  chooseAlleen,
  chooseBid,
  chooseCard,
  chooseTrumpSuit,
  type BotLevel,
} from './bots';
import * as store from './store';
import { strength, teamOf, type ManilleGift } from './engine/manille';
import type { ManilleSession } from './engine/manille';
import { chooseManilleCard, chooseManilleTrump } from './bots';
import { initSound, sfxCard, sfxScore, sfxTrick, soundEnabled, toggleSound } from './sound';
import { clearStats, loadStats, recordGiftStat, recordSessionStat } from './stats';
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

const RULESET_KEY = 'carts.ruleset';
let ruleset = getRuleset('vlaams-standaard') as Ruleset;
let view: 'home' | 'stats' = 'home';
const BOT_NAMES = ['', 'Miel', 'Rita', 'Staf'];
const HUMAN = 0;
const BOT_DELAY = 650;
const TRICK_PAUSE = 1200;
const LEVEL_KEY = 'carts.botLevel';

type BidLogEntry =
  | { kind: 'pass' | 'join' | 'troel'; player: number }
  | { kind: 'bid'; player: number; contractId: string };

let session: Session | null = null;
let persisted: store.PersistedSession | null = null;
let restored: { state: store.PersistedSession; session: Session } | null = null;
let botLevel: BotLevel = 'normal';
let bidLog: BidLogEntry[] = [];
let generation = 0;

const GAME_KEY = 'carts.game';
const WIEZEN_OPTS_KEY = 'carts.wiezenOptions';
const MANILLE_OPTS_KEY = 'carts.manilleOptions';
let game: 'wiezen' | 'manille' = 'wiezen';
let mSession: ManilleSession | null = null;
let mPersisted: store.PersistedManille | null = null;
let mRestored: { state: store.PersistedManille; session: ManilleSession } | null = null;
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
          ? { kind: 'bid', player: action.p, contractId: action.a.contractId }
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
          ? { kind: 'bid', player: p, contractId: action.contractId }
          : { kind: action.type === 'join' ? 'join' : 'pass', player: p },
      );
      afterBidAction(gift);
      return true;
    }
    case 'alleen-choice': {
      const accept = chooseAlleen(gift.deal.hands[p] as Card[], gift.bidding.turnedSuit, botLevel);
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
      if (gen !== generation || game !== 'wiezen') return;
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

function cardEl(card: Card, opts?: { onClick?: () => void; disabled?: boolean }): HTMLElement {
  const red = card.suit === 'H' || card.suit === 'D';
  if (opts?.onClick) {
    const btn = button(cardText(card), `card${red ? ' red' : ''}`, opts.onClick);
    btn.disabled = opts.disabled ?? false;
    btn.setAttribute('aria-label', `${tSuit(card.suit)} ${rankLabel(card.rank)}`);
    return btn;
  }
  const span = el('span', `card static${red ? ' red' : ''}`, cardText(card));
  span.setAttribute('aria-label', `${tSuit(card.suit)} ${rankLabel(card.rank)}`);
  return span;
}

function topbar(): HTMLElement {
  const header = el('header', 'topbar');
  const brand = el('div', 'brand');
  brand.innerHTML =
    'Carts<span class="suits" aria-hidden="true"><span class="suit-black">♠</span>' +
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
  header.append(brand, controls);
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

function startScreen(): HTMLElement {
  const main = el('main', 'hero');
  main.append(el('span', 'phase', t('app.phase')));
  main.append(el('h1', undefined, t(game === 'manille' ? 'game.manillen' : 'placeholder.heading')));
  main.append(el('p', 'tagline', t('app.tagline')));
  main.append(el('p', undefined, t(game === 'manille' ? 'manille.intro' : 'placeholder.body')));
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

  const gameGroup = el('div', 'control-group level-picker');
  gameGroup.append(el('span', undefined, t('game.picker')));
  const gameSeg = el('div', 'seg');
  gameSeg.setAttribute('role', 'group');
  for (const g of ['wiezen', 'manille'] as const) {
    gameSeg.append(
      segButton(t(g === 'wiezen' ? 'game.wiezen' : 'game.manillen'), game === g, () => {
        game = g;
        try {
          localStorage.setItem(GAME_KEY, g);
        } catch {
          /* ignore */
        }
        render();
      }),
    );
  }
  gameGroup.append(gameSeg);
  main.append(gameGroup);

  const rulesetGroup = el('div', 'control-group level-picker');
  rulesetGroup.append(el('span', undefined, t('ruleset.picker')));
  const rulesetSeg = el('div', 'seg');
  rulesetSeg.setAttribute('role', 'group');
  for (const r of rulesets) {
    rulesetSeg.append(
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
  rulesetGroup.append(rulesetSeg);
  if (game === 'wiezen') main.append(rulesetGroup);

  const levelGroup = el('div', 'control-group level-picker');
  levelGroup.append(el('span', undefined, t('bots.level')));
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
  levelGroup.append(levelSeg);
  main.append(levelGroup);

  // Regelvarianten worden alleen getoond wanneer er geen te herstellen sessie
  // klaarstaat (die heeft haar eigen, vastgelegde opties).
  const hasRestore =
    game === 'manille'
      ? Boolean(mRestored && !mRestored.session.finished)
      : Boolean(restored && !restored.session.finished);
  if (!hasRestore) {
    main.append(game === 'manille' ? manilleOptionsPanel() : wiezenOptionsPanel());
  }

  const row = el('div', 'btn-row');
  if (game === 'manille') {
    if (mRestored && !mRestored.session.finished) {
      row.append(button(t('start.continue'), 'btn primary', continueManille));
      row.append(
        button(t('start.new'), 'btn', () => {
          store.clearManille();
          mRestored = null;
          startManille();
        }),
      );
    } else {
      row.append(button(t('game.start'), 'btn primary', startManille));
    }
  } else if (restored && !restored.session.finished) {
    row.append(button(t('start.continue'), 'btn primary', continueSession));
    row.append(
      button(t('start.new'), 'btn', () => {
        store.clear();
        restored = null;
        startSession();
      }),
    );
  } else {
    row.append(button(t('game.start'), 'btn primary', startSession));
  }
  row.append(
    button(t('stats.button'), 'btn muted', () => {
      view = 'stats';
      render();
    }),
  );
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
  } else {
    bar.append(el('span', 'chip', t('game.turned', { card: cardText(gift.deal.turnedCard) })));
  }
  return bar;
}

function goalLine(gift: Gift): string | null {
  const contract = gift.contract?.contract;
  if (!contract) return null;
  if (contract.target.tricks === 0) return t('play.goalZero');
  if (contract.target.combined) return t('play.goalTogether', { tricks: contract.target.tricks });
  return t('play.goal', { tricks: contract.target.tricks });
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
        ? t('bidding.bids', { name, bid: tContract(entry.contractId) })
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
        for (const contract of gift.bidding.legalBids(HUMAN)) {
          row.append(
            button(tContract(contract.id), 'btn', () => {
              gift.bidding.act(HUMAN, { type: 'bid', contractId: contract.id });
              record({ t: 'bid', p: HUMAN, a: { type: 'bid', contractId: contract.id } });
              bidLog.push({ kind: 'bid', player: HUMAN, contractId: contract.id });
              afterBidAction(gift);
              render();
              scheduleBots();
            }),
          );
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
  if (view === 'stats' && !session && !mSession) {
    wrap.append(statsScreen());
  } else if (game === 'manille') {
    if (!mSession || (!mGift && !mSession.finished)) {
      wrap.append(startScreen());
    } else if (!mGift && mSession.finished) {
      wrap.append(manilleEndScreen());
    } else if (mGift) {
      wrap.append(manilleStatusBar(mGift));
      const table = el('div', 'table-grid');
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
    const table = el('div', 'table-grid');
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
  render();
  scheduleManilleBots();
}

function continueManille(): void {
  if (!mRestored) return;
  mPersisted = mRestored.state;
  mSession = mRestored.session;
  botLevel = mPersisted.botLevel;
  mRestored = null;
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
      if (gen !== generation || game !== 'manille') return;
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

/* ---------- opstart ---------- */

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
  if (storedGame === 'manille' || storedGame === 'wiezen') game = storedGame;
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
