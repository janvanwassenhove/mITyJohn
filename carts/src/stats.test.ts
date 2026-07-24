import { beforeEach, describe, expect, it } from 'vitest';
import { clearStats, loadStats, recordGiftStat, recordSessionStat } from './stats';

describe('statistieken', () => {
  beforeEach(() => localStorage.clear());

  it('telt giften per contract, met spelersaandeel', () => {
    recordGiftStat('vraag-en-mee', true, true, 4);
    recordGiftStat('vraag-en-mee', false, false, -2);
    recordGiftStat('miserie', true, false, -21);
    const stats = loadStats();
    expect(stats.contracts['vraag-en-mee']).toEqual({
      played: 2,
      declared: 1,
      declaredWon: 1,
      points: 2,
    });
    expect(stats.contracts['miserie']).toEqual({
      played: 1,
      declared: 1,
      declaredWon: 0,
      points: -21,
    });
  });

  it('registreert sessies met winst voor de hoogste score', () => {
    recordSessionStat('vlaams-standaard', 'normal', [10, -4, -4, -2]);
    recordSessionStat('vlaams-cafe', 'strong', [-10, 4, 4, 2]);
    const stats = loadStats();
    expect(stats.sessions).toHaveLength(2);
    expect(stats.sessions[0]?.won).toBe(true);
    expect(stats.sessions[1]?.won).toBe(false);
  });

  it('wist alles bij reset en overleeft corrupte opslag', () => {
    recordGiftStat('alleen', false, false, 0);
    clearStats();
    expect(loadStats().sessions).toHaveLength(0);
    localStorage.setItem('carts.stats.v1', 'niet-json');
    expect(loadStats().contracts).toEqual({});
  });
});
