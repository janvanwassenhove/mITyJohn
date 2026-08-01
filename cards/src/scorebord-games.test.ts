import { describe, expect, it } from 'vitest';
import { SB_GAMES, SB_PLAYER_COUNTS, sbGame, sbGamesFor, type SbValues } from './scorebord-games';
import { GAME_IDS } from './games';
import nl from './i18n/locales/nl.json';
import en from './i18n/locales/en.json';
import fr from './i18n/locales/fr.json';

const bundles: [string, Record<string, string>][] = [
  ['nl', nl as Record<string, string>],
  ['en', en as Record<string, string>],
  ['fr', fr as Record<string, string>],
];

describe('scorebord — automodi', () => {
  it('elk spel uit de catalogus heeft een automodus', () => {
    expect(SB_GAMES.map((g) => g.id).sort()).toEqual([...GAME_IDS].sort());
  });

  it('koppelt de deelnemersaantallen aan de spellen', () => {
    // Vier spelers: alles behalve niets. Drie: enkel wat met drie kan.
    expect(sbGamesFor(4).map((g) => g.id)).toContain('wiezen');
    expect(
      sbGamesFor(3)
        .map((g) => g.id)
        .sort(),
    ).toEqual(['boerenbridge', 'tarot']);
    expect(
      sbGamesFor(5)
        .map((g) => g.id)
        .sort(),
    ).toEqual(['boerenbridge', 'tarot']);
    expect(sbGamesFor(6).map((g) => g.id)).toEqual(['boerenbridge']);
    // Twee deelnemers: geen enkel kaartspel, dus enkel manueel.
    expect(sbGamesFor(2)).toEqual([]);
    for (const g of SB_GAMES) {
      for (const n of g.playerCounts) expect(SB_PLAYER_COUNTS).toContain(n);
    }
  });

  it('alle veld- en labelteksten bestaan in de drie talen', () => {
    for (const game of SB_GAMES) {
      const n = game.playerCounts[0] as number;
      const values = game.defaults(n);
      const keys = new Set<string>();
      for (const field of game.fields(values, n)) {
        keys.add(field.label);
        if (field.kind === 'choice') for (const o of field.options) keys.add(o.label);
        if (field.kind === 'player') for (const o of field.extra ?? []) keys.add(o.label);
      }
      const result = game.compute(values, n);
      keys.add(result.labelKey);
      if (result.hintKey) keys.add(result.hintKey);
      for (const [taal, bundle] of bundles) {
        for (const key of keys) {
          expect(bundle[key], `${key} ontbreekt in ${taal} (${game.id})`).toBeTruthy();
        }
      }
    }
  });

  it('geeft voor elke deelnemer een puntenwaarde terug', () => {
    for (const game of SB_GAMES) {
      for (const n of game.playerCounts) {
        const result = game.compute(game.defaults(n), n);
        expect(result.points, `${game.id} met ${n}`).toHaveLength(n);
        expect(result.points.every((p) => Number.isFinite(p))).toBe(true);
      }
    }
  });
});

describe('scorebord — de telling volgt de spelregels', () => {
  const compute = (id: string, values: SbValues, n = 4) => {
    const game = sbGame(id) as NonNullable<ReturnType<typeof sbGame>>;
    return game.compute({ ...game.defaults(n), ...values }, n);
  };

  it('wiezen: vraag & mee met negen slagen levert de vragers +3 op', () => {
    const r = compute('wiezen', {
      contract: 'vraag-en-mee',
      declarer: 0,
      partner: 1,
      tricks: 9,
    });
    expect(r.points).toEqual([3, 3, -3, -3]);
  });

  it('manillen: het winnende team scoort wat het boven de helft haalde', () => {
    // 40 van de 60 punten voor de ploeg van speler 0 → 40 − 30 = 10.
    const r = compute('manille', { declarer: 0, model: '60', points: 40, multiplier: '1' });
    expect(r.points).toEqual([10, 0, 10, 0]);
    // Dubbel telt dubbel.
    const dubbel = compute('manille', { declarer: 0, model: '60', points: 40, multiplier: '2' });
    expect(dubbel.points).toEqual([20, 0, 20, 0]);
  });

  it('bieden: gehaald is +bod, gemist is −bod, en zero-sum', () => {
    const gehaald = compute('bieden', { declarer: 0, bid: 100, points: 110 });
    expect(gehaald.points).toEqual([100, -100, 100, -100]);
    const gemist = compute('bieden', { declarer: 0, bid: 100, points: 90 });
    expect(gemist.points).toEqual([-100, 100, -100, 100]);
  });

  it('klaverjassen: nat betekent alles naar de tegenpartij', () => {
    // 70 kaartpunten + 20 roem = 90 tegen 92: nat.
    const nat = compute('klaverjassen', { declarer: 0, points: 70, roem: 20, roemOther: 0 });
    expect(nat.points).toEqual([0, 162 + 20, 0, 162 + 20]);
    // 100 tegen 62: binnen, elk zijn eigen.
    const binnen = compute('klaverjassen', { declarer: 0, points: 100, roem: 0, roemOther: 0 });
    expect(binnen.points).toEqual([100, 62, 100, 62]);
  });

  it('belote: dedans geeft alles aan de tegenpartij, capot een bonus', () => {
    const dedans = compute('belote', { taker: 0, points: 70 });
    expect(dedans.points[0]).toBe(0);
    expect(dedans.points[1]).toBe(162);
    const capot = compute('belote', { taker: 0, points: 162, capot: 1 });
    expect(capot.points[0]).toBe(162 + 100);
  });

  it('hartenjagen: strafpunten, tenzij iemand alles haalt', () => {
    const gewoon = compute('hartenjagen', { penalties: [5, 8, 13, 0] });
    expect(gewoon.points).toEqual([5, 8, 13, 0]);
    const moon = compute('hartenjagen', { penalties: [26, 0, 0, 0] });
    expect(moon.points).toEqual([0, 26, 26, 26]);
    // De controle springt aan wanneer het totaal niet op 26 uitkomt.
    expect(compute('hartenjagen', { penalties: [1, 1, 1, 1] }).hintKey).toBe('scorebord.hj.check');
    expect(gewoon.hintKey).toBeUndefined();
  });

  it('boerenbridge: juist is 10 + 3 per slag, fout is −3 per verschil', () => {
    const r = compute('boerenbridge', { bids: [3, 0, 2, 1], made: [3, 1, 2, 4] });
    expect(r.points).toEqual([19, -3, 16, -9]);
  });

  it('tarot: (25 + écart) × factor, verdeeld volgens de aandelen', () => {
    // Garde (×2), 51 punten met 1 bout = precies gehaald → (25 + 0) × 2 = 50.
    const r = compute('tarot', { preneur: 0, contract: 'garde', points: 51, bouts: 1 }, 4);
    expect(r.points).toEqual([150, -50, -50, -50]);
    // Bij vijf spelers krijgt de geroepene één aandeel.
    const vijf = compute(
      'tarot',
      { preneur: 0, partner: 1, contract: 'garde', points: 51, bouts: 1 },
      5,
    );
    expect(vijf.points).toEqual([100, 50, -50, -50, -50]);
    expect(vijf.points.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('tarot: de premies tellen buiten de vermenigvuldiging', () => {
    const kaal = compute('tarot', { preneur: 0, contract: 'petite', points: 56, bouts: 0 }, 4);
    const metPoignee = compute(
      'tarot',
      { preneur: 0, contract: 'petite', points: 56, bouts: 0, poignee: 'double' },
      4,
    );
    // 30 punten poignée, niet ×1 maar gewoon +30 — en dus +30 per verdediger.
    expect((metPoignee.points[1] as number) - (kaal.points[1] as number)).toBe(-30);
  });
});
