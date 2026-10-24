import {
  ROOT_DIR,
  encodeFat,
  encodeFnt,
  hex,
  hexBytes,
  listFiles,
  parseFnt,
  walk,
  type FntDir,
  type NdsHeader,
  type Span,
} from '../../lib/nds-fs.ts';
import sample from './ghost-trick-fs.json';

/** What the widget needs from a ROM: the header fields and the two tables' bytes. */
export interface WalkRom {
  header: Pick<NdsHeader, 'title' | 'code' | 'fnt' | 'fat'>;
  fnt: Uint8Array;
  fat: Uint8Array;
}

export interface WalkStep {
  where: string;
  at: number;
  bytes: string;
  text: string;
}

/**
 * Ghost Trick (J)'s tables, kept as names and positions in `ghost-trick-fs.json` (read from the ROM with
 * kr-patch-toolkit). Encoding them back gives the ROM's FNT and FAT byte for byte.
 */
export const SAMPLE: WalkRom = {
  header: { title: sample.title, code: sample.code, fnt: sample.fnt as Span, fat: sample.fat as Span },
  fnt: encodeFnt(sample.dirs as FntDir[]),
  fat: encodeFat(sample.entries as Span[]),
};
export const SAMPLE_PATH = 'st01/st01_demo101_Expand.xml.lz';

const at = (n: number) => `0x${hex(n, 8)}`;
const dirLabel = (dir: number, name: string) => (dir === ROOT_DIR ? 'F000(맨 위 폴더)' : `${hex(dir, 4)}(${name})`);

export function walkSteps(rom: WalkRom, path: string): WalkStep[] {
  const { fnt: fntSpan, fat: fatSpan } = rom.header;
  const w = walk(rom.fnt, rom.fat, path);
  const head = encodeFat([fntSpan, fatSpan]);
  const steps: WalkStep[] = [
    {
      where: '카드 헤더의 FNT·FAT 칸',
      at: 0x40,
      bytes: hexBytes(head),
      text: `FNT는 ${at(fntSpan[0])}부터 0x${hex(fntSpan[1])}바이트, FAT는 ${at(fatSpan[0])}부터 0x${hex(fatSpan[1])}바이트(파일 ${fatSpan[1] / 8}개)입니다.`,
    },
  ];
  const parts = path.split('/');
  for (const [k, d] of w.dirs.entries()) {
    const target = parts[k] ?? '';
    // Every number in these texts ends its clause, so no Korean particle has to agree with how a digit is read.
    const sixth = (d.main[6] ?? 0) | ((d.main[7] ?? 0) << 8);
    const last = d.dir === ROOT_DIR ? `맨 위 폴더를 포함한 폴더 수 ${sixth}` : `부모 폴더 번호 ${hex(sixth, 4)}`;
    steps.push({
      where: `FNT 주 표 · 폴더 ${dirLabel(d.dir, d.name)}`,
      at: fntSpan[0] + d.mainAt,
      bytes: hexBytes(d.main),
      text: `앞 4바이트는 이름 목록 위치 FNT+0x${hex(d.subAt, 4)}, 다음 2바이트는 이 폴더의 첫 파일 번호 ${d.first}, 마지막 2바이트는 ${last}입니다.`,
    });
    const passed = [
      d.skippedFiles && `파일 이름 ${d.skippedFiles}개`,
      d.skippedDirs && `폴더 이름 ${d.skippedDirs}개`,
    ].filter(Boolean);
    const find = passed.length
      ? `앞의 ${passed.join(', ')}를 지나 「${target}」 칸을 찾습니다.`
      : `목록 맨 앞에서 「${target}」 칸을 찾습니다.`;
    const head = d.match[0] ?? 0;
    const len = head & 0x7f;
    steps.push({
      where: `FNT 이름 목록 · ${target}`,
      at: fntSpan[0] + d.matchAt,
      bytes: hexBytes(d.match),
      text:
        d.next !== undefined
          ? `${find} 첫 바이트 0x${hex(head, 2)} = 폴더 표시 0x80 + 이름 길이 ${len}. 이름 뒤 2바이트는 폴더 번호 ${hex(d.next, 4)}입니다.`
          : `${find} 첫 바이트 0x${hex(head, 2)} = 이름 길이 ${len}. ${
              d.skippedFiles
                ? `이 폴더의 첫 파일 번호 ${d.first} + 앞의 파일 ${d.skippedFiles}개 = ${w.id}번 파일입니다.`
                : `이 폴더의 첫 파일이라 ${w.id}번 파일입니다.`
            }`,
    });
  }
  steps.push({
    where: `FAT ${w.id}번 칸`,
    at: fatSpan[0] + w.fatAt,
    bytes: hexBytes(w.fatEntry),
    text: `FAT 시작 ${at(fatSpan[0])} + ${w.id} × 8 자리입니다. 앞 4바이트는 시작 위치 ${at(w.start)}, 뒤 4바이트는 끝 위치 ${at(w.end)}. 그래서 파일 크기는 ${(w.end - w.start).toLocaleString('ko-KR')}바이트입니다.`,
  });
  return steps;
}

/** Named files grouped by folder, for the file picker. */
export function fileGroups(rom: WalkRom) {
  const groups = new Map<string, string[]>();
  for (const { path } of listFiles(parseFnt(rom.fnt))) {
    const cut = path.lastIndexOf('/');
    const folder = cut < 0 ? '' : path.slice(0, cut);
    groups.set(folder, [...(groups.get(folder) ?? []), path]);
  }
  return [...groups].map(([folder, paths]) => ({ folder, paths }));
}
