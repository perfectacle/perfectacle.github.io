import data from './ghost-trick-glyphs.json';

/**
 * Ghost Trick's dialogue font (fonts2bpp_new.imb): 16×24 glyphs, 2 bits per pixel, a row in 4 bytes. Which 2-bit
 * field of a byte belongs to which of its four pixels is the question the widget answers by drawing.
 * `ghost-trick-glyphs.json` holds four glyphs of the Korean patch v1.2 font (고스트릭) as read from the ROM.
 */

export const W = 16;
export const H = 24;
export const SIZE = 96;
/** Bit position of pixels 0–3 of each byte in the game. */
export const GAME_ORDER = [4, 6, 0, 2] as const;

export interface Glyph {
  char: string;
  id: number;
  at: number;
  bytes: Uint8Array;
}

const fromHex = (s: string) => Uint8Array.from(s.match(/../g) ?? [], b => parseInt(b, 16));
export const GLYPHS: Glyph[] = data.glyphs.map(g => ({ char: g.char, id: g.id, at: g.at, bytes: fromHex(g.bytes) }));

export const decode = (bytes: Uint8Array, order: readonly number[]) =>
  Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => ((bytes[y * 4 + (x >> 2)] ?? 0) >> (order[x & 3] ?? 0)) & 3),
  );

/** Sum of the differences between side-by-side pixels: thick strokes make the right order the smallest. */
export const roughness = (glyphs: Glyph[], order: readonly number[]) =>
  glyphs.reduce((sum, g) => {
    const px = decode(g.bytes, order);
    let s = 0;
    for (const row of px) for (let x = 0; x < W - 1; x++) s += Math.abs((row[x] ?? 0) - (row[x + 1] ?? 0));
    return sum + s;
  }, 0);

export function permutations(items: readonly number[]): number[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((v, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(p => [v, ...p]));
}

/** All 24 orders, smoothest first. */
export const ranked = () =>
  permutations([0, 2, 4, 6])
    .map(order => ({ order, score: roughness(GLYPHS, order) }))
    .sort((a, b) => a.score - b.score);

export const orderLabel = (order: readonly number[]) => order.join(', ');
