import { MAPPERS, hex, type MapperName } from '../../lib/snes-mapper.ts';
import { checksumParts, mirrorOffset, sizeByte, sizeOfByte } from '../../lib/snes-header.ts';

/** What the "롬 크기를 늘리면 바뀌는 것" widget draws. HiROM past 4 MB becomes ExHiROM. */
export type BoardKind = 'lorom' | 'hirom' | 'sa1';

const KB = 0x400;
const MB = 0x100000;

/** One cell of the drawing is this much ROM. */
export const CELL = 512 * KB;

export const BOARD_LABEL: Record<BoardKind, string> = { lorom: 'LoROM', hirom: 'HiROM', sa1: 'SA-1' };

export const SIZES = [512 * KB, MB, 1.5 * MB, 2 * MB, 3 * MB, 4 * MB, 6 * MB, 8 * MB];
export const MAX_SIZE: Record<BoardKind, number> = { lorom: 4 * MB, hirom: 6 * MB, sa1: 8 * MB };
export const MAX_ORIGINAL = 4 * MB;

export const sizeLabel = (n: number) => (n < MB ? `${n / KB}KB` : `${n / MB}MB`);
export const offsetLabel = (n: number) => `0x${hex(n, 6)}`;

export const mapperFor = (board: BoardKind, size: number): MapperName =>
  board === 'hirom' && size > 4 * MB ? 'exhirom' : board;

/** Bytes of ROM the CPU can see at once for this mapper. */
const windowSize = (mapper: MapperName) => (mapper === 'exhirom' ? 8 * MB : 4 * MB);

const bankOf = (mapper: MapperName, a: number) => {
  switch (mapper) {
    case 'lorom':
      return 0x80 + (a >>> 15);
    case 'exhirom':
      return a < 4 * MB ? 0xc0 + (a >>> 16) : 0x40 + ((a - 4 * MB) >>> 16);
    default:
      return 0xc0 + (a >>> 16);
  }
};

export type CellKind = 'data' | 'new' | 'mirror' | 'switch';

export interface Cell {
  /** Position in the CPU's ROM window, or past it for SA-1 blocks that need switching. */
  at: number;
  /** `$80–$8F`: the banks this cell occupies; for `switch`, the 1 MB block number. */
  banks: string;
  kind: CellKind;
  /** File offset shown here. */
  file: number;
  /** Banks $7E-$7F are WRAM, not ROM. */
  wram: boolean;
}

export function cells(board: BoardKind, size: number, original: number): Cell[] {
  const mapper = mapperFor(board, size);
  const out: Cell[] = [];
  const win = windowSize(mapper);
  for (let at = 0; at < win; at += CELL) {
    const first = bankOf(mapper, at);
    const last = bankOf(mapper, at + CELL - 1);
    const wram = mapper === 'exhirom' && last >= 0x7e && last < 0x80;
    const file = mirrorOffset(at, size);
    const kind: CellKind = file !== at ? 'mirror' : file >= original ? 'new' : 'data';
    out.push({ at, banks: `$${hex(first, 2)}–$${hex(wram ? 0x7d : last, 2)}`, kind, file, wram });
  }
  if (mapper === 'sa1')
    for (let at = win; at < size; at += CELL)
      out.push({ at, banks: `블록 ${Math.floor(at / MB)}`, kind: 'switch', file: at, wram: false });
  return out;
}

export const cellLabel = (c: Cell) =>
  (c.kind === 'new'
    ? '새로 붙인 곳'
    : c.kind === 'mirror'
      ? '미러'
      : c.kind === 'switch'
        ? '창을 바꿔야 보임'
        : '원래 롬') + (c.wram ? ' · $7E–$7F는 WRAM' : '');

const partLabel = (p: { start: number; length: number; times: number }) =>
  `${offsetLabel(p.start)}–${offsetLabel(p.start + p.length - 1)} × ${p.times}`;

/** How many times the checksum adds the byte at `offset` of an image of `size` bytes. */
const timesAt = (offset: number, size: number) =>
  checksumParts(size).find(p => offset >= p.start && offset < p.start + p.length)?.times ?? 0;

export interface ExpansionReport {
  mapper: MapperName;
  before: { mapper: MapperName; sizeByte: number; claims: number; parts: string[]; header: number };
  after: { mapper: MapperName; sizeByte: number; claims: number; parts: string[]; header: number };
  /** One sentence on what happens to the checksum. */
  checksum: string;
  notes: string[];
}

export function report(board: BoardKind, original: number, size: number): ExpansionReport {
  const side = (n: number) => {
    const mapper = mapperFor(board, n);
    const b = sizeByte(n);
    return {
      mapper,
      sizeByte: b,
      claims: sizeOfByte(b),
      parts: checksumParts(n).map(partLabel),
      header: MAPPERS[mapper].header,
    };
  };
  const before = side(original);
  const after = side(size);
  const notes: string[] = [];

  let checksum: string;
  if (size === original) {
    checksum = '크기가 그대로라 체크섬을 계산하는 방식도 같습니다.';
  } else if (after.header !== before.header) {
    checksum = `헤더가 파일 ${offsetLabel(after.header)}로 옮겨 가므로 그 자리의 헤더를 새로 쓰고 체크섬을 처음부터 다시 계산합니다.`;
  } else {
    const changed: string[] = [];
    for (let at = 0; at < original; at += CELL) {
      const was = timesAt(at, original);
      const now = timesAt(at, size);
      if (was !== now) changed.push(`${offsetLabel(at)}–${offsetLabel(at + CELL - 1)}(× ${was} → × ${now})`);
    }
    if (changed.length) {
      checksum = `원래 데이터 가운데 ${changed.join(', ')}을 더하는 횟수가 바뀝니다. 그래서 체크섬이 롬 내용에 따라 달라지고, 다시 계산해야 합니다.`;
    } else {
      const sizeAt = after.header + 0x17;
      const delta = (after.sizeByte - before.sizeByte) * timesAt(sizeAt, size);
      checksum =
        delta === 0
          ? '원래 데이터를 더하는 횟수가 그대로입니다. 새 자리를 한 가지 값(00이나 FF)으로만 채우면 체크섬은 바뀌지 않습니다.'
          : `원래 데이터를 더하는 횟수가 그대로입니다. 새 자리를 한 가지 값(00이나 FF)으로만 채우면 체크섬은 크기 바이트가 커진 만큼(+${delta})만 바뀝니다. 새 자리에 데이터를 넣으면 다시 계산합니다.`;
    }
  }

  if (board === 'lorom' && size > 2 * MB)
    notes.push(
      'LoROM에서 WRAM·레지스터와 같은 뱅크($00–$3F, $80–$BF)에 보이는 것은 앞 2MB뿐입니다. 2MB 뒤는 $40–$7D·$C0–$FF에 놓이고, 이 뱅크에서는 32KB 하나가 아래 반($0000–$7FFF)과 위 반($8000–$FFFF)에 두 번 보입니다. 이 영역까지 보이게 배선한 보드여야 합니다.',
    );
  if (after.mapper === 'exhirom')
    notes.push(
      '4MB를 넘으면 ExHiROM이 됩니다. 맵 모드 바이트가 $21(또는 $31)에서 $25(또는 $35)로 바뀌고, 헤더는 파일 0x40FFC0으로 옮겨 갑니다. $00–$3F 뱅크가 뒤쪽 4MB를 가리키므로 리셋 벡터와 처음 실행되는 코드도 그쪽에 있어야 합니다.',
    );
  if (board === 'sa1' && size > 4 * MB)
    notes.push(
      'SA-1이 한 번에 보여 주는 롬은 1MB 창 4개, 곧 4MB입니다. 블록 4 이후는 $2220–$2223에 블록 번호를 써서 창을 바꿔야 보입니다. 이 레지스터는 본체 CPU와 SA-1 양쪽의 창을 함께 바꿉니다.',
    );
  const parts = checksumParts(size);
  const [big, small] = parts;
  if (parts.length === 2 && big && small && after.mapper === 'exhirom')
    notes.push(
      `${sizeLabel(size)}는 ${sizeLabel(big.length)} + ${sizeLabel(small.length)}입니다. 헤더에는 ${sizeLabel(after.claims)}로 올려 적습니다. 실제로 나온 ExHiROM 게임도 5MB·6MB였고, fullsnes는 이런 롬의 체크섬을 "4MB + 남은 1–2MB의 미러"로 계산한다고 적습니다.`,
    );
  else if (parts.length === 2 && big && small)
    notes.push(
      `${sizeLabel(size)}는 2의 거듭제곱이 아니지만 큰 쪽 ${sizeLabel(big.length)} + 작은 쪽 ${sizeLabel(small.length)}로 나뉘는 정해진 배치입니다. 헤더에는 ${sizeLabel(after.claims)}로 올려 적고, 남는 자리에는 작은 쪽이 되풀이해 보입니다. 파일을 ${sizeLabel(after.claims)}까지 채워도 되지만, 그러면 체크섬을 더하는 방식이 바뀝니다.`,
    );
  else if (parts.length > 2)
    notes.push(
      `${sizeLabel(size)}는 큰 2의 거듭제곱 + 작은 2의 거듭제곱으로 나뉘지 않습니다. 에뮬레이터마다 남는 자리를 채우는 방식이 달라서, 뒤쪽 조각을 2의 거듭제곱까지 채워 두는 편이 안전합니다.`,
    );
  return { mapper: after.mapper, before, after, checksum, notes };
}
