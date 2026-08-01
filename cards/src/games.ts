// Eén catalogus van spellen, gedeeld door het startscherm, de starterswizard en
// de regelgids.
//
// Waarom dit bestand bestaat: de spellen stonden op drie plaatsen apart
// opgesomd, en bij het toevoegen van boerenbridge en tarot bleef de lijst in de
// wizard achter — je kon die twee spellen dus nergens leren. Eén lijst, en
// games.test.ts bewaakt dat elk spel overal geregistreerd is.

export type GameId =
  | 'wiezen'
  | 'manille'
  | 'bieden'
  | 'klaverjassen'
  | 'belote'
  | 'hartenjagen'
  | 'boerenbridge'
  | 'tarot';

export interface GameInfo {
  id: GameId;
  /** Icoon op de speltegel van het startscherm. */
  icon: string;
  /** i18n-sleutel voor de naam ('manille' heet in de teksten 'manillen'). */
  nameKey: string;
  /** i18n-sleutel voor de één-regelbeschrijving op de tegel. */
  tileKey: string;
  /** Met hoeveel spelers de app dit spel kan delen. Enkel tarot heeft keuze;
   *  de rest deelt vier handen. Los van scorebord-games.ts: daar telt wat er
   *  aan een fysieke tafel kan, hier wat de engine effectief speelt. */
  players: number[];
}

export const GAMES: GameInfo[] = [
  { id: 'wiezen', icon: '♠', nameKey: 'game.wiezen', tileKey: 'tile.wiezen', players: [4] },
  { id: 'manille', icon: '♥', nameKey: 'game.manillen', tileKey: 'tile.manillen', players: [4] },
  { id: 'bieden', icon: '♣', nameKey: 'game.bieden', tileKey: 'tile.bieden', players: [4] },
  {
    id: 'klaverjassen',
    icon: '♦',
    nameKey: 'game.klaverjassen',
    tileKey: 'tile.klaverjassen',
    players: [4],
  },
  {
    id: 'belote',
    icon: '\u{1F1EB}\u{1F1F7}',
    nameKey: 'game.belote',
    tileKey: 'tile.belote',
    players: [4],
  },
  {
    id: 'hartenjagen',
    icon: '\u{1F494}',
    nameKey: 'game.hartenjagen',
    tileKey: 'tile.hartenjagen',
    players: [4],
  },
  {
    id: 'boerenbridge',
    icon: '\u{1F3AF}',
    nameKey: 'game.boerenbridge',
    tileKey: 'tile.boerenbridge',
    players: [4],
  },
  {
    id: 'tarot',
    icon: '\u{1F52E}',
    nameKey: 'game.tarot',
    tileKey: 'tile.tarot',
    players: [3, 4, 5],
  },
];

export const GAME_IDS: GameId[] = GAMES.map((g) => g.id);

/** De aantallen waaruit je op het startscherm kan kiezen: alles wat minstens
 *  één spel kan delen. */
export const APP_PLAYER_COUNTS: number[] = [...new Set(GAMES.flatMap((g) => g.players))].sort(
  (a, b) => a - b,
);

/** Welke spellen je met dit aantal spelers kan spelen, in cataloguevolgorde. */
export function gamesForPlayers(n: number): GameInfo[] {
  return GAMES.filter((g) => g.players.includes(n));
}

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as string[]).includes(value);
}
