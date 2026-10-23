import { describe, expect, test } from 'vitest';
import { LzssError, compress, decompress, trace } from '../src/lib/lzss.ts';

const bytes = (s: string) => [...new TextEncoder().encode(s)];
const latin = (s: string) => [...s].map(c => c.charCodeAt(0));
const hex = (list: number[]) => list.map(b => b.toString(16).padStart(2, '0')).join(' ');
const repeat = (list: number[], n: number) => Array.from({ length: n }, () => list).flat();

// Cases from kr-patch-toolkit tests/test_codec.py.
describe('toolkit cases', () => {
  test.each([
    ['empty', []],
    ['one byte', latin('A')],
    ['zeros', new Array<number>(100).fill(0)],
    ['repeats', repeat(latin('ABCABCABCABCABCABC'), 10)],
    ['all byte values', repeat([...Array(256).keys()], 3)],
    ['zeros and text', latin('\0\0\0hello\0\0\0hello world')],
  ])('round trip: %s', (_, data) => {
    const enc = compress(data);
    const dec = decompress(enc);
    expect(dec.data).toEqual(data);
    expect(dec.length).toBe(enc.length);
  });

  test('round trip of seeded random data', () => {
    let seed = 1234;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    for (let k = 0; k < 30; k++) {
      const data = Array.from(
        { length: 1 + Math.floor(rnd() * 1999) },
        () => [0, 1, 2, 0xff][Math.floor(rnd() * 4)] ?? 0,
      );
      expect(decompress(compress(data)).data).toEqual(data);
    }
  });

  test('decompress at an offset', () => {
    const enc = compress(latin('tile data tile data'));
    const blob = [...new Array<number>(7).fill(0xee), ...enc, 0xee, 0xee, 0xee];
    expect(decompress(blob, 7)).toEqual({ data: latin('tile data tile data'), length: enc.length });
  });

  test('known stream: two literals, then a copy of distance 2 and length 4', () => {
    const w = (2 << 4) | (4 - 3);
    expect(decompress([6, 0, 0b011, 0x61, 0x62, w & 0xff, w >> 8]).data).toEqual(latin('ababab'));
  });

  test('a stream that ends early or copies from distance 0 is an error', () => {
    expect(() => decompress([5])).toThrow(/truncated/);
    expect(() => decompress([5, 0, 0])).toThrow(LzssError);
    expect(() => decompress([3, 0, 0, 0x00, 0x00])).toThrow(/distance 0 at offset 0x3/);
  });
});

// Bytes printed by kr_patch.lzss.compress for the same inputs.
test.each([
  ['', '00 00'],
  ['A', '01 00 01 41'],
  ['\0\0\0hello\0\0\0hello world', '16 00 be 10 00 68 65 6c 6c 6f 85 00 20 1f 77 6f 72 6c 64'],
  ['tile data tile data', '13 00 ff 74 69 6c 65 20 64 61 74 03 61 20 a6 00'],
  ['BANANA BANANA', '0d 00 17 42 41 4e 20 00 20 73 00'],
  ['ABRACADABRA ABRACADABRA', '17 00 7f 41 42 52 41 43 41 44 71 00 01 20 c8 00'],
  ['ha ha ha ha ha!', '0f 00 17 68 61 20 38 00 21'],
  ['\0\0\0\0\0\0\0\0AAAAAAAAAAB', '13 00 0a 15 00 41 16 00 42'],
])('compress(%j) matches the toolkit', (text, want) => {
  expect(hex(compress(latin(text)))).toBe(want);
});

test('compress matches the toolkit on longer inputs', () => {
  expect(hex(compress(new Array<number>(100).fill(0)))).toBe('64 00 00 1f 00 1f 00 1f 00 1f 00 1f 00 17 00');
  expect(hex(compress(repeat(latin('ABCABCABCABCABCABC'), 10)))).toBe(
    'b4 00 07 41 42 43 3f 00 3f 00 3f 00 3f 00 3f 00 00 3f 00 3f 00 3f 00 3f 00 3c 00',
  );
  expect(compress(repeat([...Array(256).keys()], 3))).toHaveLength(352);
});

test('trace reports each item with its flag bit, distance and source', () => {
  const { steps, data } = trace(compress(latin('ha ha ha ha ha!')));
  expect(steps.map(s => s.kind)).toEqual(['size', 'flags', 'literal', 'literal', 'literal', 'copy', 'literal']);
  expect(steps[1]).toEqual({ kind: 'flags', at: 2, value: 0x17 });
  expect(steps[5]).toEqual({
    kind: 'copy',
    at: 6,
    bit: 3,
    outAt: 3,
    word: 0x38,
    dist: 3,
    len: 11,
    src: 0,
    bytes: latin('ha ha ha ha'),
  });
  expect(data).toEqual(latin('ha ha ha ha ha!'));
});

test('copies before the start read zeros and may overlap their own output', () => {
  const { steps } = trace([0x13, 0x00, 0x0a, 0x15, 0x00, 0x41, 0x16, 0x00, 0x42]);
  const copy = steps[2];
  expect(copy).toMatchObject({ kind: 'copy', dist: 1, len: 8, src: -1, bytes: new Array<number>(8).fill(0) });
});

// The first 14 bytes of the Totsugeki-hen title tiles ($B7:9EB1), read with `krpatch lzss decode`.
test('an excerpt of a longer stream stops cleanly when partial', () => {
  const excerpt = [0x60, 0x13, 0xdc, 0x2f, 0x01, 0xf0, 0x00, 0x01, 0x0f, 0x3f, 0x89, 0x00, 0x1f, 0xff];
  expect(() => trace(excerpt)).toThrow(/truncated/);
  const t = trace(excerpt, 0, true);
  expect(t.truncated).toBe(true);
  expect(t.length).toBe(14);
  expect(t.steps[0]).toEqual({ kind: 'size', at: 0, size: 0x1360 });
  expect(t.steps.filter(s => s.kind === 'copy').map(s => [s.dist, s.len])).toEqual([
    [18, 18],
    [15, 3],
    [8, 12],
  ]);
  expect(hex(t.data)).toBe(
    hex([...new Array<number>(21).fill(0), 0x01, 0x0f, 0x3f, 0, 0, 0, 0, 0, 0x01, 0x0f, 0x3f, 0, 0, 0, 0, 0x1f, 0xff]),
  );
  expect(() => trace([3, 0, 0, 0, 0], 0, true)).toThrow(/distance 0/);
});

test('UTF-8 text compresses as bytes', () => {
  const data = bytes('가나가나가나');
  expect(decompress(compress(data)).data).toEqual(data);
});
