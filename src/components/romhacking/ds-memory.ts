/**
 * The Nintendo DS memory maps of the two CPUs, after GBATEK's "DS Memory Maps", and where Ghost Trick (J)'s two
 * programs sit in main RAM according to its card header.
 */

export type Cpu = 'arm9' | 'arm7';

export interface Region {
  start: number;
  /** Bytes the region decodes, including mirrors. */
  span: number;
  name: string;
  text: string;
}

const MB = 0x100000;
const KB = 0x400;

export const MAPS: Record<Cpu, Region[]> = {
  arm9: [
    {
      start: 0x00000000,
      span: 32 * MB,
      name: 'ITCM',
      text: 'ARM9 안의 빠른 코드용 메모리 32KB. 펌웨어 설정으로 0x01FFFFFF까지 되풀이해 보임',
    },
    { start: 0x02000000, span: 4 * MB, name: '메인 RAM', text: '두 CPU가 함께 쓰는 4MB' },
    { start: 0x02400000, span: 0x3e0000, name: '메인 RAM 미러', text: '메인 RAM 4MB가 되풀이해 보이는 자리' },
    {
      start: 0x027e0000,
      span: 16 * KB,
      name: 'DTCM(고스트 트릭)',
      text: 'ARM9 안의 빠른 데이터용 메모리 16KB. 고스트 트릭이 이 자리로 옮겨 씀',
    },
    { start: 0x027e4000, span: 0x81c000, name: '메인 RAM 미러', text: '메인 RAM 4MB가 되풀이해 보이는 자리' },
    { start: 0x03000000, span: 16 * MB, name: '공유 WRAM', text: '32KB 가운데 ARM9에 나눠 준 만큼(0·16·32KB)' },
    {
      start: 0x04000000,
      span: 16 * MB,
      name: 'I/O 레지스터',
      text: '화면·DMA·타이머·인터럽트 같은 장치를 다루는 자리',
    },
    { start: 0x05000000, span: 16 * MB, name: '팔레트', text: '2D 엔진 A·B의 BG·OBJ 팔레트 2KB' },
    {
      start: 0x06000000,
      span: 2 * MB,
      name: 'VRAM 엔진 A BG',
      text: '엔진 A가 그리는 화면(위·아래 중 하나)의 배경 그림',
    },
    { start: 0x06200000, span: 2 * MB, name: 'VRAM 엔진 B BG', text: '엔진 B 화면의 배경 그림' },
    { start: 0x06400000, span: 2 * MB, name: 'VRAM 엔진 A OBJ', text: '엔진 A의 스프라이트 그림' },
    { start: 0x06600000, span: 2 * MB, name: 'VRAM 엔진 B OBJ', text: '엔진 B의 스프라이트 그림' },
    { start: 0x06800000, span: 8 * MB, name: 'VRAM LCDC', text: 'CPU가 VRAM 뱅크를 직접 읽고 쓰는 자리' },
    { start: 0x07000000, span: 16 * MB, name: 'OAM', text: '스프라이트 속성 2KB' },
    { start: 0x08000000, span: 32 * MB, name: 'GBA 슬롯 롬', text: '아래 슬롯의 게임보이 어드밴스 카트리지' },
    { start: 0x0a000000, span: 16 * MB, name: 'GBA 슬롯 RAM', text: '아래 슬롯 카트리지의 RAM' },
    { start: 0xffff0000, span: 32 * KB, name: 'ARM9 BIOS', text: 'ARM9 BIOS. 예외 벡터가 여기 있습니다' },
  ],
  arm7: [
    { start: 0x00000000, span: 16 * KB, name: 'ARM7 BIOS', text: 'ARM7 BIOS. 예외 벡터가 여기 있습니다' },
    { start: 0x02000000, span: 4 * MB, name: '메인 RAM', text: '두 CPU가 함께 쓰는 4MB' },
    { start: 0x02400000, span: 12 * MB, name: '메인 RAM 미러', text: '메인 RAM 4MB가 되풀이해 보이는 자리' },
    { start: 0x03000000, span: 8 * MB, name: '공유 WRAM', text: '32KB 가운데 ARM7에 나눠 준 만큼' },
    { start: 0x03800000, span: 8 * MB, name: 'ARM7 WRAM', text: 'ARM7만 쓰는 64KB' },
    { start: 0x04000000, span: 8 * MB, name: 'I/O 레지스터', text: '소리·터치·무선 같은 장치를 다루는 자리' },
    { start: 0x04800000, span: 8 * MB, name: '무선 통신', text: '무선 랜 칩의 RAM과 레지스터' },
    {
      start: 0x06000000,
      span: 16 * MB,
      name: 'VRAM(ARM7 작업용)',
      text: 'ARM7 작업 메모리로 나눠 준 VRAM(최대 256KB)',
    },
    { start: 0x08000000, span: 32 * MB, name: 'GBA 슬롯 롬', text: '아래 슬롯의 게임보이 어드밴스 카트리지' },
    { start: 0x0a000000, span: 16 * MB, name: 'GBA 슬롯 RAM', text: '아래 슬롯 카트리지의 RAM' },
  ],
};

export const CPU_LABEL: Record<Cpu, string> = { arm9: 'ARM9', arm7: 'ARM7' };

export const region = (cpu: Cpu, addr: number) =>
  MAPS[cpu].find(r => addr >>> 0 >= r.start && addr >>> 0 < r.start + r.span);

/**
 * Ghost Trick (J)'s programs as the card header places them. `plain` is how much of the program the ROM holds byte for
 * byte: the ARM9 program is BLZ-compressed from ROM offset 0x4000 on and unpacks itself to 0x020D2118 at boot.
 */
export const PROGRAMS: Record<Cpu, { rom: number; ram: number; size: number; plain: number; entry: number }> = {
  arm9: { rom: 0x4000, ram: 0x02000000, size: 0x80628, plain: 0x4000, entry: 0x02000800 },
  arm7: { rom: 0x96800, ram: 0x02380000, size: 0x2642c, plain: 0x2642c, entry: 0x02380000 },
};

/** The ROM offset of a RAM address the ROM holds byte for byte in one of the programs, if it is one. */
export function romOffset(addr: number) {
  for (const cpu of ['arm9', 'arm7'] as const) {
    const p = PROGRAMS[cpu];
    if (addr >= p.ram && addr < p.ram + p.plain) return { cpu, offset: p.rom + (addr - p.ram) };
  }
  return undefined;
}

export const hex8 = (n: number) => `0x${(n >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;

export function parseAddress(text: string): number | null {
  const t = text.trim().replace(/^0x/i, '').replace(/^\$/, '').replace(/_/g, '');
  if (!/^[0-9a-f]{1,8}$/i.test(t)) return null;
  return parseInt(t, 16) >>> 0;
}
