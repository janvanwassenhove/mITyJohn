import vlaamsStandaard from '../../rulesets/vlaams-standaard.json';
import type { Locale } from './i18n';

export interface ContractScore {
  base: number;
  perOvertrick?: number;
  perUndertrick?: number;
  voleBonus?: number;
}

export type TrumpRule = 'turned' | 'declarer-choice' | 'none' | 'first-card-led';
export type OpeningLead = 'left-of-dealer' | 'declarer' | 'fourth-ace-holder';

export interface Contract {
  id: string;
  rank: number;
  team: number;
  target: { tricks: number; combined?: boolean; exact?: boolean };
  trump: TrumpRule;
  score: ContractScore;
  mandatory?: string;
  onlyIfNoPartner?: boolean;
  multipleDeclarers?: boolean;
  overbiddableFromRank?: number;
  openingLead?: OpeningLead;
  openCardsAfterTrick?: number;
  inTrumpOutranksSameLevel?: boolean;
  fourAcesPartnerRule?: string;
}

export interface Ruleset {
  id: string;
  game: string;
  name: Record<Locale, string>;
  version: string;
  players: number;
  play: {
    direction: string;
    handSize: number;
    dealPattern: number[];
    trumpDetermination: string;
    openingLead: string;
    followSuit: string;
    mustTrump: boolean;
    mustOvertrump: boolean;
  };
  contracts: Contract[];
  session?: { giften: number };
}

export const rulesets: Ruleset[] = [vlaamsStandaard as unknown as Ruleset];

export function getRuleset(id: string): Ruleset | undefined {
  return rulesets.find((r) => r.id === id);
}
