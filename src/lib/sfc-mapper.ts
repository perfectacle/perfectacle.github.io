/**
 * SFC CPU address ↔ headerless ROM file offset, ported from kr-patch-toolkit (`kr_patch/sfc/mapper.py`) so the
 * guide's bank map shows the numbers the toolkit commands use. Keep the formulas identical to the toolkit:
 * `tests/sfc-mapper.test.ts` runs the toolkit's own cases.
 *
 * `toOffset` is permissive like the toolkit: it masks the address the way the board decodes it and does not reject
 * addresses that land on RAM or I/O. `region` says what the console actually puts at an address.
 */

export type MapperName = 'lorom' | 'hirom' | 'exhirom' | 'sa1';

export interface Mapper {
  name: MapperName;
  /** Internal header ($00:FFC0) as a file offset. */
  header: number;
  toOffset(addr: number): number;
  toCpu(offset: number): number;
  /** Largest file size whose every offset has a CPU address. */
  maxSize: number;
}

const LOROM_BANK_BASE = 0x80;

export const LOROM: Mapper = {
  name: 'lorom',
  header: 0x7fc0,
  maxSize: 0x400000,
  toOffset: addr => (((addr >>> 16) & 0x7f) << 15) | (addr & 0x7fff),
  toCpu: off => ((LOROM_BANK_BASE | (off >>> 15)) << 16) | 0x8000 | (off & 0x7fff),
};

export const HIROM: Mapper = {
  name: 'hirom',
  header: 0xffc0,
  maxSize: 0x400000,
  toOffset: addr => (((addr >>> 16) & 0x3f) << 16) | (addr & 0xffff),
  toCpu: off => 0xc00000 | (off & 0x3fffff),
};

export const EXHIROM: Mapper = {
  name: 'exhirom',
  header: 0x40ffc0,
  // $40-$7D carry the second half; $7E-$7F are WRAM.
  maxSize: 0x7e0000,
  toOffset: addr => {
    const bank = addr >>> 16;
    const base = bank & 0x80 ? 0 : 0x400000;
    return base | ((bank & 0x3f) << 16) | (addr & 0xffff);
  },
  toCpu: off => (off < 0x400000 ? 0xc00000 | off : 0x400000 | (off - 0x400000)),
};

/** SA-1 Super MMC with the power-on blocks 0, 1, 2, 3 in $2220-$2223. */
export const SA1: Mapper = {
  name: 'sa1',
  header: 0x7fc0,
  maxSize: 0x400000,
  toOffset: addr => {
    const bank = addr >>> 16;
    const lo = addr & 0xffff;
    if (bank >= 0xc0) return ((bank & 0x3f) << 16) | lo;
    const block = ((bank >>> 6) & 2) | ((bank >>> 5) & 1);
    return (block << 20) | ((bank & 0x1f) << 15) | (lo & 0x7fff);
  },
  toCpu: off => 0xc00000 | (off & 0x3fffff),
};

export const MAPPERS: Record<MapperName, Mapper> = { lorom: LOROM, hirom: HIROM, exhirom: EXHIROM, sa1: SA1 };

export type RegionKind = 'rom' | 'wram' | 'io' | 'sram' | 'sa1-ram' | 'open';

/** Which part of the console sits at an address; `area` is finer-grained than `kind`. */
export type RegionArea =
  | 'rom'
  | 'wram'
  | 'wram-mirror'
  | 'ppu'
  | 'joypad'
  | 'cpu-io'
  | 'unused'
  | 'sram'
  | 'board'
  | 'bwram'
  | 'bwram-bitmap'
  | 'sa1-io'
  | 'iram'
  | 'bwram-window';

export interface Region {
  kind: RegionKind;
  area: RegionArea;
}

const system = (lo: number): Region => {
  if (lo < 0x2000) return { kind: 'wram', area: 'wram-mirror' };
  if (lo >= 0x2100 && lo < 0x2200) return { kind: 'io', area: 'ppu' };
  if (lo >= 0x4000 && lo < 0x4200) return { kind: 'io', area: 'joypad' };
  if (lo >= 0x4200 && lo < 0x6000) return { kind: 'io', area: 'cpu-io' };
  return { kind: 'open', area: 'unused' };
};

/**
 * What the console's main CPU (S-CPU) sees at a 24-bit address for this kind of cartridge. On SA-1 boards the
 * SA-1 itself has a different map; `bwram-bitmap` marks banks $60-$6F, which only the SA-1 can see.
 */
export function region(mapper: MapperName, addr: number): Region {
  const bank = addr >>> 16;
  const lo = addr & 0xffff;
  if (bank === 0x7e || bank === 0x7f) return { kind: 'wram', area: 'wram' };
  const systemBank = bank < 0x40 || (bank >= 0x80 && bank < 0xc0);
  switch (mapper) {
    case 'lorom':
      if (lo >= 0x8000) return { kind: 'rom', area: 'rom' };
      if (systemBank) return system(lo);
      if ((bank >= 0x70 && bank < 0x7e) || bank >= 0xf0) return { kind: 'sram', area: 'sram' };
      return { kind: 'open', area: 'board' };
    case 'hirom':
    case 'exhirom':
      if (!systemBank || lo >= 0x8000) return { kind: 'rom', area: 'rom' };
      if (lo >= 0x6000 && ((bank >= 0x20 && bank < 0x40) || bank >= 0xa0)) return { kind: 'sram', area: 'sram' };
      return system(lo);
    case 'sa1':
      if (bank >= 0xc0 || (systemBank && lo >= 0x8000)) return { kind: 'rom', area: 'rom' };
      if (bank >= 0x40 && bank < 0x44) return { kind: 'sa1-ram', area: 'bwram' };
      if (bank >= 0x60 && bank < 0x70) return { kind: 'open', area: 'bwram-bitmap' };
      if (systemBank && lo >= 0x2200 && lo < 0x2400) return { kind: 'io', area: 'sa1-io' };
      if (systemBank && lo >= 0x3000 && lo < 0x3800) return { kind: 'sa1-ram', area: 'iram' };
      if (systemBank && lo >= 0x6000) return { kind: 'sa1-ram', area: 'bwram-window' };
      if (systemBank) return system(lo);
      return { kind: 'open', area: 'unused' };
  }
}

export const hex = (n: number, digits: number) => n.toString(16).toUpperCase().padStart(digits, '0');

/** `$BB:AAAA`, the way the guide and the patch notes write CPU addresses. */
export const formatCpu = (addr: number) => `$${hex(addr >>> 16, 2)}:${hex(addr & 0xffff, 4)}`;

/**
 * Reads `$80:8000`, `80:8000`, `$808000`, `808000` or `0x808000` as a 24-bit CPU address.
 * Returns null for anything else.
 */
export function parseCpu(text: string): number | null {
  const t = text.trim().replace(/^\$|^0x/i, '');
  const split = /^([0-9a-f]{1,2}):([0-9a-f]{1,4})$/i.exec(t);
  if (split) return (parseInt(split[1] ?? '', 16) << 16) | parseInt(split[2] ?? '', 16);
  if (/^[0-9a-f]{1,6}$/i.test(t)) return parseInt(t, 16);
  return null;
}

/** Reads a file offset written in hex (`0x14000C`, `14000C`, `$14000C`). */
export function parseOffset(text: string): number | null {
  const t = text.trim().replace(/^\$|^0x/i, '');
  return /^[0-9a-f]{1,6}$/i.test(t) ? parseInt(t, 16) : null;
}
