import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { crc32 } from '../src/lib/rom-patch.ts';
import { adler32, applyVcdiff, VcdiffError } from '../src/lib/vcdiff.ts';

const varint = (n: number) => {
  const out = [n & 0x7f];
  for (n = Math.floor(n / 128); n; n = Math.floor(n / 128)) out.unshift(0x80 | (n & 0x7f));
  return out;
};

const MAGIC = [0xd6, 0xc3, 0xc4, 0x00];

/** One window, as in kr-patch-toolkit tests/test_vcdiff.py. */
function window(target: number[], sourceLength: number, data: number[], inst: number[], addr: number[], adler = true) {
  const indicator = (sourceLength ? 1 : 0) | (adler ? 4 : 0);
  const head = [indicator, ...(sourceLength ? [...varint(sourceLength), ...varint(0)] : [])];
  const sum = adler32(Uint8Array.from(target));
  const body = [
    ...varint(target.length),
    0,
    ...varint(data.length),
    ...varint(inst.length),
    ...varint(addr.length),
    ...(adler ? [sum >>> 24, (sum >>> 16) & 255, (sum >>> 8) & 255, sum & 255] : []),
    ...data,
    ...inst,
    ...addr,
  ];
  return [...head, ...varint(body.length), ...body];
}

const bytes = (s: string) => Array.from(s, c => c.charCodeAt(0));
const patch = (...parts: number[][]) => Uint8Array.from([...MAGIC, 0, ...parts.flat()]);

/** The generator that made tests/fixtures/vcdiff/patch.xdelta with xdelta3 (-9 -S none, no app header). */
function lcg(seed: number) {
  let x = seed;
  return () => {
    x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff;
    return (x >>> 16) & 255;
  };
}

function fixtureFiles() {
  const next = lcg(2026);
  const source = Uint8Array.from({ length: 65536 }, next);
  const target = Array.from(source);
  for (let i = 0; i < 40; i++) {
    const at = ((next() << 8) | next()) % (target.length - 256);
    const n = next() + 1;
    target.splice(at, n, ...Array.from({ length: n }, next));
  }
  target.push(...target.slice(0, 3000));
  return { source, target: Uint8Array.from(target) };
}

describe('applyVcdiff', () => {
  test('RFC example varint', () => {
    expect(varint(123456789)).toEqual([0xba, 0xef, 0x9a, 0x15]);
  });

  test('copy from the source, add, run, copy again', () => {
    const source = bytes('0123456789abcdef');
    const target = bytes('0123456789XYZ!!!!!cdef');
    const p = patch(window(target, source.length, bytes('XYZ!'), [19, 10, 1, 3, 0, 5, 19, 4], [0, 12]));
    expect(Array.from(applyVcdiff(Uint8Array.from(source), p))).toEqual(target);
  });

  test('overlapping copy from the target repeats the pattern', () => {
    const target = bytes('abc'.repeat(1000));
    const p = patch(window(target, 0, bytes('abc'), [4, 19, ...varint(2997)], [0]));
    expect(Array.from(applyVcdiff(new Uint8Array(), p))).toEqual(target);
  });

  test('application header is skipped', () => {
    const target = bytes('hello');
    const p = Uint8Array.from([...MAGIC, 4, 3, ...bytes('x/y'), ...window(target, 0, target, [1, 5], [])]);
    expect(Array.from(applyVcdiff(new Uint8Array(), p))).toEqual(target);
  });

  test('a different source fails the checksum', () => {
    const source = bytes('abcdefgh');
    const target = bytes('abcdefgh!');
    const p = patch(window(target, source.length, bytes('!'), [19, 8, 2], [0]));
    expect(Array.from(applyVcdiff(Uint8Array.from(source), p))).toEqual(target);
    expect(() => applyVcdiff(Uint8Array.from(bytes('ABCDEFGH')), p)).toThrow('원본이 아닙니다');
  });

  test.each([
    ['not VCDIFF', Uint8Array.from(bytes('PATCH'))],
    ['secondary compression', Uint8Array.from([...MAGIC, 1, 0])],
    ['custom code table', Uint8Array.from([...MAGIC, 2, 0])],
    ['bad window indicator', patch([3, ...window(bytes('x'), 0, bytes('x'), [2], []).slice(1)])],
    ['left-over data', patch(window(bytes('x'), 0, bytes('xy'), [2], []))],
    ['writes past the window', patch(window(bytes('x'), 0, bytes('xy'), [3], []))],
    ['truncated', patch(window(bytes('hello'), 0, bytes('hello'), [1, 5], [])).subarray(0, 12)],
  ])('%s is an error', (_, p) => {
    expect(() => applyVcdiff(new Uint8Array(), p)).toThrow(VcdiffError);
  });

  test('a patch made by xdelta3', () => {
    const { source, target } = fixtureFiles();
    const p = new Uint8Array(readFileSync(new URL('./fixtures/vcdiff/patch.xdelta', import.meta.url)));
    const out = applyVcdiff(source, p);
    expect(out.length).toBe(68536);
    expect(crc32(out)).toBe('FD5C3488');
    expect(out).toEqual(target);
  });
});

describe('adler32', () => {
  test('known value', () => {
    expect(adler32(Uint8Array.from(bytes('Wikipedia')))).toBe(0x11e60398);
  });

  test('long input stays exact past the modulo block', () => {
    // zlib.adler32(b"\xff" * 100000)
    expect(adler32(new Uint8Array(100000).fill(255))).toBe(0x149a302c);
  });
});
