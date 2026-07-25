import { describe, expect, it } from 'vitest';
import {
  ALONE,
  canGoAlone,
  computeWiezenRound,
  needsPartner,
  scorebordContracts,
} from './scorebord-wiezen';

describe('scorebord — wiezen-automodus', () => {
  it('vraag & mee met maat: teamcontract, 8 slagen gehaald', () => {
    const r = computeWiezenRound({
      contractId: 'vraag-en-mee',
      declarer: 0,
      partner: 2,
      tricks: 8,
    });
    expect(r.contract.id).toBe('vraag-en-mee');
    expect(r.declarers).toEqual([0, 2]);
    expect(r.points).toEqual([2, -2, 2, -2]);
  });

  it('vraag & mee met overslagen telt +1 per slag boven 8', () => {
    const r = computeWiezenRound({
      contractId: 'vraag-en-mee',
      declarer: 1,
      partner: 3,
      tricks: 10,
    });
    expect(r.points).toEqual([-4, 4, -4, 4]);
  });

  it('vraag & mee zonder maat wordt "alleen": doel 5 slagen, solo verrekend', () => {
    const r = computeWiezenRound({
      contractId: 'vraag-en-mee',
      declarer: 0,
      partner: ALONE,
      tricks: 6,
    });
    expect(r.contract.id).toBe('alleen');
    expect(r.declarers).toEqual([0]);
    // 6 slagen = basis 3 + 1 overslag = 4 → speler +12, elke tegenspeler −4
    expect(r.points).toEqual([12, -4, -4, -4]);
    expect(r.points.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('alleen niet gehaald betaalt symmetrisch', () => {
    const r = computeWiezenRound({
      contractId: 'vraag-en-mee',
      declarer: 2,
      partner: ALONE,
      tricks: 3,
    });
    expect(r.contract.id).toBe('alleen');
    // 3 slagen = 2 onder doel → −(3 + 2·1) = −5 → speler −15, rest +5
    expect(r.points).toEqual([5, 5, -15, 5]);
  });

  it('troel houdt altijd een maat; geen alleen-optie', () => {
    expect(canGoAlone('troel')).toBe(false);
    expect(needsPartner('troel')).toBe(true);
    const r = computeWiezenRound({ contractId: 'troel', declarer: 0, partner: 2, tricks: 9 });
    expect(r.contract.id).toBe('troel');
    expect(r.points).toEqual([6, -6, 6, -6]); // 4 + 1 overslag ×2
  });

  it('solocontracten hebben geen maat nodig', () => {
    expect(needsPartner('abondance-9')).toBe(false);
    expect(canGoAlone('abondance-9')).toBe(false);
    const r = computeWiezenRound({
      contractId: 'abondance-9',
      declarer: 3,
      partner: ALONE,
      tricks: 9,
    });
    expect(r.contract.id).toBe('abondance-9');
    expect(r.points).toEqual([-6, -6, -6, 18]);
  });

  it('miserie: exact 0 slagen', () => {
    const won = computeWiezenRound({
      contractId: 'miserie',
      declarer: 1,
      partner: ALONE,
      tricks: 0,
    });
    expect(won.points).toEqual([-7, 21, -7, -7]);
    const lost = computeWiezenRound({
      contractId: 'miserie',
      declarer: 1,
      partner: ALONE,
      tricks: 2,
    });
    expect(lost.points).toEqual([7, -21, 7, 7]);
  });

  it('biedt alle contracten uit de ruleset aan', () => {
    const ids = scorebordContracts().map((c) => c.id);
    expect(ids).toContain('vraag-en-mee');
    expect(ids).toContain('troel');
    expect(ids).toContain('soloslim');
  });
});
