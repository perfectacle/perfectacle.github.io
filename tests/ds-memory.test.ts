import { expect, test } from 'vitest';
import { MAPS, PROGRAMS, hex8, parseAddress, region, romOffset } from '../src/components/romhacking/ds-memory.ts';

test('the same address can mean different things to each CPU', () => {
  expect(region('arm9', 0)?.name).toBe('ITCM');
  expect(region('arm7', 0)?.name).toBe('ARM7 BIOS');
  expect(region('arm9', 0x03800000)?.name).toBe('공유 WRAM');
  expect(region('arm7', 0x03800000)?.name).toBe('ARM7 WRAM');
  expect(region('arm9', 0xffff0000)?.name).toBe('ARM9 BIOS');
  expect(region('arm7', 0xffff0000)).toBeUndefined();
  expect(region('arm9', 0x01ff8000)?.name).toBe('ITCM');
  expect(region('arm9', 0x027e0000)?.name).toBe('DTCM(고스트 트릭)');
  expect(region('arm9', 0x0b000000)).toBeUndefined();
});

test('main RAM, I/O and VRAM sit where GBATEK puts them', () => {
  expect(region('arm9', 0x02000800)?.name).toBe('메인 RAM');
  expect(region('arm9', 0x023fffff)?.name).toBe('메인 RAM');
  expect(region('arm9', 0x02400000)?.name).toBe('메인 RAM 미러');
  expect(region('arm7', 0x02400000)?.name).toBe('메인 RAM 미러');
  expect(region('arm9', 0x04000208)?.name).toBe('I/O 레지스터');
  expect(region('arm9', 0x06200000)?.name).toBe('VRAM 엔진 B BG');
  expect(region('arm7', 0x04804000)?.name).toBe('무선 통신');
});

test('regions of each map do not overlap', () => {
  for (const map of Object.values(MAPS)) {
    const sorted = [...map].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (prev && cur) expect(prev.start + prev.span).toBeLessThanOrEqual(cur.start);
    }
  }
});

test('RAM addresses inside Ghost Trick’s programs lead back to the ROM file', () => {
  expect(romOffset(PROGRAMS.arm9.entry)).toEqual({ cpu: 'arm9', offset: 0x4800 });
  expect(romOffset(0x02380000)).toEqual({ cpu: 'arm7', offset: 0x96800 });
  expect(romOffset(0x02003fff)).toEqual({ cpu: 'arm9', offset: 0x7fff });
  expect(romOffset(0x02004000)).toBeUndefined();
  expect(romOffset(0x023a642b)).toEqual({ cpu: 'arm7', offset: 0x96800 + 0x2642b });
  expect(romOffset(0x020f1e60)).toBeUndefined();
});

test('addresses parse with or without 0x and print as eight hex digits', () => {
  expect(parseAddress('0x04000208')).toBe(0x04000208);
  expect(parseAddress('ffff0000')).toBe(0xffff0000);
  expect(parseAddress('nope')).toBeNull();
  expect(parseAddress('123456789')).toBeNull();
  expect(hex8(0x2000800)).toBe('0x02000800');
});
