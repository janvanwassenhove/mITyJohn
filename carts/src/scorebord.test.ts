import { beforeEach, describe, expect, it } from 'vitest';
import {
  addRound,
  clear,
  leader,
  load,
  newScorebord,
  removeRound,
  resetRounds,
  save,
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
    localStorage.setItem('carts.scorebord.v1', '{"v":1,"participants":["A"]}');
    expect(load()).toBeNull(); // te weinig deelnemers
  });
});
