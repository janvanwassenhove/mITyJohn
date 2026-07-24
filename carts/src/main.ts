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
import { initSound, sfxCard, sfxScore, sfxTrick, soundEnabled, toggleSound } from './sound';
import { clearStats, loadStats, recordGiftStat, recordSessionStat } from './stats';

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
  persisted = store.newPersisted(ruleset.id, seed, botLevel);
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
      if (gen !== generation) return;
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

function startScreen(): HTMLElement {
  const main = el('main', 'hero');
  main.append(el('span', 'phase', t('app.phase')));
  main.append(el('h1', undefined, t('placeholder.heading')));
  main.append(el('p', 'tagline', t('app.tagline')));
  main.append(el('p', undefined, t('placeholder.body')));
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
  main.append(rulesetGroup);

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

  const row = el('div', 'btn-row');
  if (restored && !restored.session.finished) {
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
  if (view === 'stats' && !session) {
    wrap.append(statsScreen());
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
