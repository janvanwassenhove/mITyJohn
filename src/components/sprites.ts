// Shared pixel-art sprites, drawn as box-shadow "pixels" on a single element.
// Each entry is a box-shadow value; the host element supplies the pixel size.

/** mITy.John himself — 6px grid, 48x60. */
export const MITYJOHN =
  '18px 0 0 #4a3620, 24px 0 0 #4a3620, 30px 0 0 #4a3620, 12px 6px 0 #4a3620, 18px 6px 0 #4a3620, 24px 6px 0 #4a3620, 30px 6px 0 #4a3620, 36px 6px 0 #4a3620, 42px 6px 0 #4a3620, 18px 12px 0 #e8c39a, 24px 12px 0 #e8c39a, 30px 12px 0 #e8c39a, 36px 12px 0 #e8c39a, 18px 18px 0 #e8c39a, 24px 18px 0 #e8c39a, 30px 18px 0 #17140f, 36px 18px 0 #e8c39a, 12px 24px 0 var(--accent), 18px 24px 0 var(--accent-2), 24px 24px 0 var(--accent), 30px 24px 0 var(--accent), 36px 24px 0 var(--accent), 6px 30px 0 #e8c39a, 12px 30px 0 var(--accent), 18px 30px 0 var(--accent), 24px 30px 0 var(--accent-2), 30px 30px 0 var(--accent), 36px 30px 0 var(--accent), 42px 30px 0 var(--accent-2), 12px 36px 0 var(--accent), 18px 36px 0 var(--accent), 24px 36px 0 var(--accent), 30px 36px 0 var(--accent), 36px 36px 0 var(--accent), 42px 36px 0 var(--accent-2), 18px 42px 0 #33302b, 24px 42px 0 #33302b, 30px 42px 0 #33302b, 18px 48px 0 #33302b, 30px 48px 0 #33302b, 12px 54px 0 #33302b, 18px 54px 0 #33302b, 30px 54px 0 #33302b, 36px 54px 0 #33302b';

/** Archeologist mid-stride, frame B — legs crossed under, arms swapped. */
export const ARCHEOLOGIST_B = [
  '6px 0 0 #6b4a2a, 12px 0 0 #6b4a2a, 18px 0 0 #6b4a2a, 24px 0 0 #6b4a2a, 30px 0 0 #6b4a2a, 36px 0 0 #6b4a2a, 42px 0 0 #6b4a2a',
  '12px -6px 0 #7d5732, 18px -6px 0 #7d5732, 24px -6px 0 #7d5732, 30px -6px 0 #7d5732',
  '18px 6px 0 #e8c39a, 24px 6px 0 #e8c39a, 30px 6px 0 #e8c39a, 36px 6px 0 #e8c39a',
  '18px 12px 0 #e8c39a, 24px 12px 0 #e8c39a, 30px 12px 0 #17140f, 36px 12px 0 #e8c39a',
  '12px 18px 0 #8a6b3f, 18px 18px 0 #8a6b3f, 24px 18px 0 #8a6b3f, 30px 18px 0 #8a6b3f, 36px 18px 0 #8a6b3f',
  // arms: leading arm forward high, trailing arm back
  '12px 24px 0 #8a6b3f, 18px 24px 0 #8a6b3f, 24px 24px 0 #6b4a2a, 30px 24px 0 #8a6b3f, 36px 24px 0 #8a6b3f, 42px 18px 0 #e8c39a, 0px 30px 0 #e8c39a',
  '12px 30px 0 #8a6b3f, 18px 30px 0 #8a6b3f, 24px 30px 0 #8a6b3f, 30px 30px 0 #8a6b3f, 36px 30px 0 #8a6b3f',
  // legs: scissored the other way
  '18px 36px 0 #33302b, 24px 36px 0 #33302b, 30px 36px 0 #33302b',
  '12px 42px 0 #33302b, 24px 42px 0 #33302b, 36px 42px 0 #33302b',
  '6px 48px 0 #33302b, 42px 48px 0 #33302b',
].join(', ');

/** Same figure in a fedora — the archeologist of level 7. */
export const ARCHEOLOGIST = [
  // brim + crown
  '6px 0 0 #6b4a2a, 12px 0 0 #6b4a2a, 18px 0 0 #6b4a2a, 24px 0 0 #6b4a2a, 30px 0 0 #6b4a2a, 36px 0 0 #6b4a2a, 42px 0 0 #6b4a2a',
  '12px -6px 0 #7d5732, 18px -6px 0 #7d5732, 24px -6px 0 #7d5732, 30px -6px 0 #7d5732',
  // face
  '18px 6px 0 #e8c39a, 24px 6px 0 #e8c39a, 30px 6px 0 #e8c39a, 36px 6px 0 #e8c39a',
  '18px 12px 0 #e8c39a, 24px 12px 0 #e8c39a, 30px 12px 0 #17140f, 36px 12px 0 #e8c39a',
  // jacket
  '12px 18px 0 #8a6b3f, 18px 18px 0 #8a6b3f, 24px 18px 0 #8a6b3f, 30px 18px 0 #8a6b3f, 36px 18px 0 #8a6b3f',
  '6px 24px 0 #e8c39a, 12px 24px 0 #8a6b3f, 18px 24px 0 #8a6b3f, 24px 24px 0 #6b4a2a, 30px 24px 0 #8a6b3f, 36px 24px 0 #8a6b3f, 42px 24px 0 #e8c39a',
  '12px 30px 0 #8a6b3f, 18px 30px 0 #8a6b3f, 24px 30px 0 #8a6b3f, 30px 30px 0 #8a6b3f, 36px 30px 0 #8a6b3f',
  // legs
  '18px 36px 0 #33302b, 24px 36px 0 #33302b, 30px 36px 0 #33302b',
  '18px 42px 0 #33302b, 30px 42px 0 #33302b',
  '12px 48px 0 #33302b, 18px 48px 0 #33302b, 30px 48px 0 #33302b, 36px 48px 0 #33302b',
].join(', ');
