import { crc32, extractFromZip, type RomFingerprint } from './rom-patch.ts';
import { applyVcdiff } from './vcdiff.ts';

/** One Nintendo DS game's Japanese original and its Korean patch result. */
export interface NdsSpec {
  /** The name players know the game by; it appears in the guidance messages. */
  name: string;
  /** Full card dump size (a power of two). */
  size: number;
  /** Header: internal name at 0x00 (12 bytes) and game code at 0x0C; the code's last letter is the region. */
  header: { title: string; code: string };
  /** Size of the patched ROM. */
  patchedSize: number;
  original: RomFingerprint;
  patched: RomFingerprint;
  /** Earlier Korean releases; patching one of them again would break the game. */
  previous?: (RomFingerprint & { version?: string; size: number })[];
}

export const GHOST_TRICK: NdsSpec = {
  name: '고스트 트릭',
  size: 134217728,
  header: { title: 'GHOSTTRICK-J', code: 'BGTJ' },
  patchedSize: 119462534,
  original: { crc32: '105DDD9E', md5: '2E0629DBACEF1E5F55BB254377FC0367' },
  patched: { crc32: 'EA51D7F3', md5: '58A2C288A621337AE7105033472BBF6A' },
  previous: [{ version: 'v1.1', size: 119459746, crc32: 'D366A4D9', md5: '782D23E4E11767691B85B73E6BFD74EE' }],
};

/** Anything smaller cannot hold an NDS header and the start of the file system. */
const MIN_ROM_SIZE = 0x8000;

// Files here are matched by size and CRC32 only. MD5 of a 128 MB card takes seconds in JavaScript, and the xdelta
// patch checks every window it writes (Adler-32), so a source that only collides on CRC32 still fails to patch.
// The MD5 values are published for players who check their files by hand.

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length)).replace(/\0+$/, '');

/** Header title and game code match the Japanese release. */
export const hasGameHeader = (spec: NdsSpec, bytes: Uint8Array) =>
  bytes.length >= 0x200 && ascii(bytes, 0, 12) === spec.header.title && ascii(bytes, 12, 4) === spec.header.code;

/** Header size of the used ROM area; a trimmed dump keeps at least this much. */
const usedSize = (bytes: Uint8Array) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0x80, true);

/**
 * Trimming tools cut the 0xFF filler after the used area. Filling it back gives the full card dump the patch was
 * made from; anything else past the used area means the file is not a plain trimmed dump.
 */
export function untrim(spec: NdsSpec, bytes: Uint8Array): Uint8Array | undefined {
  if (bytes.length === spec.size) return bytes;
  if (bytes.length > spec.size || bytes.length < usedSize(bytes)) return undefined;
  const full = new Uint8Array(spec.size).fill(0xff);
  full.set(bytes);
  return full;
}

export type NdsVerdict =
  | { kind: 'too-small' | 'truncated' | 'wrong-size' | 'wrong-game' | 'other-region' }
  | { kind: 'old-korean'; version?: string | undefined }
  | { kind: 'already-korean' | 'original' | 'different'; bytes: Uint8Array; crc32: string };

/** First matching rule wins; the order mirrors the Super Famicom patches so players hear the same advice. */
export function classifyNdsRom(spec: NdsSpec, source: Uint8Array): NdsVerdict {
  if (source.length < MIN_ROM_SIZE) return { kind: 'too-small' };
  if (source.length === spec.patchedSize) {
    const crc = crc32(source);
    if (crc === spec.patched.crc32) return { kind: 'already-korean', bytes: source, crc32: crc };
  }
  const earlier = spec.previous?.find(release => release.size === source.length);
  if (earlier && crc32(source) === earlier.crc32) return { kind: 'old-korean', version: earlier.version };
  const code = ascii(source, 12, 4);
  if (ascii(source, 0, 12) !== spec.header.title || code.slice(0, 3) !== spec.header.code.slice(0, 3)) {
    return { kind: 'wrong-game' };
  }
  if (code !== spec.header.code) return { kind: 'other-region' };
  if (source.length > spec.size) return { kind: 'wrong-size' };
  const full = untrim(spec, source);
  if (!full) return { kind: 'truncated' };
  const crc = crc32(full);
  return { kind: crc === spec.original.crc32 ? 'original' : 'different', bytes: full, crc32: crc };
}

export class NdsPatchOutputHashError extends Error {
  readonly crc32: string;

  constructor(crc32: string) {
    super('패치 결과의 체크섬이 일치하지 않아 다운로드를 만들지 않았습니다. 다시 시도해 주세요.');
    this.crc32 = crc32;
  }
}

/**
 * Applies the xdelta patch to a full Japanese dump as `classifyNdsRom` returned it, with the CRC32 it computed.
 * Without `allowUnverified` the source and the result must match the published checksums.
 */
export function createPatchedNdsRom(
  spec: NdsSpec,
  source: { bytes: Uint8Array; crc32: string },
  patch: Uint8Array,
  options: { allowUnverified?: boolean } = {},
): Uint8Array {
  const allowUnverified = options.allowUnverified === true;
  const { bytes } = source;
  if (bytes.length !== spec.size) throw new Error(`${spec.name} 일본판 롬파일 크기가 맞지 않습니다.`);
  if (!hasGameHeader(spec, bytes))
    throw new Error(`${spec.name}의 게임 식별 정보와 다릅니다. 이 파일에는 패치를 적용할 수 없습니다.`);
  if (!allowUnverified && source.crc32 !== spec.original.crc32)
    throw new Error('손대지 않은 일본판 롬파일이 아닙니다. 다른 일본판 롬파일을 골라 주세요.');
  const output = applyVcdiff(bytes, patch, spec.patchedSize);
  if (output.length !== spec.patchedSize || !hasGameHeader(spec, output))
    throw new Error('패치 결과의 크기 또는 게임 식별 정보가 올바르지 않아 다운로드를 만들지 않았습니다.');
  const crc = crc32(output);
  if (!allowUnverified && crc !== spec.patched.crc32) throw new NdsPatchOutputHashError(crc);
  return output;
}

const ndsName = /\.nds$/i;

/** The single .nds in a zip, or a file of the full or trimmed size range; see `extractFromZip`. */
export const extractNdsFromZip = (spec: NdsSpec, zip: Uint8Array) =>
  extractFromZip(zip, (name, size) => ndsName.test(name) || size === spec.size);
