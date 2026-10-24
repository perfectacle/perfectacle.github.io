/**
 * The file system of a Nintendo DS card ROM: the card header fields that locate it, the file name table (FNT) and the
 * file allocation table (FAT). The same layout kr-patch-toolkit's `kr_patch.nds.rom` reads.
 */

export const HEADER_SIZE = 0x200;
export const ROOT_DIR = 0xf000;

export type Span = [offset: number, size: number];

export interface NdsHeader {
  title: string;
  code: string;
  /** ROM size is 0x20000 << capacity. */
  capacity: number;
  arm9: Span;
  arm7: Span;
  fnt: Span;
  fat: Span;
  ovt9: Span;
  banner: number;
  used: number;
}

/** A directory's sub-table: file names in file id order, and sub-directories with their directory id. */
export interface FntDir {
  first: number;
  items: (string | [name: string, dir: number])[];
}

const at = (b: Uint8Array, o: number) => b[o] ?? 0;
const u16 = (b: Uint8Array, o: number) => at(b, o) | (at(b, o + 1) << 8);
const u32 = (b: Uint8Array, o: number) => (u16(b, o) | (u16(b, o + 2) << 16)) >>> 0;
const ascii = (b: Uint8Array) => String.fromCharCode(...b).replace(/\0+$/, '');
const span = (b: Uint8Array, o: number): Span => [u32(b, o), u32(b, o + 4)];

export const hex = (n: number, width = 0) => n.toString(16).toUpperCase().padStart(width, '0');
export const hexBytes = (b: Uint8Array) => [...b].map(x => hex(x, 2)).join(' ');

export function parseHeader(b: Uint8Array): NdsHeader {
  if (b.length < HEADER_SIZE) throw new Error('NDS 헤더(0x200바이트)보다 짧습니다.');
  return {
    title: ascii(b.subarray(0, 12)),
    code: ascii(b.subarray(12, 16)),
    capacity: at(b, 0x14),
    arm9: [u32(b, 0x20), u32(b, 0x2c)],
    arm7: [u32(b, 0x30), u32(b, 0x3c)],
    fnt: span(b, 0x40),
    fat: span(b, 0x48),
    ovt9: span(b, 0x50),
    banner: u32(b, 0x68),
    used: u32(b, 0x80),
  };
}

const sjis = new TextDecoder('shift_jis');

export function parseFnt(fnt: Uint8Array): FntDir[] {
  if (fnt.length < 8) throw new Error('FNT가 비어 있습니다.');
  const count = u16(fnt, 6);
  if (count * 8 > fnt.length) throw new Error('FNT의 폴더 수가 표 크기를 넘습니다.');
  return Array.from({ length: count }, (_, i) => {
    let p = u32(fnt, i * 8);
    const items: FntDir['items'] = [];
    for (;;) {
      if (p >= fnt.length) throw new Error('FNT 이름 목록이 끝나지 않습니다.');
      const t = at(fnt, p);
      if (t === 0) break;
      const name = sjis.decode(fnt.subarray(p + 1, p + 1 + (t & 0x7f)));
      p += 1 + (t & 0x7f);
      if (t & 0x80) {
        items.push([name, u16(fnt, p)]);
        p += 2;
      } else items.push(name);
    }
    return { first: u16(fnt, i * 8 + 4), items };
  });
}

/** FNT bytes for `dirs` laid out like the DS SDK does: the main table, then each sub-table in directory order. */
export function encodeFnt(dirs: FntDir[]): Uint8Array {
  const enc = new TextEncoder();
  const subs = dirs.map(d => {
    const parts: number[] = [];
    for (const item of d.items) {
      const [name, dir] = typeof item === 'string' ? [item, undefined] : item;
      const bytes = enc.encode(name);
      parts.push(bytes.length | (dir === undefined ? 0 : 0x80), ...bytes);
      if (dir !== undefined) parts.push(dir & 0xff, dir >> 8);
    }
    parts.push(0);
    return parts;
  });
  const parent = new Map<number, number>();
  dirs.forEach((d, i) => {
    for (const item of d.items) if (typeof item !== 'string') parent.set(item[1], ROOT_DIR | i);
  });
  const out = new Uint8Array(dirs.length * 8 + subs.reduce((n, s) => n + s.length, 0));
  const view = new DataView(out.buffer);
  let p = dirs.length * 8;
  for (const [i, sub] of subs.entries()) {
    view.setUint32(i * 8, p, true);
    view.setUint16(i * 8 + 4, dirs[i]?.first ?? 0, true);
    view.setUint16(i * 8 + 6, i === 0 ? dirs.length : (parent.get(ROOT_DIR | i) ?? ROOT_DIR), true);
    out.set(sub, p);
    p += sub.length;
  }
  return out;
}

export const parseFat = (fat: Uint8Array): Span[] =>
  Array.from({ length: fat.length >> 3 }, (_, i) => [u32(fat, i * 8), u32(fat, i * 8 + 4)]);

export function encodeFat(entries: Span[]): Uint8Array {
  const out = new Uint8Array(entries.length * 8);
  const view = new DataView(out.buffer);
  entries.forEach(([s, e], i) => {
    view.setUint32(i * 8, s, true);
    view.setUint32(i * 8 + 4, e, true);
  });
  return out;
}

export interface FileEntry {
  id: number;
  path: string;
}

/** Every named file, in file id order. */
export function listFiles(dirs: FntDir[]): FileEntry[] {
  const out: FileEntry[] = [];
  const walk = (dir: number, prefix: string, depth: number) => {
    const d = dirs[dir & 0xfff];
    if (!d || depth > 64) throw new Error('FNT 폴더 번호가 표 밖을 가리킵니다.');
    let id = d.first;
    for (const item of d.items) {
      if (typeof item === 'string') out.push({ id: id++, path: prefix + item });
      else walk(item[1], `${prefix}${item[0]}/`, depth + 1);
    }
  };
  walk(ROOT_DIR, '', 0);
  return out.sort((a, b) => a.id - b.id);
}

/** One directory on the way to the file: its main-table entry and the sub-table entry that matched. */
export interface DirStep {
  dir: number;
  /** Folder name, '' for the root. */
  name: string;
  mainAt: number;
  main: Uint8Array;
  subAt: number;
  first: number;
  /** File names and directories passed before the match. */
  skippedFiles: number;
  skippedDirs: number;
  matchAt: number;
  match: Uint8Array;
  /** The matched sub-directory's id, when the match is a directory. */
  next?: number;
}

export interface Walk {
  dirs: DirStep[];
  id: number;
  fatAt: number;
  fatEntry: Uint8Array;
  start: number;
  end: number;
}

/** Follow `path` through the FNT to a file id, then the FAT to its bytes; every offset is from the table's start. */
export function walk(fnt: Uint8Array, fat: Uint8Array, path: string): Walk {
  const parts = path.split('/');
  const dirs: DirStep[] = [];
  let dir = ROOT_DIR;
  let dirName = '';
  for (const [k, want] of parts.entries()) {
    const last = k === parts.length - 1;
    const mainAt = (dir & 0xfff) * 8;
    if (mainAt + 8 > fnt.length) throw new Error('FNT 폴더 번호가 표 밖을 가리킵니다.');
    const subAt = u32(fnt, mainAt);
    const first = u16(fnt, mainAt + 4);
    let p = subAt;
    let id = first;
    let skippedFiles = 0;
    let skippedDirs = 0;
    for (;;) {
      if (p >= fnt.length || fnt[p] === 0) throw new Error(`${path}: 이 롬에 없는 이름입니다.`);
      const t = at(fnt, p);
      const isDir = (t & 0x80) !== 0;
      const size = 1 + (t & 0x7f) + (isDir ? 2 : 0);
      const name = sjis.decode(fnt.subarray(p + 1, p + 1 + (t & 0x7f)));
      if (name === want && isDir !== last) {
        dirs.push({
          dir,
          name: dirName,
          mainAt,
          main: fnt.slice(mainAt, mainAt + 8),
          subAt,
          first,
          skippedFiles,
          skippedDirs,
          matchAt: p,
          match: fnt.slice(p, p + size),
          ...(isDir ? { next: u16(fnt, p + 1 + (t & 0x7f)) } : {}),
        });
        if (isDir) {
          dir = u16(fnt, p + 1 + (t & 0x7f));
          dirName = name;
        }
        break;
      }
      if (isDir) skippedDirs++;
      else {
        skippedFiles++;
        id++;
      }
      p += size;
    }
    if (last) {
      const fatAt = id * 8;
      if (fatAt + 8 > fat.length) throw new Error('파일 번호가 FAT 밖을 가리킵니다.');
      return {
        dirs,
        id,
        fatAt,
        fatEntry: fat.slice(fatAt, fatAt + 8),
        start: u32(fat, fatAt),
        end: u32(fat, fatAt + 4),
      };
    }
  }
  throw new Error('빈 경로입니다.');
}
