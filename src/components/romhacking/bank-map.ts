import { MAPPERS, hex, region, type MapperName, type RegionArea } from '../../lib/sfc-mapper.ts';

export const MAPPER_LABEL: Record<MapperName, string> = {
  lorom: 'LoROM',
  hirom: 'HiROM',
  exhirom: 'ExHiROM',
  sa1: 'SA-1',
};

const AREA_LABEL: Record<RegionArea, string> = {
  rom: '롬',
  wram: 'WRAM(작업 메모리 128KB)',
  'wram-mirror': 'WRAM 앞 8KB가 비쳐 보이는 자리',
  ppu: 'PPU·APU 레지스터',
  joypad: '옛 방식 컨트롤러 레지스터',
  'cpu-io': 'CPU 레지스터(DMA·인터럽트 등)',
  unused: '쓰지 않는 자리',
  sram: '세이브 RAM(SRAM) 자리',
  board: '보드마다 다른 자리(롬이 한 번 더 보일 때가 많음)',
  bwram: 'BW-RAM(SA-1 카트리지 RAM)',
  'bwram-bitmap': '본체 CPU에서는 비어 있음(SA-1만 BW-RAM 비트맵으로 봄)',
  'sa1-io': 'SA-1 레지스터',
  iram: 'I-RAM(SA-1 칩 안 RAM 2KB)',
  'bwram-window': 'BW-RAM 8KB 창',
};

export const regionLabel = (mapper: MapperName, addr: number) => {
  const r = region(mapper, addr);
  const label = AREA_LABEL[r.area];
  return r.area === 'wram-mirror' ? `${label}($7E:${hex(addr & 0xffff, 4)})` : label;
};

/**
 * The toolkit formula for `addr`, written out step by step. The last step's value is always
 * `MAPPERS[mapper].toOffset(addr)`.
 */
export function explain(mapper: MapperName, addr: number): { steps: string[]; offset: number } {
  const bank = addr >>> 16;
  const lo = addr & 0xffff;
  const b = `$${hex(bank, 2)}`;
  const offset = MAPPERS[mapper].toOffset(addr);
  const result = `파일 오프셋 0x${hex(offset, 6)}`;
  switch (mapper) {
    case 'lorom': {
      const n = bank & 0x7f;
      return {
        offset,
        steps: [
          `뱅크 ${b}에서 맨 위 비트를 뗍니다: ${b} & $7F = $${hex(n, 2)}`,
          `뱅크 하나는 롬 32KB($8000바이트)입니다: $${hex(n, 2)} × $8000 = $${hex(n << 15, 6)}`,
          `주소 $${hex(lo, 4)}에서 위쪽 반 표시($8000)를 뗍니다: $${hex(lo, 4)} & $7FFF = $${hex(lo & 0x7fff, 4)}`,
          `둘을 더하면 ${result}`,
        ],
      };
    }
    case 'hirom': {
      const n = bank & 0x3f;
      return {
        offset,
        steps: [
          `뱅크 ${b}에서 아래 6비트만 남깁니다: ${b} & $3F = $${hex(n, 2)}`,
          `뱅크 하나는 롬 64KB($10000바이트)입니다: $${hex(n, 2)} × $10000 = $${hex(n << 16, 6)}`,
          `주소 $${hex(lo, 4)}는 그대로 더합니다`,
          `둘을 더하면 ${result}`,
        ],
      };
    }
    case 'exhirom': {
      const n = bank & 0x3f;
      const base = bank & 0x80 ? 0 : 0x400000;
      return {
        offset,
        steps: [
          bank & 0x80
            ? `뱅크 ${b}는 $80 이상이라 롬 앞쪽 4MB입니다(시작 0)`
            : `뱅크 ${b}는 $80 미만이라 롬 뒤쪽 4MB입니다(시작 $400000)`,
          `뱅크 아래 6비트 $${hex(n, 2)} × $10000 = $${hex(n << 16, 6)}`,
          `주소 $${hex(lo, 4)}는 그대로 더합니다`,
          `$${hex(base, 6)} + $${hex(n << 16, 6)} + $${hex(lo, 4)} = ${result}`,
        ],
      };
    }
    case 'sa1': {
      if (bank >= 0xc0) {
        const n = bank & 0x3f;
        return {
          offset,
          steps: [
            `뱅크 ${b}는 $C0 이상이라 HiROM처럼 64KB씩 봅니다`,
            `${b} & $3F = $${hex(n, 2)}, × $10000 = $${hex(n << 16, 6)}`,
            `주소 $${hex(lo, 4)}를 그대로 더합니다`,
            `둘을 더하면 ${result}`,
          ],
        };
      }
      const block = ((bank >>> 6) & 2) | ((bank >>> 5) & 1);
      const area = ['$00-$1F', '$20-$3F', '$80-$9F', '$A0-$BF'][block];
      return {
        offset,
        steps: [
          `뱅크 ${b}는 ${area} 구역이라 1MB 블록 ${block}을 봅니다(전원을 켰을 때 값): ${block} × $100000 = $${hex(block << 20, 6)}`,
          `구역 안에서 몇 번째 뱅크인지: ${b} & $1F = $${hex(bank & 0x1f, 2)}, × $8000 = $${hex((bank & 0x1f) << 15, 6)}`,
          `주소 $${hex(lo, 4)} & $7FFF = $${hex(lo & 0x7fff, 4)}`,
          `셋을 더하면 ${result}`,
        ],
      };
    }
  }
}

/** One cell per bank in the 16 × 16 bank map: what its lower and upper halves hold. */
export type BankShape = 'full' | 'upper' | 'ram' | 'wram' | 'none';

export function bankShape(mapper: MapperName, bank: number): BankShape {
  const low = region(mapper, bank << 16);
  const high = region(mapper, (bank << 16) | 0x8000);
  if (low.area === 'wram') return 'wram';
  if (low.kind === 'rom' && high.kind === 'rom') return 'full';
  if (high.kind === 'rom') return 'upper';
  if (high.kind === 'sa1-ram') return 'ram';
  return 'none';
}
