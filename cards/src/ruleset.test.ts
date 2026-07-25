import { describe, expect, it } from 'vitest';
import { getRuleset, rulesets } from './ruleset';
import { LOCALES } from './i18n';

describe.each(rulesets.map((r) => [r.id] as const))('ruleset %s', (id) => {
  const ruleset = getRuleset(id);

  it('is geladen en geregistreerd', () => {
    expect(ruleset).toBeDefined();
    expect(rulesets).toContain(ruleset);
    expect(ruleset?.game).toBe('wiezen');
    expect(ruleset?.players).toBe(4);
  });

  it('heeft een naam in elke ondersteunde taal', () => {
    for (const locale of LOCALES) {
      expect(ruleset?.name[locale]).toBeTruthy();
    }
  });

  it('heeft unieke contract-ids en een strikt stijgende biedladder', () => {
    const contracts = ruleset?.contracts ?? [];
    expect(contracts.length).toBeGreaterThan(0);
    const ids = contracts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const ranks = contracts.map((c) => c.rank);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1] as number);
    }
  });

  it('heeft coherente doelen en scores', () => {
    for (const c of ruleset?.contracts ?? []) {
      expect(c.team === 1 || c.team === 2).toBe(true);
      expect(c.target.tricks).toBeGreaterThanOrEqual(0);
      expect(c.target.tricks).toBeLessThanOrEqual(13);
      expect(c.score.base).toBeGreaterThan(0);
    }
  });

  it('hogere contracten zijn nooit goedkoper dan lagere', () => {
    const contracts = ruleset?.contracts ?? [];
    for (let i = 1; i < contracts.length; i++) {
      expect(contracts[i]?.score.base).toBeGreaterThanOrEqual(
        contracts[i - 1]?.score.base as number,
      );
    }
  });
});
