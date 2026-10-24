import { expect, test } from 'vitest';
import {
  checksum,
  checksumParts,
  computeChecksum,
  mirrorOffset,
  roundUpPow2,
  sizeByte,
  sizeOfByte,
} from '../src/lib/sfc-header.ts';
import { MAPPERS } from '../src/lib/sfc-mapper.ts';

const MB = 0x100000;
const KB = 0x400;
const filled = (parts: [number, number][]) => {
  const out = new Uint8Array(parts.reduce((a, [, n]) => a + n, 0));
  let at = 0;
  for (const [v, n] of parts) {
    out.fill(v, at, at + n);
    at += n;
  }
  return out;
};

// Cases from kr-patch-toolkit tests/test_rom.py.
test('odd sizes are summed the way the cartridge mirrors them', () => {
  // 3 MB = 2 MB + 1 MB mirrored once
  expect(
    checksum(
      filled([
        [1, 2 * MB],
        [2, MB],
      ]),
    ),
  ).toBe((2 * MB + 2 * MB * 2) & 0xffff);
  // 1.5 MB = 1 MB + (256 KB + 256 KB mirrored to 512 KB) mirrored to 1 MB
  const rom = filled([
    [1, MB],
    [3, 256 * KB],
    [5, 256 * KB],
  ]);
  expect(checksum(rom)).toBe((MB + (3 * 256 * KB + 5 * 256 * KB) * 2) & 0xffff);
});

test('a power-of-two image is a plain sum with the checksum fields blanked', () => {
  const rom = filled([[0xff, 512 * KB]]);
  rom[0x1234] = 0x5a;
  const blank = Uint8Array.from(rom);
  blank.set([0xff, 0xff, 0, 0], 0x7fdc);
  expect(computeChecksum(rom, MAPPERS.lorom.header)).toBe(blank.reduce((a, b) => a + b, 0) & 0xffff);
});

/** The same pseudo-random bytes as the Python snippet that produced the expected values below. */
const noise = (size: number) => {
  const out = new Uint8Array(size);
  let x = 1;
  for (let i = 0; i < size; i++) {
    x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff;
    out[i] = (x >>> 16) & 0xff;
  }
  return out;
};

// Values printed by kr_patch.sfc.header.checksum and header.compute for those bytes.
test.each([
  [512 * KB, 'lorom', 0xf530, 0xf4ab],
  [1536 * KB, 'lorom', 0x08c0, 0x083b],
  [3 * MB, 'hirom', 0x3c80, 0x3c9a],
  [6 * MB, 'exhirom', 0x0c00, 0x0e34],
] as const)('%d bytes, %s: like the toolkit', (size, mapper, plain, computed) => {
  const rom = noise(size);
  expect(checksum(rom)).toBe(plain);
  expect(computeChecksum(rom, MAPPERS[mapper].header)).toBe(computed);
});

test('checksum parts list what is added and how often', () => {
  expect(checksumParts(2 * MB)).toEqual([{ start: 0, length: 2 * MB, times: 1 }]);
  expect(checksumParts(3 * MB)).toEqual([
    { start: 0, length: 2 * MB, times: 1 },
    { start: 2 * MB, length: MB, times: 2 },
  ]);
  expect(checksumParts(6 * MB)).toEqual([
    { start: 0, length: 4 * MB, times: 1 },
    { start: 4 * MB, length: 2 * MB, times: 2 },
  ]);
  expect(checksumParts(1.25 * MB)).toEqual([
    { start: 0, length: MB, times: 1 },
    { start: MB, length: 256 * KB, times: 4 },
  ]);
  expect(checksumParts(1792 * KB)).toEqual([
    { start: 0, length: MB, times: 1 },
    { start: MB, length: 512 * KB, times: 1 },
    { start: 1536 * KB, length: 256 * KB, times: 2 },
  ]);
});

test('mirrored offsets add up to the same checksum', () => {
  for (const size of [1, 3, 5, 6, 7, 12, 13, 24, 40]) {
    const rom = Array.from({ length: size }, (_, i) => (i * 37 + 11) % 256);
    let sum = 0;
    for (let a = 0; a < roundUpPow2(size); a++) sum += rom[mirrorOffset(a, size)] ?? 0;
    expect(sum & 0xffff).toBe(checksum(rom));
  }
});

test('mirror offsets for a 3 MB and a 1.5 MB image', () => {
  expect([0, 2 * MB, 3 * MB, 3.5 * MB, 4 * MB + 5].map(a => mirrorOffset(a, 3 * MB))).toEqual([
    0,
    2 * MB,
    2 * MB,
    2.5 * MB,
    5,
  ]);
  expect(mirrorOffset(1.5 * MB, 1.5 * MB)).toBe(MB);
  expect(mirrorOffset(1.75 * MB, 1.5 * MB)).toBe(1.25 * MB);
});

test('the size byte rounds up', () => {
  expect([512 * KB, MB, 1.5 * MB, 2 * MB, 3 * MB, 4 * MB, 6 * MB].map(sizeByte)).toEqual([
    0x09, 0x0a, 0x0b, 0x0b, 0x0c, 0x0c, 0x0d,
  ]);
  expect(sizeOfByte(0x0b)).toBe(2 * MB);
});
