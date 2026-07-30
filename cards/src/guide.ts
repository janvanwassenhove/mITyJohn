// Regelgids — de "hoe zit dit spel in elkaar"-hulp. Waar de starterswizard
// (coach.ts) je in vijf schermen op weg zet, gidst de gids je hoofdstuk per
// hoofdstuk door álle regels, per speltype.
//
// DOM-vrij en data-gedreven: dit bestand bepaalt enkel de structuur; de teksten
// staan in i18n als `guide.<hoofdstuk>.<stap>.title` en `.body`.

/** Welke speltypes de gids behandelt; `basis` en `scorebord` gelden voor alles. */
export type GuideChapterId =
  | 'basis'
  | 'gewoon-wiezen'
  | 'kleurenwiezen'
  | 'manillen'
  | 'bieden'
  | 'klaverjassen'
  | 'scorebord';

export interface GuideChapter {
  id: GuideChapterId;
  /** Toonicoon in de inhoudsopgave. */
  icon: string;
  /** Stapsleutels, in leesvolgorde. */
  steps: string[];
}

export const GUIDE_CHAPTERS: GuideChapter[] = [
  { id: 'basis', icon: '\u{1F3B4}', steps: ['tafel', 'kaarten', 'slag', 'troef'] },
  {
    id: 'gewoon-wiezen',
    icon: '♠',
    steps: ['troef', 'bieden', 'vraag', 'alleen', 'troel', 'hoog', 'punten'],
  },
  { id: 'kleurenwiezen', icon: '\u{1F308}', steps: ['verschil', 'vragen', 'meegaan'] },
  { id: 'manillen', icon: '♥', steps: ['ploegen', 'rangorde', 'troefplicht', 'punten'] },
  { id: 'bieden', icon: '♣', steps: ['ploegen', 'waarden', 'veiling', 'punten'] },
  {
    id: 'klaverjassen',
    icon: '♦',
    steps: ['ploegen', 'waarden', 'troef', 'troefplicht', 'roem', 'punten'],
  },
  { id: 'scorebord', icon: '\u{1F4D2}', steps: ['waarvoor', 'manueel', 'auto'] },
];

export function getChapter(id: string): GuideChapter | undefined {
  return GUIDE_CHAPTERS.find((c) => c.id === id);
}

/** Het hoofdstuk dat bij het gekozen spel + ruleset hoort, voor de "lees verder"-knop. */
export function chapterForGame(
  game: 'wiezen' | 'manille' | 'bieden' | 'klaverjassen',
  rulesetId: string,
): GuideChapterId {
  if (game === 'manille') return 'manillen';
  if (game === 'bieden') return 'bieden';
  if (game === 'klaverjassen') return 'klaverjassen';
  return rulesetId === 'kleurenwiezen' ? 'kleurenwiezen' : 'gewoon-wiezen';
}

/** Volgend hoofdstuk in leesvolgorde, of null aan het einde. */
export function nextChapter(id: string): GuideChapter | null {
  const i = GUIDE_CHAPTERS.findIndex((c) => c.id === id);
  return i >= 0 ? (GUIDE_CHAPTERS[i + 1] ?? null) : null;
}

/** Alle i18n-sleutels die de gids nodig heeft — de i18n-test controleert ze. */
export function guideKeys(): string[] {
  const keys: string[] = [];
  for (const chapter of GUIDE_CHAPTERS) {
    keys.push(`guide.${chapter.id}.title`, `guide.${chapter.id}.summary`);
    for (const step of chapter.steps) {
      keys.push(`guide.${chapter.id}.${step}.title`, `guide.${chapter.id}.${step}.body`);
    }
  }
  return keys;
}
