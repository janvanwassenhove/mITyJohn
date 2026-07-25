// Sessie-opties (Fase 4c): de open regelvragen uit docs/REGELS.md en
// docs/REGELS-MANILLEN.md worden hier instelbaar gemaakt. De huidige,
// gedocumenteerde keuze is telkens de default. Opties gaan mee in de
// persistentie zodat een herstelde sessie exact dezelfde regels gebruikt.

import type { Contract, Ruleset } from './ruleset';

/* ---------- wiezen ---------- */

export interface WiezenOptions {
  /** Troel — doel: samen 8 (default) of 9 slagen (REGELS.md §5.4 vraag 1). */
  troelTarget: 8 | 9;
  /** Troel overbiedbaar vanaf abondance 9 (default true) of onoverbiedbaar (vraag 2). */
  troelOverbiddable: boolean;
  /** Kleine + grote miserie apart (default false = één miserie) (vraag 3). */
  kleineMiserie: boolean;
}

export const DEFAULT_WIEZEN_OPTIONS: WiezenOptions = {
  troelTarget: 8,
  troelOverbiddable: true,
  kleineMiserie: false,
};

const UNREACHABLE_RANK = 999;

export function isWiezenOptions(value: unknown): value is WiezenOptions {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    (o['troelTarget'] === 8 || o['troelTarget'] === 9) &&
    typeof o['troelOverbiddable'] === 'boolean' &&
    typeof o['kleineMiserie'] === 'boolean'
  );
}

/** Bouw een effectieve ruleset uit een basis-ruleset + gekozen opties. */
export function buildWiezenRuleset(base: Ruleset, opts: WiezenOptions): Ruleset {
  const rs = JSON.parse(JSON.stringify(base)) as Ruleset;
  let contracts = rs.contracts;

  if (opts.kleineMiserie) {
    const mIdx = contracts.findIndex((c) => c.id === 'miserie');
    if (mIdx >= 0) {
      // Kleine miserie: 0 slagen, geen troef, net onder de (grote) miserie.
      // ⚠️ AANNAME — rang en punten door de opdrachtgever te bevestigen.
      const kleine: Contract = {
        id: 'kleine-miserie',
        rank: 0,
        team: 1,
        target: { tricks: 0, exact: true },
        trump: 'none',
        multipleDeclarers: true,
        score: { base: 5 },
      };
      contracts = [...contracts.slice(0, mIdx), kleine, ...contracts.slice(mIdx)];
    }
  }

  // Ranks stabiel hernummeren zodat de biedladder strikt stijgend blijft.
  contracts.forEach((c, i) => {
    c.rank = i + 1;
  });

  const troel = contracts.find((c) => c.id === 'troel');
  if (troel) {
    troel.target = { ...troel.target, tricks: opts.troelTarget, combined: true };
    if (opts.troelOverbiddable) {
      const ab9 = contracts.find((c) => c.id === 'abondance-9');
      troel.overbiddableFromRank = ab9 ? ab9.rank : troel.rank + 1;
    } else {
      troel.overbiddableFromRank = UNREACHABLE_RANK;
    }
  }

  rs.contracts = contracts;
  return rs;
}

/* ---------- manille ---------- */

export interface ManilleOptions {
  /** Puntenmodel: enkel kaartpunten 60 (default) of met slagpunten 68 (vraag 1). */
  pointModel: 60 | 68;
  /** Troefbepaling: deler kiest (default), laatste kaart, of maat van de deler (vraag 2). */
  trumpMode: 'dealer' | 'turned' | 'partner';
  /** Multiplicators toestaan (zonder troef ×2) (default false) (vraag 3). */
  multipliers: boolean;
  /** Niet moeten troeven als de maat de slag al wint (default false) (vraag 4). */
  maatLigt: boolean;
  /** Sessiedoel in punten: 101 (default) of 61 (vraag 5). */
  targetPoints: number;
}

export const DEFAULT_MANILLE_OPTIONS: ManilleOptions = {
  pointModel: 60,
  trumpMode: 'dealer',
  multipliers: false,
  maatLigt: false,
  targetPoints: 101,
};

export function isManilleOptions(value: unknown): value is ManilleOptions {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    (o['pointModel'] === 60 || o['pointModel'] === 68) &&
    (o['trumpMode'] === 'dealer' || o['trumpMode'] === 'turned' || o['trumpMode'] === 'partner') &&
    typeof o['multipliers'] === 'boolean' &&
    typeof o['maatLigt'] === 'boolean' &&
    typeof o['targetPoints'] === 'number'
  );
}
