import { describe, expect, it } from 'vitest';
import {
  buildWiezenRuleset,
  DEFAULT_WIEZEN_OPTIONS,
  isManilleOptions,
  isWiezenOptions,
} from './options';
import { getRuleset, type Ruleset } from './ruleset';

const base = getRuleset('vlaams-standaard') as Ruleset;

describe('wiezen sessie-opties', () => {
  it('defaults laten de biedladder inhoudelijk ongewijzigd', () => {
    const rs = buildWiezenRuleset(base, DEFAULT_WIEZEN_OPTIONS);
    expect(rs.contracts.map((c) => c.id)).toEqual(base.contracts.map((c) => c.id));
    expect(rs.contracts.find((c) => c.id === 'troel')?.target.tricks).toBe(8);
  });

  it('troel-doel wordt 9 slagen', () => {
    const rs = buildWiezenRuleset(base, { ...DEFAULT_WIEZEN_OPTIONS, troelTarget: 9 });
    expect(rs.contracts.find((c) => c.id === 'troel')?.target.tricks).toBe(9);
  });

  it('onoverbiedbare troel krijgt een onbereikbare overbied-rang', () => {
    const rs = buildWiezenRuleset(base, { ...DEFAULT_WIEZEN_OPTIONS, troelOverbiddable: false });
    const troel = rs.contracts.find((c) => c.id === 'troel');
    const maxRank = Math.max(...rs.contracts.map((c) => c.rank));
    expect(troel?.overbiddableFromRank).toBeGreaterThan(maxRank);
  });

  it('kleine miserie voegt een apart contract toe onder de grote miserie', () => {
    const rs = buildWiezenRuleset(base, { ...DEFAULT_WIEZEN_OPTIONS, kleineMiserie: true });
    const ids = rs.contracts.map((c) => c.id);
    expect(ids).toContain('kleine-miserie');
    const kleine = rs.contracts.find((c) => c.id === 'kleine-miserie');
    const grote = rs.contracts.find((c) => c.id === 'miserie');
    expect(kleine?.rank).toBeLessThan(grote?.rank as number);
    // ranks blijven strikt stijgend en uniek
    const ranks = rs.contracts.map((c) => c.rank);
    expect(new Set(ranks).size).toBe(ranks.length);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1] as number);
    }
  });

  it('muteert de basis-ruleset niet', () => {
    const before = JSON.stringify(base);
    buildWiezenRuleset(base, { troelTarget: 9, troelOverbiddable: false, kleineMiserie: true });
    expect(JSON.stringify(base)).toBe(before);
  });

  it('validators herkennen geldige en ongeldige opties', () => {
    expect(isWiezenOptions(DEFAULT_WIEZEN_OPTIONS)).toBe(true);
    expect(isWiezenOptions({ troelTarget: 7 })).toBe(false);
    expect(
      isManilleOptions({
        pointModel: 60,
        trumpMode: 'dealer',
        multipliers: false,
        maatLigt: false,
        targetPoints: 101,
      }),
    ).toBe(true);
    expect(isManilleOptions({ pointModel: 99 })).toBe(false);
  });
});
