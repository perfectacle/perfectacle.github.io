/**
 * SNES planar tiles ↔ pixel colour indices, ported from kr-patch-toolkit (`kr_patch/snes/tiles.py`) so the guide's
 * tile widget shows the bytes `krpatch snes tiles` reads. Keep the layout identical to the toolkit:
 * `tests/snes-tiles.test.ts` runs the toolkit's own cases.
 *
 * 1bpp tiles are one byte per row. 2/4/8bpp tiles store bitplanes in pairs: each pair is `rows` words (low plane,
 * high plane per row), and the pairs follow each other.
 */

export type Bpp = 1 | 2 | 4 | 8;

export const tileSize = (bpp: Bpp, rows = 8) => rows * bpp;

/** Byte offset (from the tile start) holding row `y` of plane `p`. */
export const planeByte = (bpp: Bpp, p: number, y: number, rows = 8) =>
  bpp === 1 ? y : Math.floor(p / 2) * rows * 2 + y * 2 + (p & 1);

/** `rows` × 8 colour indices; bit 7 of each byte is the left-most pixel and plane 0 is the low bit. */
export function decode(data: ArrayLike<number>, off: number, bpp: Bpp, rows = 8): number[][] {
  const out: number[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: number[] = [];
    for (let x = 0; x < 8; x++) {
      const b = 7 - x;
      let v = 0;
      for (let p = 0; p < bpp; p++) v |= (((data[off + planeByte(bpp, p, y, rows)] ?? 0) >> b) & 1) << p;
      row.push(v);
    }
    out.push(row);
  }
  return out;
}

/** Inverse of `decode` for a rows × 8 pixel list. */
export function encode(pixels: readonly (readonly number[])[], bpp: Bpp): number[] {
  const rows = pixels.length;
  const out = new Array<number>(tileSize(bpp, rows)).fill(0);
  pixels.forEach((row, y) =>
    row.forEach((v, x) => {
      for (let p = 0; p < bpp; p++) {
        const i = planeByte(bpp, p, y, rows);
        if ((v >> p) & 1) out[i] = (out[i] ?? 0) | (1 << (7 - x));
      }
    }),
  );
  return out;
}

/** Bits of one plane as rows × 8 zeros and ones. */
export const planeBits = (data: ArrayLike<number>, bpp: Bpp, p: number, rows = 8) =>
  Array.from({ length: rows }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => ((data[planeByte(bpp, p, y, rows)] ?? 0) >> (7 - x)) & 1),
  );

/** Reads hex bytes separated by spaces or commas (`3C 42`, `$3C,$42`, `0x3c`). Returns null on anything else. */
export function parseBytes(text: string): number[] | null {
  const parts = text
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length === 0) return null;
  const out: number[] = [];
  for (const part of parts) {
    const t = part.replace(/^(\$|0x)/i, '');
    if (!/^[0-9a-f]{1,2}$/i.test(t)) return null;
    out.push(parseInt(t, 16));
  }
  return out;
}

/**
 * A Hangul 「가」 in one 8×8 tile with the shadow rule of the Super Gokuden Totsugeki font: letter pixels are colour 1
 * (plane 0 only), and the cells right of, below and right-below a letter pixel that are not letter pixels are colour 3
 * (both planes).
 */
export const SAMPLE_GLYPH = [
  '........',
  '###..#..',
  '..#..#..',
  '..#..##.',
  '..#..#..',
  '.#...#..',
  '#....#..',
  '........',
];

export function shadowed(rows: readonly string[]): number[][] {
  const on = (x: number, y: number) => rows[y]?.[x] === '#';
  return rows.map((row, y) =>
    [...row].map((_, x) => (on(x, y) ? 1 : on(x - 1, y) || on(x, y - 1) || on(x - 1, y - 1) ? 3 : 0)),
  );
}

/**
 * Colours the guide shows colour numbers in. The first four follow the font examples (0 paper, 1 letter, 3 shadow); a
 * 4bpp tile adds twelve greys from light to dark. Returns the colour and whether text on it should be light.
 */
const PREVIEW_COLORS = ['#ffffff', '#16191d', '#3f6fd8', '#9aa2aa'];
export function previewColor(v: number): { color: string; dark: boolean } {
  if (v < PREVIEW_COLORS.length) return { color: PREVIEW_COLORS[v] ?? '#ffffff', dark: v === 1 || v === 2 };
  const level = Math.round(232 - ((v - 4) * 200) / 11);
  return { color: `rgb(${level} ${level} ${level})`, dark: level < 140 };
}
