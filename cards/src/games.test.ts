import { describe, expect, it } from 'vitest';
import {
  APP_PLAYER_COUNTS,
  GAMES,
  GAME_IDS,
  gamesForPlayers,
  isGameId,
  type GameId,
} from './games';
import { WIZARD_STEPS } from './coach';
import { chapterForGame, getChapter } from './guide';
import nl from './i18n/locales/nl.json';
import en from './i18n/locales/en.json';
import fr from './i18n/locales/fr.json';

/**
 * Deze test bestaat om één concrete fout te vangen: boerenbridge en tarot waren
 * wél te spelen maar stonden niet in de spelkiezer van de starterswizard, omdat
 * die lijst apart werd bijgehouden. Alles hieronder hangt nu aan GAMES.
 */
describe('spelcatalogus', () => {
  it('heeft geen dubbels', () => {
    expect(new Set(GAME_IDS).size).toBe(GAME_IDS.length);
  });

  it('herkent alleen echte spel-ids', () => {
    for (const id of GAME_IDS) expect(isGameId(id)).toBe(true);
    expect(isGameId('poker')).toBe(false);
    expect(isGameId(null)).toBe(false);
  });

  it('elk spel heeft een starterswizard', () => {
    for (const id of GAME_IDS) {
      expect(WIZARD_STEPS[id], `wizard ontbreekt voor ${id}`).toBeGreaterThan(0);
    }
    // En omgekeerd: geen wizard voor een spel dat niet in de catalogus staat.
    expect(Object.keys(WIZARD_STEPS).sort()).toEqual([...GAME_IDS].sort());
  });

  it('elk spel wijst naar een bestaand gidshoofdstuk', () => {
    for (const id of GAME_IDS) {
      const chapter = chapterForGame(id, 'vlaams-standaard');
      expect(getChapter(chapter), `gidshoofdstuk ontbreekt voor ${id}`).toBeDefined();
    }
    // Wiezen splitst in twee hoofdstukken, naargelang de gekozen ruleset.
    expect(chapterForGame('wiezen', 'kleurenwiezen')).toBe('kleurenwiezen');
    expect(chapterForGame('wiezen', 'vlaams-standaard')).toBe('gewoon-wiezen');
  });

  it('elk spel heeft een naam, een tegeltekst en wizardstappen in de drie talen', () => {
    const bundles: [string, Record<string, string>][] = [
      ['nl', nl as Record<string, string>],
      ['en', en as Record<string, string>],
      ['fr', fr as Record<string, string>],
    ];
    for (const game of GAMES) {
      for (const [taal, bundle] of bundles) {
        expect(bundle[game.nameKey], `${game.nameKey} ontbreekt in ${taal}`).toBeTruthy();
        expect(bundle[game.tileKey], `${game.tileKey} ontbreekt in ${taal}`).toBeTruthy();
        for (let n = 1; n <= WIZARD_STEPS[game.id]; n++) {
          expect(
            bundle[`wizard.${game.id}.${n}.title`],
            `wizard.${game.id}.${n}.title ontbreekt in ${taal}`,
          ).toBeTruthy();
          expect(
            bundle[`wizard.${game.id}.${n}.body`],
            `wizard.${game.id}.${n}.body ontbreekt in ${taal}`,
          ).toBeTruthy();
        }
      }
      expect(game.icon.length).toBeGreaterThan(0);
    }
  });

  it('koppelt de speltegels aan het aantal spelers', () => {
    // Elk spel moet minstens één aantal kunnen, anders is het nergens te kiezen.
    for (const g of GAMES) {
      expect(g.players.length, `${g.id} heeft geen spelersaantal`).toBeGreaterThan(0);
      for (const n of g.players) expect(APP_PLAYER_COUNTS).toContain(n);
    }
    // De keuzeknoppen zijn precies de aantallen die minstens één spel kan delen.
    expect(APP_PLAYER_COUNTS).toEqual([3, 4, 5]);
    // Met vier kan alles; met drie of vijf enkel tarot.
    expect(gamesForPlayers(4).map((g) => g.id)).toEqual(GAME_IDS);
    expect(gamesForPlayers(3).map((g) => g.id)).toEqual(['tarot']);
    expect(gamesForPlayers(5).map((g) => g.id)).toEqual(['tarot']);
    // Er blijft altijd iets over om te kiezen, anders staat het startscherm leeg.
    for (const n of APP_PLAYER_COUNTS) expect(gamesForPlayers(n).length).toBeGreaterThan(0);
  });

  it('bevat alle acht spellen, in de volgorde van het startscherm', () => {
    const verwacht: GameId[] = [
      'wiezen',
      'manille',
      'bieden',
      'klaverjassen',
      'belote',
      'hartenjagen',
      'boerenbridge',
      'tarot',
    ];
    expect(GAME_IDS).toEqual(verwacht);
  });
});
