import vlaamsStandaard from '../../rulesets/vlaams-standaard.json';
import type { Locale } from './i18n';

export interface ContractScore {
  base: number;
  perOvertrick?: number;
  perUndertrick?: number;
  voleBonus?: number;
}

export interface Contract {
  id: string;
  rank: number;
  team: number;
  target: { tricks: number; combined?: boolean; exact?: boolean };
  trump: string;
  score: ContractScore;
}

export interface Ruleset {
  id: string;
  game: string;
  name: Record<Locale, string>;
  version: string;
  players: number;
  contracts: Contract[];
}

export const rulesets: Ruleset[] = [vlaamsStandaard as unknown as Ruleset];

export function getRuleset(id: string): Ruleset | undefined {
  return rulesets.find((r) => r.id === id);
}
