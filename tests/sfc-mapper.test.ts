import { describe, expect, test } from 'vitest';
import {
  EXHIROM,
  HIROM,
  LOROM,
  MAPPERS,
  SA1,
  formatCpu,
  parseCpu,
  parseOffset,
  region,
  type Mapper,
} from '../src/lib/sfc-mapper.ts';

// Copied from kr-patch-toolkit tests/test_rom.py (test_mapper_to_offset, test_mapper_round_trip) so the guide's
// bank map gives the same answers as `krpatch sfc dis --mapper ...`.
const TOOLKIT_CASES: [Mapper, [number, number][]][] = [
  [
    LOROM,
    [
      [0x808000, 0],
      [0x80ffff, 0x7fff],
      [0x818000, 0x8000],
      [0x008000, 0],
      [0xc12345, 0x20a345],
    ],
  ],
  [
    HIROM,
    [
      [0xc00000, 0],
      [0xc12345, 0x12345],
      [0x408000, 0x8000],
      [0x01c000, 0x1c000],
    ],
  ],
  [
    SA1,
    [
      [0xc00000, 0],
      [0xc12345, 0x12345],
      [0x008000, 0],
      [0x018000, 0x8000],
      [0x3f8000, 0x1f8000],
      [0x808000, 0x200000],
      [0xbfffff, 0x3fffff],
      [0xa08000, 0x300000],
      [0x9f8000, 0x2f8000],
    ],
  ],
  [
    EXHIROM,
    [
      [0xc00000, 0],
      [0xffffff, 0x3fffff],
      [0x400000, 0x400000],
      [0x7d1234, 0x7d1234],
      [0x808000, 0x8000],
    ],
  ],
];

describe('toolkit mapper cases', () => {
  for (const [mapper, cases] of TOOLKIT_CASES) {
    test(`${mapper.name} to offset`, () => {
      for (const [addr, off] of cases) expect(mapper.toOffset(addr), formatCpu(addr)).toBe(off);
    });
  }

  for (const mapper of Object.values(MAPPERS)) {
    test(`${mapper.name} round trip`, () => {
      const limit = mapper.name === 'exhirom' ? 0x600000 : 0x200000;
      for (let off = 0; off < limit; off += 0x1357) expect(mapper.toOffset(mapper.toCpu(off))).toBe(off);
    });
  }

  test('header offsets', () => {
    expect([LOROM.header, HIROM.header, EXHIROM.header, SA1.header]).toEqual([0x7fc0, 0xffc0, 0x40ffc0, 0x7fc0]);
  });
});

// Addresses quoted in the patch notes (kr-patches docs/ANALYSIS.ko.md) that the guide reuses.
describe('patch note addresses', () => {
  test.each([
    ['totsugeki dialogue pointer', LOROM, 0xa8800c, 0x14000c],
    ['totsugeki dialogue string', LOROM, 0xa885fe, 0x1405fe],
    ['totsugeki debug skip', LOROM, 0x808061, 0x61],
    ['otogirisou script start', LOROM, 0x15e401, 0xae401],
    ['otogirisou start table', LOROM, 0x02a627, 0x12627],
    ['otogirisou v1.0 script', LOROM, 0x208000, 0x100000],
    ['smrpg name table', SA1, 0xe2b400, 0x22b400],
    ['smrpg battle debug', SA1, 0xc106af, 0x106af],
  ] as const)('%s', (_name, mapper, addr, off) => {
    expect(mapper.toOffset(addr)).toBe(off);
  });

  test('LoROM file offsets come back as FastROM addresses', () => {
    expect(formatCpu(LOROM.toCpu(0x14000c))).toBe('$A8:800C');
    expect(formatCpu(SA1.toCpu(0x22b400))).toBe('$E2:B400');
  });
});

describe('regions', () => {
  test.each([
    ['lorom', 0x808000, 'rom'],
    ['lorom', 0x800a00, 'wram'],
    ['lorom', 0x7e0a00, 'wram'],
    ['lorom', 0x002100, 'io'],
    ['lorom', 0x004200, 'io'],
    ['lorom', 0x700000, 'sram'],
    ['hirom', 0xc00000, 'rom'],
    ['hirom', 0x408000, 'rom'],
    ['hirom', 0x206000, 'sram'],
    ['hirom', 0x001000, 'wram'],
    ['sa1', 0xe2b400, 'rom'],
    ['sa1', 0x003000, 'sa1-ram'],
    ['sa1', 0x007000, 'sa1-ram'],
    ['sa1', 0x403000, 'sa1-ram'],
    ['sa1', 0x002224, 'io'],
    ['exhirom', 0x7d1234, 'rom'],
  ] as const)('%s %s', (mapper, addr, kind) => {
    expect(region(mapper, addr).kind).toBe(kind);
  });
});

describe('parsing', () => {
  test('cpu addresses', () => {
    expect(parseCpu('$80:8000')).toBe(0x808000);
    expect(parseCpu('a8:800c')).toBe(0xa8800c);
    expect(parseCpu('0x808000')).toBe(0x808000);
    expect(parseCpu('$7E:0A00')).toBe(0x7e0a00);
    expect(parseCpu('C0:8')).toBe(0xc00008);
    expect(parseCpu('zz')).toBeNull();
    expect(parseCpu('$100:0000')).toBeNull();
  });

  test('offsets', () => {
    expect(parseOffset('0x14000C')).toBe(0x14000c);
    expect(parseOffset('$7fc0')).toBe(0x7fc0);
    expect(parseOffset('1234567')).toBeNull();
  });
});
