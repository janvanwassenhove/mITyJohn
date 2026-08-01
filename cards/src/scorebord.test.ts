import { beforeEach, describe, expect, it } from 'vitest';
import { isGameId } from './games';
import { SB_GAMES } from './scorebord-games';
import {
  addRound,
  canUseMode,
  clear,
  leader,
  load,
  newScorebord,
  removeRound,
  resetRounds,
  save,
  setMode,
  totals,
  winner,
} from './scorebord';

describe('scorebord', () => {
  beforeEach(() => localStorage.clear());

  it('telt totalen per deelnemer over de rondes', () => {
    let sb = newScorebord(['Jan', 'Piet']);
    sb = addRound(sb, [10, -10]);
    sb = addRound(sb, [4, -4]);
    expect(totals(sb)).toEqual([14, -14]);
  });

  it('vult ontbrekende waarden aan met 0', () => {
    let sb = newScorebord(['A', 'B', 'C']);
    sb = addRound(sb, [5]);
    expect(totals(sb)).toEqual([5, 0, 0]);
  });

  it('wijst de leider aan (hoogste totaal), −1 bij gelijkspel', () => {
    let sb = newScorebord(['A', 'B']);
    expect(leader(sb)).toBe(-1); // nog geen rondes
    sb = addRound(sb, [5, 3]);
    expect(leader(sb)).toBe(0);
    sb = addRound(sb, [0, 2]);
    expect(leader(sb)).toBe(-1); // 5-5 gelijk
  });

  it('lowWins: laagste totaal leidt en wint', () => {
    let sb = newScorebord(['A', 'B'], 0, true);
    sb = addRound(sb, [3, 8]);
    expect(leader(sb)).toBe(0);
  });

  it('detecteert een winnaar zodra het doel bereikt is', () => {
    let sb = newScorebord(['A', 'B'], 20);
    expect(winner(sb)).toBeNull();
    sb = addRound(sb, [12, 5]);
    expect(winner(sb)).toBeNull();
    sb = addRound(sb, [10, 3]);
    expect(winner(sb)).toBe(0); // 22 ≥ 20
  });

  it('verwijdert en reset rondes, met bijhorende labels', () => {
    let sb = newScorebord(['A', 'B']);
    sb = addRound(sb, [1, 2], 'ronde 1');
    sb = addRound(sb, [3, 4], 'ronde 2');
    expect(sb.labels).toEqual(['ronde 1', 'ronde 2']);
    sb = removeRound(sb, 0);
    expect(sb.rounds).toEqual([[3, 4]]);
    expect(sb.labels).toEqual(['ronde 2']);
    sb = resetRounds(sb);
    expect(sb.rounds).toEqual([]);
    expect(sb.labels).toEqual([]);
  });

  it('wiezen-modus wordt bewaard', () => {
    const sb = newScorebord(['A', 'B', 'C', 'D'], null, false, 'wiezen');
    expect(sb.mode).toBe('wiezen');
  });

  it('bewaart en laadt via localStorage, weigert corrupte opslag', () => {
    const sb = addRound(newScorebord(['A', 'B'], 50), [10, 20]);
    save(sb);
    expect(load()).toEqual(sb);
    clear();
    expect(load()).toBeNull();
    localStorage.setItem('cards.scorebord.v1', '{"v":1,"participants":["A"]}');
    expect(load()).toBeNull(); // te weinig deelnemers
  });
});

describe('modus wisselen op een lopend bord', () => {
  it('houdt namen en rondes bij het wisselen', () => {
    let sb = newScorebord(['Limme', 'Jan', 'Jappe', 'Elke'], null, false, 'manueel');
    sb = addRound(sb, [1, 2, 3, 4], 'handmatig');
    const wiezen = setMode(sb, 'wiezen');
    expect(wiezen.mode).toBe('wiezen');
    expect(wiezen.participants).toEqual(['Limme', 'Jan', 'Jappe', 'Elke']);
    expect(wiezen.rounds).toEqual([[1, 2, 3, 4]]);
    expect(wiezen.labels).toEqual(['handmatig']);
    // en terug
    expect(setMode(wiezen, 'manueel').mode).toBe('manueel');
  });

  it('weigert wiezen-automodus bij minder dan vier spelers', () => {
    const sb = newScorebord(['Jan', 'Elke'], null, false, 'manueel');
    expect(canUseMode(sb, 'wiezen')).toBe(false);
    expect(setMode(sb, 'wiezen').mode).toBe('manueel');
  });

  it('laat vier spelers wel toe', () => {
    const sb = newScorebord(['a', 'b', 'c', 'd']);
    expect(canUseMode(sb, 'wiezen')).toBe(true);
  });

  it('koppelt elke automodus aan zijn eigen deelnemersaantallen', () => {
    const drie = newScorebord(['a', 'b', 'c']);
    const vijf = newScorebord(['a', 'b', 'c', 'd', 'e']);
    // Wiezen speelt met vier, tarot met drie tot vijf, boerenbridge vanaf drie.
    expect(canUseMode(drie, 'wiezen')).toBe(false);
    expect(canUseMode(drie, 'tarot')).toBe(true);
    expect(canUseMode(drie, 'boerenbridge')).toBe(true);
    expect(canUseMode(vijf, 'tarot')).toBe(true);
    expect(canUseMode(vijf, 'klaverjassen')).toBe(false);
    // Manueel kan altijd.
    expect(canUseMode(drie, 'manueel')).toBe(true);
  });
});

describe('bewaarde modus', () => {
  it('elke automodus is een geldig spel-id, zodat de keuze een herlaadbeurt overleeft', () => {
    // main.ts leest cards.scorebordMode terug met isGameId(); staat een modus
    // daar niet in, dan valt hij stilletjes terug op manueel.
    for (const game of SB_GAMES) expect(isGameId(game.id)).toBe(true);
  });
});

describe('rondelabels zijn taalonafhankelijk', () => {
  it('bewaart de ronde gestructureerd, niet als tekst', () => {
    let sb = newScorebord(['Jan', 'Jappe', 'Limme', 'Elke'], null, false, 'wiezen');
    const meta = {
      game: 'wiezen' as const,
      labelKey: 'scorebord.round.wiezen',
      params: {
        contract: { i18n: 'contract.vraag-en-mee' },
        players: { players: [0, 1] },
        tricks: 9,
        target: 8,
      },
    };
    sb = addRound(sb, [3, 3, -3, -3], 'Vraag & mee — Jan + Jappe · 9/8 slagen', meta);
    expect(sb.meta[0]).toEqual(meta);
  });

  it('houdt meta in pas bij verwijderen en wissen', () => {
    let sb = newScorebord(['a', 'b', 'c', 'd'], null, false, 'wiezen');
    const meta = {
      game: 'wiezen' as const,
      labelKey: 'scorebord.round.wiezen',
      params: { contract: { i18n: 'contract.troel' }, players: { players: [0, 2] }, tricks: 8 },
    };
    sb = addRound(sb, [1, 1, 1, 1], 'x', meta);
    sb = addRound(sb, [2, 2, 2, 2], 'y', { ...meta, params: { ...meta.params, tricks: 10 } });
    sb = removeRound(sb, 0);
    expect(sb.meta).toHaveLength(1);
    expect(sb.meta[0]?.params.tricks).toBe(10);
    expect(resetRounds(sb).meta).toEqual([]);
  });

  it('oude borden zonder meta blijven werken', () => {
    const oud = {
      v: 1,
      mode: 'wiezen',
      participants: ['a', 'b', 'c', 'd'],
      target: null,
      lowWins: false,
      rounds: [[1, 1, -1, -1]],
      labels: ['Vraag & mee — a + b'],
    };
    localStorage.setItem('cards.scorebord.v1', JSON.stringify(oud));
    const geladen = load();
    expect(geladen?.meta).toEqual([null]);
    expect(geladen?.labels).toEqual(['Vraag & mee — a + b']);
  });
});
