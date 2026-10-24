import { expect, test } from 'vitest';
import { cells, mapperFor, report } from '../src/components/romhacking/rom-expansion.ts';
import { computeChecksum } from '../src/lib/sfc-header.ts';
import { MAPPERS } from '../src/lib/sfc-mapper.ts';

const MB = 0x100000;
const kinds = (list: ReturnType<typeof cells>) => list.map(c => c.kind[0]).join('');

test('LoROM 1 MB to 2 MB: the new megabyte replaces a mirror', () => {
  expect(kinds(cells('lorom', MB, MB))).toBe('ddmmmmmm');
  const after = cells('lorom', 2 * MB, MB);
  expect(kinds(after)).toBe('ddnnmmmm');
  expect(after[0]?.banks).toBe('$80–$8F');
  expect(after[4]).toMatchObject({ banks: '$C0–$CF', kind: 'mirror', file: 0 });
});

test('3 MB repeats its last megabyte to fill 4 MB', () => {
  const list = cells('hirom', 3 * MB, 2 * MB);
  expect(kinds(list)).toBe('ddddnnmm');
  expect(list[6]).toMatchObject({ banks: '$F0–$F7', file: 2 * MB });
});

test('HiROM past 4 MB is ExHiROM, with the second half in banks $40-$7D', () => {
  expect(mapperFor('hirom', 6 * MB)).toBe('exhirom');
  const list = cells('hirom', 6 * MB, 4 * MB);
  expect(list).toHaveLength(16);
  expect(list[8]).toMatchObject({ banks: '$40–$47', kind: 'new', file: 4 * MB });
  expect(list[15]).toMatchObject({ banks: '$78–$7D', kind: 'mirror', wram: true });
});

test('SA-1 past 4 MB shows blocks that need switching', () => {
  const list = cells('sa1', 6 * MB, 4 * MB);
  expect(kinds(list)).toBe('ddddddddssss');
  expect(list[0]?.banks).toBe('$C0–$C7');
});

test('report: header byte, checksum parts and notes', () => {
  const r = report('lorom', MB, 2 * MB);
  expect([r.before.sizeByte, r.after.sizeByte]).toEqual([0x0a, 0x0b]);
  expect(r.after.parts).toEqual(['0x000000–0x1FFFFF × 1']);
  expect(r.checksum).toContain('+1');
  expect(report('lorom', 1.5 * MB, 2 * MB).checksum).toContain('0x100000–0x17FFFF(× 2 → × 1)');
  expect(report('lorom', 1.5 * MB, 2 * MB).before.parts).toEqual(['0x000000–0x0FFFFF × 1', '0x100000–0x17FFFF × 2']);
  expect(report('hirom', 4 * MB, 6 * MB).checksum).toContain('0x40FFC0');
  expect(report('sa1', 4 * MB, 8 * MB).notes.join()).toContain('$2220');
  expect(report('lorom', 2 * MB, 3 * MB).notes.join()).toContain('4MB로 올려');
});

const noise = (size: number, seed: number) => {
  const out = new Uint8Array(size);
  let x = seed;
  for (let i = 0; i < size; i++) {
    x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff;
    out[i] = (x >>> 16) & 0xff;
  }
  return out;
};

const expand = (rom: Uint8Array, size: number, fill: number, header: number, sizeByte: number) => {
  const out = new Uint8Array(size).fill(fill);
  out.set(rom);
  out[header + 0x17] = sizeByte;
  return out;
};

test('the predicted checksum change holds on real bytes', () => {
  const header = MAPPERS.lorom.header;
  for (const [from, to] of [
    [MB, 2 * MB],
    [MB, 1.5 * MB],
    [2 * MB, 4 * MB],
  ] as const) {
    const rom = noise(from, from);
    const r = report('lorom', from, to);
    rom[header + 0x17] = r.before.sizeByte;
    const delta = Number(/\+(\d+)/.exec(r.checksum)?.[1]);
    for (const fill of [0x00, 0xff]) {
      const grown = expand(rom, to, fill, header, r.after.sizeByte);
      expect((computeChecksum(grown, header) - computeChecksum(rom, header) + 0x10000) % 0x10000).toBe(delta);
    }
  }
});
