import { describe, expect, it } from 'vitest';
import { GUIDE_CHAPTERS, chapterForGame, getChapter, guideKeys, nextChapter } from './guide';
import { LOCALES, messages } from './i18n';

describe('regelgids', () => {
  it('heeft hoofdstukken met unieke ids en minstens drie stappen', () => {
    const ids = GUIDE_CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const chapter of GUIDE_CHAPTERS) {
      expect(chapter.steps.length).toBeGreaterThanOrEqual(3);
      expect(new Set(chapter.steps).size).toBe(chapter.steps.length);
    }
  });

  it('heeft in elke taal een tekst voor elke stap', () => {
    for (const locale of LOCALES) {
      const bundle = messages[locale] as Record<string, string | undefined>;
      for (const key of guideKeys()) {
        expect(bundle[key], `${locale} mist ${key}`).toBeTruthy();
      }
    }
  });

  it('verwijst elk speltype naar het juiste hoofdstuk', () => {
    expect(chapterForGame('wiezen', 'vlaams-standaard')).toBe('gewoon-wiezen');
    expect(chapterForGame('wiezen', 'vlaams-cafe')).toBe('gewoon-wiezen');
    expect(chapterForGame('wiezen', 'kleurenwiezen')).toBe('kleurenwiezen');
    expect(chapterForGame('manille', 'x')).toBe('manillen');
    expect(chapterForGame('bieden', 'x')).toBe('bieden');
    for (const id of GUIDE_CHAPTERS.map((c) => c.id)) {
      expect(getChapter(id)).toBeDefined();
    }
  });

  it('leest van hoofdstuk naar hoofdstuk en stopt aan het einde', () => {
    const first = GUIDE_CHAPTERS[0]?.id as string;
    const last = GUIDE_CHAPTERS[GUIDE_CHAPTERS.length - 1]?.id as string;
    expect(nextChapter(first)?.id).toBe(GUIDE_CHAPTERS[1]?.id);
    expect(nextChapter(last)).toBeNull();
  });
});
