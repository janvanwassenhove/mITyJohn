// Rekenlogica voor de wiezen-automodus van het scorebord: je duidt aan wélk
// contract gespeeld werd, door wie (+ maat), en hoeveel slagen ze haalden —
// de punten komen uit dezelfde scoreGift-engine als het spel zelf.
// DOM-vrij en los testbaar; de UI (main.ts) doet enkel de weergave.

import { scoreGift } from './engine/scoring';
import { getRuleset, type Contract, type Ruleset } from './ruleset';

const RULESET = getRuleset('vlaams-standaard') as Ruleset;

/** Sentinelwaarde voor "niemand ging mee" in de maat-keuze. */
export const ALONE = -1;

export function scorebordContracts(): Contract[] {
  return RULESET.contracts;
}

export function scorebordContract(id: string): Contract {
  return RULESET.contracts.find((c) => c.id === id) ?? (RULESET.contracts[0] as Contract);
}

/** Heeft dit contract een maat nodig (teamcontract)? */
export function needsPartner(contractId: string): boolean {
  return scorebordContract(contractId).team === 2;
}

/** Mag je bij dit contract "alleen" kiezen? Enkel na een vraag: gaat niemand
 *  mee, dan speelt de vrager alleen (REGELS.md §5.2). Troel houdt altijd een
 *  maat (de houder van de vierde aas). */
export function canGoAlone(contractId: string): boolean {
  return contractId === 'vraag-en-mee';
}

export interface WiezenRoundInput {
  contractId: string;
  declarer: number;
  /** Maat, of ALONE wanneer niemand meeging (enkel bij vraag & mee). */
  partner: number;
  tricks: number;
}

export interface WiezenRoundResult {
  /** Puntenmutatie per speler (zero-sum, index 0..3). */
  points: number[];
  /** Het contract waarop uiteindelijk gerekend is — 'alleen' als niemand meeging. */
  contract: Contract;
  /** Spelers die het contract speelden. */
  declarers: number[];
}

export function computeWiezenRound(input: WiezenRoundInput): WiezenRoundResult {
  const alone = input.partner === ALONE || input.partner === input.declarer;
  // Vraag & mee zonder maat = alleen spelen (5 slagen i.p.v. samen 8).
  const contractId = alone && canGoAlone(input.contractId) ? 'alleen' : input.contractId;
  const contract = scorebordContract(contractId);
  const declarers =
    contract.team === 2 && !alone ? [input.declarer, input.partner] : [input.declarer];

  const tricksWon = [0, 0, 0, 0];
  // Teamcontracten sommeren de slagen van hun spelers; we zetten het totaal
  // van de spelende partij op de vrager — dat volstaat voor de scoring.
  tricksWon[input.declarer] = input.tricks;

  const score = scoreGift({ contract, declarers, tricksWon });
  return { points: score.points, contract, declarers };
}
