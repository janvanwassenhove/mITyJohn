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

/** Vraagt dit contract of de troel-aas uitkwam? (REGELS.md §5.4) */
export function asksAceLed(contractId: string): boolean {
  return scorebordContract(contractId).leadCard === 'fourth-ace';
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
  /** Troel: kwam de uitkomer zijn vierde aas uit? Zo niet, dan schuift het doel
   *  één slag op (REGELS.md §5.4). Default true. */
  aceLed?: boolean;
}

export interface WiezenRoundResult {
  /** Puntenmutatie per speler (zero-sum, index 0..3). */
  points: number[];
  /** Het contract waarop uiteindelijk gerekend is — 'alleen' als niemand meeging,
   *  en met een opgeschoven doel wanneer de troel-aas niet uitkwam. */
  contract: Contract;
  /** Spelers die het contract speelden. */
  declarers: number[];
  /** Aantal slagen dat is ingegeven — hoort in het rondelabel, anders valt een
   *  rij achteraf niet meer na te rekenen. */
  tricks: number;
}

export function computeWiezenRound(input: WiezenRoundInput): WiezenRoundResult {
  const alone = input.partner === ALONE || input.partner === input.declarer;
  // Vraag & mee zonder maat = alleen spelen (5 slagen i.p.v. samen 8).
  const contractId = alone && canGoAlone(input.contractId) ? 'alleen' : input.contractId;
  const base = scorebordContract(contractId);
  // Troel zonder aas als uitkomst: één slag méér (REGELS.md §5.4).
  const penalty =
    base.leadCard === 'fourth-ace' && input.aceLed === false
      ? (base.targetPenaltyOtherLead ?? 0)
      : 0;
  const contract: Contract = penalty
    ? { ...base, target: { ...base.target, tricks: base.target.tricks + penalty } }
    : base;
  const declarers =
    contract.team === 2 && !alone ? [input.declarer, input.partner] : [input.declarer];

  const tricksWon = [0, 0, 0, 0];
  // Teamcontracten sommeren de slagen van hun spelers; we zetten het totaal
  // van de spelende partij op de vrager — dat volstaat voor de scoring.
  tricksWon[input.declarer] = input.tricks;

  const score = scoreGift({ contract, declarers, tricksWon });
  return { points: score.points, contract, declarers, tricks: input.tricks };
}
