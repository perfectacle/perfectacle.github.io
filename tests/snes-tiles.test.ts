import { describe, expect, test } from 'vitest';
import {
  SAMPLE_GLYPH,
  decode,
  encode,
  parseBytes,
  planeBits,
  planeByte,
  previewColor,
  shadowed,
  tileSize,
  type Bpp,
} from '../src/lib/snes-tiles.ts';

// Cases copied from kr-patch-toolkit tests/test_gfx.py so the tile widget reads bytes the way `krpatch snes tiles`
// does.

/** A diagonal with every colour index of the depth (the toolkit's `_pattern`). */
const pattern = (bpp: Bpp, rows = 8) => {
  const top = (1 << bpp) - 1;
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => (x >= y ? (x + y) % (top + 1) : 0)),
  );
};

describe('toolkit cases', () => {
  test.each([
    [1, 8],
    [2, 8],
    [4, 8],
    [8, 8],
    [2, 12],
    [2, 16],
  ] as [Bpp, number][])('encode/decode round trip at %dbpp, %d rows', (bpp, rows) => {
    const pix = pattern(bpp, rows);
    const data = encode(pix, bpp);
    expect(data).toHaveLength(tileSize(bpp, rows));
    expect(decode(data, 0, bpp, rows)).toEqual(pix);
  });

  test('2bpp layout', () => {
    // row 0: low plane 0x80, high plane 0x80 -> pixel 0 = 3; row 1: high plane only -> 2
    const pix = decode([0x80, 0x80, 0x00, 0x40, ...new Array<number>(12).fill(0)], 0, 2);
    expect(pix[0]?.[0]).toBe(3);
    expect(pix[1]?.[1]).toBe(2);
    expect(pix[0]?.[1]).toBe(0);
  });

  test('4bpp planes 3 and 4 follow after 16 bytes', () => {
    const data = new Array<number>(32).fill(0);
    data[16] = 0x80;
    data[17] = 0x80;
    expect(decode(data, 0, 4)[0]?.[0]).toBe(0b1100);
  });
});

// Bytes printed by kr_patch.snes.tiles.encode for the guide's sample glyph.
test('the sample glyph encodes like the toolkit', () => {
  const pix = shadowed(SAMPLE_GLYPH);
  expect(pix.map(r => r.join(''))).toEqual([
    '00000000',
    '11130130',
    '33130130',
    '00130113',
    '00130133',
    '01330130',
    '13300130',
    '33000330',
  ]);
  const hex = (bytes: number[]) => bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  expect(hex(encode(pix, 2))).toBe('00 00 F6 12 F6 D2 37 11 37 13 76 32 E6 62 C6 C6');
  expect(
    hex(
      encode(
        pix.map(r => r.map(v => Math.min(v, 1))),
        1,
      ),
    ),
  ).toBe('00 F6 F6 37 37 76 E6 C6');
});

test('decode reads at an offset', () => {
  const tile = encode(pattern(2), 2);
  expect(decode([0xaa, 0xbb, ...tile], 2, 2)).toEqual(pattern(2));
});

test('plane bytes and bits', () => {
  expect([0, 1].map(p => planeByte(2, p, 3))).toEqual([6, 7]);
  expect([0, 1, 2, 3].map(p => planeByte(4, p, 0))).toEqual([0, 1, 16, 17]);
  expect(planeByte(1, 0, 5)).toBe(5);
  const data = encode(shadowed(SAMPLE_GLYPH), 2);
  expect(planeBits(data, 2, 0)[1]).toEqual([1, 1, 1, 1, 0, 1, 1, 0]);
  expect(planeBits(data, 2, 1)[1]).toEqual([0, 0, 0, 1, 0, 0, 1, 0]);
});

test('parseBytes', () => {
  expect(parseBytes('3C 42, $81 0xff')).toEqual([0x3c, 0x42, 0x81, 0xff]);
  expect(parseBytes('  ')).toBeNull();
  expect(parseBytes('3C 4G')).toBeNull();
  expect(parseBytes('123')).toBeNull();
});

test('preview colours: paper, letter, shadow, then greys for 4bpp', () => {
  expect(previewColor(0)).toEqual({ color: '#ffffff', dark: false });
  expect(previewColor(1).dark).toBe(true);
  expect(previewColor(4).color).toBe('rgb(232 232 232)');
  expect(previewColor(15)).toEqual({ color: 'rgb(32 32 32)', dark: true });
});
