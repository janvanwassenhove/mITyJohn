// Automodi van het scorebord voor een fysiek kaartspel: je duidt aan wát er
// gebeurde en de app rekent de punten uit — met exact dezelfde scorefuncties als
// de spellen zelf (scoreKlaverjasRound, scoreTarotRound, …). DOM-vrij en
// taalonafhankelijk: de UI vertaalt de sleutels die hier uitkomen.
//
// Elk spel beschrijft zijn invoer als een lijstje velden. main.ts rendert die
// generiek, zodat er niet voor elk spel een eigen formulier bijkomt.

import type { GameId } from './games';
import {
  computeWiezenRound,
  scorebordContracts,
  ALONE,
  asksAceLed,
  needsPartner,
} from './scorebord-wiezen';
import { scoreManilleGift, teamOf as manilleTeamOf } from './engine/manille';
import { MAX_BID, MIN_BID, scoreBiedenGift, teamOf as biedenTeamOf } from './engine/bieden';
import { scoreKlaverjasRound, teamOf as klaverjasTeamOf } from './engine/klaverjassen';
import { DEFAULT_KLAVERJAS_CONFIG } from './engine/klaverjassen';
import { scoreBeloteRound, DEFAULT_BELOTE_CONFIG } from './engine/belote';
import { scoreHartenRound, DEFAULT_HARTEN_CONFIG, TOTAL_PENALTY } from './engine/hartenjagen';
import { roundPoints as boerenRoundPoints, DEFAULT_BOEREN_CONFIG } from './engine/boerenbridge';
import {
  CONTRACTS as TAROT_CONTRACTS,
  POIGNEE_POINTS,
  scoreTarotRound,
  type ChelemOutcome,
  type ContractId as TarotContractId,
  type PlayerCount as TarotPlayers,
  type PoigneeSize,
} from './engine/tarot';
import { formatHalfPoints } from './engine/tarot-cards';

/* ---------- invoermodel ---------- */

export type SbValues = Record<string, string | number | number[]>;

/** Een parameter in een rondelabel. `player` en `i18n` worden door de UI
 *  omgezet naar een naam of een vertaling, zodat een bewaarde ronde meeverandert
 *  wanneer je van taal wisselt. */
export type LabelParam =
  | string
  | number
  | { player: number }
  /** Meerdere deelnemers, samengevoegd als "Jan + Rita". */
  | { players: number[] }
  | { i18n: string };
export type LabelParams = Record<string, LabelParam>;

/** `extra: true` markeert een veld dat je zelden nodig hebt (premies bij tarot).
 *  De UI klapt die samen, zodat het formulier op een telefoon kort blijft. */
export type SbField =
  | {
      kind: 'choice';
      key: string;
      label: string;
      options: { value: string; label: string }[];
      extraField?: boolean;
    }
  /** Keuze uit de deelnemers; de UI vult de namen in. */
  | { kind: 'player'; key: string; label: string; extra?: { value: string; label: string }[] }
  | { kind: 'number'; key: string; label: string; min: number; max: number }
  | { kind: 'toggle'; key: string; label: string; extraField?: boolean }
  /** Eén getal per deelnemer. */
  | { kind: 'perPlayer'; key: string; label: string; min: number; max: number };

export interface SbRoundResult {
  /** Puntenmutatie per deelnemer. */
  points: number[];
  /** i18n-sleutel + parameters voor het rondelabel. */
  labelKey: string;
  params: LabelParams;
  /** Optionele regel onder het formulier, bv. het doel of de tussenstand. */
  hintKey?: string;
  hintParams?: LabelParams;
}

export interface SbGame {
  id: GameId;
  /** Bij hoeveel deelnemers is deze modus bruikbaar? */
  playerCounts: number[];
  /** Wint de laagste score? (hartenjagen) */
  lowWins?: boolean;
  defaults(n: number): SbValues;
  fields(values: SbValues, n: number): SbField[];
  compute(values: SbValues, n: number): SbRoundResult;
}

/* ---------- hulpjes ---------- */

const num = (values: SbValues, key: string, fallback = 0): number => {
  const v = values[key];
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (values: SbValues, key: string, fallback = ''): string => {
  const v = values[key];
  return typeof v === 'string' ? v : fallback;
};

const list = (values: SbValues, key: string, n: number): number[] => {
  const v = values[key];
  const arr = Array.isArray(v) ? v : [];
  return Array.from({ length: n }, (_, i) => {
    const x = arr[i];
    return typeof x === 'number' && Number.isFinite(x) ? x : 0;
  });
};

const on = (values: SbValues, key: string): boolean => num(values, key) === 1;

/** Puntenmutatie van twee ploegen uitsmeren over vier stoelen. */
function spreadTeams(teamPoints: number[], teamOf: (p: number) => number, n = 4): number[] {
  return Array.from({ length: n }, (_, p) => teamPoints[teamOf(p)] ?? 0);
}

/* ---------- wiezen ---------- */

const WIEZEN: SbGame = {
  id: 'wiezen',
  playerCounts: [4],
  defaults: () => ({ contract: 'vraag-en-mee', declarer: 0, partner: 1, aceLed: 1, tricks: 0 }),
  fields: (values) => {
    const contract = str(values, 'contract', 'vraag-en-mee');
    const velden: SbField[] = [
      {
        kind: 'choice',
        key: 'contract',
        label: 'scorebord.contract',
        options: scorebordContracts().map((c) => ({ value: c.id, label: `contract.${c.id}` })),
      },
      { kind: 'player', key: 'declarer', label: 'scorebord.declarer' },
    ];
    if (needsPartner(contract)) {
      velden.push({
        kind: 'player',
        key: 'partner',
        label: 'scorebord.partner',
        extra: [{ value: String(ALONE), label: 'scorebord.alone' }],
      });
    }
    if (asksAceLed(contract)) {
      velden.push({ kind: 'toggle', key: 'aceLed', label: 'scorebord.troelAce' });
    }
    velden.push({ kind: 'number', key: 'tricks', label: 'scorebord.tricks', min: 0, max: 13 });
    return velden;
  },
  compute: (values) => {
    const declarer = num(values, 'declarer');
    const gekozen = num(values, 'partner', 1);
    const partner = gekozen === ALONE || gekozen === declarer ? ALONE : gekozen;
    const result = computeWiezenRound({
      contractId: str(values, 'contract', 'vraag-en-mee'),
      declarer,
      partner,
      tricks: num(values, 'tricks'),
      aceLed: on(values, 'aceLed'),
    });
    const doel = result.contract.target.tricks;
    return {
      points: result.points,
      labelKey: doel === 0 ? 'scorebord.round.wiezenZero' : 'scorebord.round.wiezen',
      params: {
        contract: { i18n: `contract.${result.contract.id}` },
        players: { players: [...result.declarers] },
        tricks: result.tricks,
        target: doel,
      },
      hintKey: doel === 0 ? 'play.goalZero' : 'play.goal',
      hintParams: { tricks: doel },
    };
  },
};

/* ---------- manillen ---------- */

const MANILLE: SbGame = {
  id: 'manille',
  playerCounts: [4],
  defaults: () => ({ declarer: 0, model: '60', points: 0, multiplier: '1' }),
  fields: () => [
    { kind: 'player', key: 'declarer', label: 'scorebord.mn.declarer' },
    {
      kind: 'choice',
      key: 'model',
      label: 'opt.pointModel',
      options: [
        { value: '60', label: 'scorebord.mn.model60' },
        { value: '68', label: 'scorebord.mn.model68' },
      ],
    },
    { kind: 'number', key: 'points', label: 'scorebord.mn.points', min: 0, max: 68 },
    {
      kind: 'choice',
      key: 'multiplier',
      label: 'opt.multipliers',
      options: [
        { value: '1', label: 'scorebord.mn.x1' },
        { value: '2', label: 'scorebord.mn.x2' },
        { value: '4', label: 'scorebord.mn.x4' },
      ],
    },
  ],
  compute: (values) => {
    const model = str(values, 'model', '60') === '68' ? 68 : 60;
    const declarer = num(values, 'declarer');
    const eigen = Math.min(num(values, 'points'), model);
    const team = manilleTeamOf(declarer);
    const teamPoints: [number, number] =
      team === 0 ? [eigen, model - eigen] : [model - eigen, eigen];
    const score = scoreManilleGift(teamPoints, num(values, 'multiplier', 1), {
      pointModel: model,
      trumpMode: 'dealer',
      multipliers: false,
      maatLigt: false,
      targetPoints: 101,
    });
    const punten = [0, 0];
    if (score.winner !== null) {
      punten[score.winner] = score.score;
      punten[1 - score.winner] = 0;
    }
    return {
      points: spreadTeams(punten, manilleTeamOf),
      labelKey: 'scorebord.round.manille',
      params: {
        name: { player: declarer },
        points: eigen,
        model,
        score: score.score,
      },
    };
  },
};

/* ---------- bieden ---------- */

const BIEDEN: SbGame = {
  id: 'bieden',
  playerCounts: [4],
  defaults: () => ({ declarer: 0, bid: MIN_BID, points: 0 }),
  fields: () => [
    { kind: 'player', key: 'declarer', label: 'scorebord.bd.declarer' },
    { kind: 'number', key: 'bid', label: 'scorebord.bd.bid', min: MIN_BID, max: MAX_BID },
    { kind: 'number', key: 'points', label: 'scorebord.bd.points', min: 0, max: 162 },
  ],
  compute: (values) => {
    const declarer = num(values, 'declarer');
    const eigen = Math.min(num(values, 'points'), 162);
    const team = biedenTeamOf(declarer);
    const teamPoints: [number, number] = team === 0 ? [eigen, 162 - eigen] : [162 - eigen, eigen];
    const score = scoreBiedenGift({ bid: num(values, 'bid', MIN_BID), declarer, teamPoints });
    return {
      points: spreadTeams(score.points, biedenTeamOf),
      labelKey: score.made ? 'scorebord.round.biedenMade' : 'scorebord.round.biedenFailed',
      params: { name: { player: declarer }, bid: score.bid, points: eigen },
    };
  },
};

/* ---------- klaverjassen ---------- */

const KLAVERJAS: SbGame = {
  id: 'klaverjassen',
  playerCounts: [4],
  defaults: () => ({ declarer: 0, points: 0, roem: 0, roemOther: 0, pit: 0 }),
  fields: () => [
    { kind: 'player', key: 'declarer', label: 'scorebord.kj.declarer' },
    { kind: 'number', key: 'points', label: 'scorebord.kj.points', min: 0, max: 162 },
    { kind: 'number', key: 'roem', label: 'scorebord.kj.roem', min: 0, max: 300 },
    { kind: 'number', key: 'roemOther', label: 'scorebord.kj.roemOther', min: 0, max: 300 },
    { kind: 'toggle', key: 'pit', label: 'scorebord.kj.pit' },
  ],
  compute: (values) => {
    const declarer = num(values, 'declarer');
    const team = klaverjasTeamOf(declarer);
    const eigen = Math.min(num(values, 'points'), 162);
    const cardPoints: [number, number] = team === 0 ? [eigen, 162 - eigen] : [162 - eigen, eigen];
    const roemEigen = num(values, 'roem');
    const roemAnder = num(values, 'roemOther');
    const roem: [number, number] = team === 0 ? [roemEigen, roemAnder] : [roemAnder, roemEigen];
    const score = scoreKlaverjasRound({
      cardPoints,
      roem,
      declaringTeam: team,
      declarerTricks: on(values, 'pit') ? 8 : 0,
      config: DEFAULT_KLAVERJAS_CONFIG,
    });
    return {
      points: spreadTeams(score.points, klaverjasTeamOf),
      labelKey: score.made ? 'scorebord.round.klaverjasMade' : 'scorebord.round.klaverjasWet',
      params: { name: { player: declarer }, points: eigen + roemEigen },
    };
  },
};

/* ---------- belote ---------- */

const BELOTE: SbGame = {
  id: 'belote',
  playerCounts: [4],
  defaults: () => ({
    taker: 0,
    points: 0,
    annonces: 0,
    annoncesOther: 0,
    belote: 0,
    beloteOther: 0,
    capot: 0,
  }),
  fields: () => [
    { kind: 'player', key: 'taker', label: 'scorebord.bl.taker' },
    { kind: 'number', key: 'points', label: 'scorebord.bl.points', min: 0, max: 162 },
    { kind: 'number', key: 'annonces', label: 'scorebord.bl.annonces', min: 0, max: 500 },
    { kind: 'number', key: 'annoncesOther', label: 'scorebord.bl.annoncesOther', min: 0, max: 500 },
    { kind: 'toggle', key: 'belote', label: 'scorebord.bl.belote' },
    { kind: 'toggle', key: 'beloteOther', label: 'scorebord.bl.beloteOther' },
    { kind: 'toggle', key: 'capot', label: 'scorebord.bl.capot' },
  ],
  compute: (values) => {
    const taker = num(values, 'taker');
    const team = klaverjasTeamOf(taker);
    const eigen = Math.min(num(values, 'points'), 162);
    const paar = <T>(mine: T, theirs: T): [T, T] => (team === 0 ? [mine, theirs] : [theirs, mine]);
    const score = scoreBeloteRound({
      cardPoints: paar(eigen, 162 - eigen),
      annonces: paar(num(values, 'annonces'), num(values, 'annoncesOther')),
      belote: paar(on(values, 'belote') ? 20 : 0, on(values, 'beloteOther') ? 20 : 0),
      takingTeam: team,
      takerTricks: on(values, 'capot') ? 8 : 0,
      config: DEFAULT_BELOTE_CONFIG,
    });
    return {
      points: spreadTeams(score.points, klaverjasTeamOf),
      labelKey: score.made ? 'scorebord.round.beloteMade' : 'scorebord.round.beloteDedans',
      params: { name: { player: taker }, points: score.raw[team] ?? 0 },
    };
  },
};

/* ---------- hartenjagen ---------- */

const HARTEN: SbGame = {
  id: 'hartenjagen',
  playerCounts: [4],
  lowWins: true,
  defaults: (n) => ({ penalties: new Array<number>(n).fill(0) }),
  fields: () => [
    { kind: 'perPlayer', key: 'penalties', label: 'scorebord.hj.penalties', min: 0, max: 26 },
  ],
  compute: (values, n) => {
    const penalties = list(values, 'penalties', n);
    const score = scoreHartenRound(penalties, DEFAULT_HARTEN_CONFIG);
    const totaal = penalties.reduce((a, b) => a + b, 0);
    return {
      points: score.points,
      labelKey:
        score.moonShooter === null ? 'scorebord.round.harten' : 'scorebord.round.hartenMoon',
      params: {
        name: score.moonShooter === null ? '' : { player: score.moonShooter },
        total: totaal,
      },
      ...(totaal === TOTAL_PENALTY
        ? {}
        : {
            hintKey: 'scorebord.hj.check',
            hintParams: { total: totaal, expected: TOTAL_PENALTY },
          }),
    };
  },
};

/* ---------- boerenbridge ---------- */

const BOEREN: SbGame = {
  id: 'boerenbridge',
  playerCounts: [3, 4, 5, 6],
  defaults: (n) => ({ bids: new Array<number>(n).fill(0), made: new Array<number>(n).fill(0) }),
  fields: () => [
    { kind: 'perPlayer', key: 'bids', label: 'scorebord.bb.bids', min: 0, max: 13 },
    { kind: 'perPlayer', key: 'made', label: 'scorebord.bb.made', min: 0, max: 13 },
  ],
  compute: (values, n) => {
    const bids = list(values, 'bids', n);
    const made = list(values, 'made', n);
    return {
      points: bids.map((bid, i) =>
        boerenRoundPoints(bid, made[i] as number, DEFAULT_BOEREN_CONFIG),
      ),
      labelKey: 'scorebord.round.boeren',
      params: { tricks: made.reduce((a, b) => a + b, 0), bids: bids.reduce((a, b) => a + b, 0) },
    };
  },
};

/* ---------- frans tarot ---------- */

const TAROT: SbGame = {
  id: 'tarot',
  playerCounts: [3, 4, 5],
  defaults: () => ({
    preneur: 0,
    partner: String(ALONE),
    contract: 'petite',
    points: 0,
    half: 0,
    bouts: 0,
    petit: '0',
    poignee: 'none',
    chelem: 'none',
  }),
  fields: (_values, n) => {
    const velden: SbField[] = [{ kind: 'player', key: 'preneur', label: 'scorebord.tt.preneur' }];
    if (n === 5) {
      velden.push({
        kind: 'player',
        key: 'partner',
        label: 'scorebord.tt.partner',
        extra: [{ value: String(ALONE), label: 'scorebord.tt.alone' }],
      });
    }
    velden.push(
      {
        kind: 'choice',
        key: 'contract',
        label: 'scorebord.contract',
        options: TAROT_CONTRACTS.map((c) => ({
          value: c.id,
          label: `tarot.contract.${c.id}`,
        })),
      },
      { kind: 'number', key: 'points', label: 'scorebord.tt.points', min: 0, max: 91 },
      { kind: 'toggle', key: 'half', extraField: true, label: 'scorebord.tt.half' },
      { kind: 'number', key: 'bouts', label: 'scorebord.tt.bouts', min: 0, max: 3 },
      {
        kind: 'choice',
        key: 'petit',
        extraField: true,
        label: 'scorebord.tt.petitAuBout',
        options: [
          { value: '0', label: 'scorebord.tt.petitNone' },
          { value: '1', label: 'scorebord.tt.petitTaker' },
          { value: '-1', label: 'scorebord.tt.petitDefence' },
        ],
      },
      {
        kind: 'choice',
        key: 'poignee',
        extraField: true,
        label: 'scorebord.tt.poignee',
        options: [
          { value: 'none', label: 'tarot.poigneeNone' },
          { value: 'simple', label: 'scorebord.tt.poigneeSimple' },
          { value: 'double', label: 'scorebord.tt.poigneeDouble' },
          { value: 'triple', label: 'scorebord.tt.poigneeTriple' },
        ],
      },
      {
        kind: 'choice',
        key: 'chelem',
        extraField: true,
        label: 'scorebord.tt.chelem',
        options: [
          { value: 'none', label: 'scorebord.tt.chelemNone' },
          { value: 'made', label: 'scorebord.tt.chelemMade' },
          { value: 'announced-made', label: 'scorebord.tt.chelemAnnouncedMade' },
          { value: 'announced-failed', label: 'scorebord.tt.chelemAnnouncedFailed' },
        ],
      },
    );
    return velden;
  },
  compute: (values, n) => {
    const preneur = num(values, 'preneur');
    const gekozen = num(values, 'partner', ALONE);
    const partner = n === 5 && gekozen !== ALONE && gekozen !== preneur ? gekozen : null;
    const poignee = str(values, 'poignee', 'none');
    const score = scoreTarotRound({
      players: n as TarotPlayers,
      preneur,
      partner,
      contract: str(values, 'contract', 'petite') as TarotContractId,
      preneurHalf: Math.min(num(values, 'points'), 91) * 2 + (on(values, 'half') ? 1 : 0),
      bouts: Math.min(num(values, 'bouts'), 3),
      petitAuBout: num(values, 'petit') as 0 | 1 | -1,
      poigneePoints: poignee === 'none' ? 0 : POIGNEE_POINTS[poignee as PoigneeSize],
      chelem: str(values, 'chelem', 'none') as ChelemOutcome,
      rounding: 'exact',
    });
    // Het bord telt in hele punten: de halve punten zitten enkel in de telling
    // van de kaarten, en die vallen bij het delen door twee altijd weg.
    return {
      points: score.pointsHalf.map((half) => half / 2),
      labelKey: score.made ? 'scorebord.round.tarotMade' : 'scorebord.round.tarotFailed',
      params: {
        name: { player: preneur },
        contract: { i18n: `tarot.contract.${str(values, 'contract', 'petite')}` },
        points: formatHalfPoints(score.preneurHalf),
        target: formatHalfPoints(score.targetHalf),
        bouts: score.bouts,
      },
    };
  },
};

/* ---------- register ---------- */

export const SB_GAMES: SbGame[] = [
  WIEZEN,
  MANILLE,
  BIEDEN,
  KLAVERJAS,
  BELOTE,
  HARTEN,
  BOEREN,
  TAROT,
];

export function sbGame(id: string): SbGame | undefined {
  return SB_GAMES.find((g) => g.id === id);
}

/** Welke automodi kan je met dit aantal deelnemers spelen? */
export function sbGamesFor(participants: number): SbGame[] {
  return SB_GAMES.filter((g) => g.playerCounts.includes(participants));
}

/** Alle deelnemersaantallen waarvoor er minstens één automodus bestaat. */
export const SB_PLAYER_COUNTS: number[] = [2, 3, 4, 5, 6];
