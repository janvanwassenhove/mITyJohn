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
}

export const GAMES: GameInfo[] = [
  { id: 'wiezen', icon: '♠', nameKey: 'game.wiezen', tileKey: 'tile.wiezen' },
  { id: 'manille', icon: '♥', nameKey: 'game.manillen', tileKey: 'tile.manillen' },
  { id: 'bieden', icon: '♣', nameKey: 'game.bieden', tileKey: 'tile.bieden' },
  {
    id: 'klaverjassen',
    icon: '♦',
    nameKey: 'game.klaverjassen',
    tileKey: 'tile.klaverjassen',
  },
  { id: 'belote', icon: '\u{1F1EB}\u{1F1F7}', nameKey: 'game.belote', tileKey: 'tile.belote' },
  {
    id: 'hartenjagen',
    icon: '\u{1F494}',
    nameKey: 'game.hartenjagen',
    tileKey: 'tile.hartenjagen',
  },
  {
    id: 'boerenbridge',
    icon: '\u{1F3AF}',
    nameKey: 'game.boerenbridge',
    tileKey: 'tile.boerenbridge',
  },
  { id: 'tarot', icon: '\u{1F52E}', nameKey: 'game.tarot', tileKey: 'tile.tarot' },
];

export const GAME_IDS: GameId[] = GAMES.map((g) => g.id);

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as string[]).includes(value);
}
