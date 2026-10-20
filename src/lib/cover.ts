// Generated "editor window" covers for list cards whose post has no image. Everything is decided at build time
// from the post's slug, so a cover never changes between builds and two neighbouring posts rarely look alike.

/** Syntax-highlight hues for the cover accent; all at least 7:1 on the cover's dark background. */
export const COVER_ACCENTS = ['#3ddc84', '#56c8f5', '#ffb454', '#f78c6c', '#c792ea', '#82aaff'] as const;

/** 32-bit FNV-1a: small, fast and stable across runtimes, which is all a decorative seed needs. */
export function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export interface Cover {
  accent: string;
  /** Widths (percent) of the faint "code lines" drawn under the title. */
  lines: number[];
}

export function coverFor(slug: string): Cover {
  const seed = seedOf(slug);
  const accent = COVER_ACCENTS[seed % COVER_ACCENTS.length] ?? COVER_ACCENTS[0];
  // Three lines between 30% and 85%, taken from different bits of the seed so they vary independently.
  const lines = [0, 8, 16].map(shift => 30 + (((seed >>> shift) & 0xff) % 56));
  return { accent, lines };
}
