export interface RomFingerprint {
  crc32: string;
  md5: string;
}

/** One game's Japanese original and its Korean patch result, both without a copier header. */
export interface RomSpec {
  /** The name players know the game by; it appears in the guidance messages. */
  name: string;
  size: number;
  /** Cartridge header at $7FC0: internal name (one char per byte), then the map mode, cartridge type and ROM size bytes. */
  header: { title: string; mapMode: number; cartType: number; romSize: number };
  /** Internal name the patch writes, when it renames the cartridge. */
  patchedTitle?: string;
  /** ROM size after patching, when the patch expands the cartridge. */
  patchedSize?: number;
  original: RomFingerprint;
  patched: RomFingerprint;
  /** Earlier Korean releases; patching one of them again would break the game. */
  previous?: (RomFingerprint & { version?: string })[];
}

export const SMRPG: RomSpec = {
  name: '슈퍼 마리오 RPG',
  size: 4194304,
  header: { title: 'SUPER MARIO RPG', mapMode: 0x23, cartType: 0x35, romSize: 0x0c },
  original: { crc32: '5527071E', md5: '59483FEB9EB20207E3241E005FBDDE7E' },
  patched: { crc32: '05DBCBE6', md5: 'B7F488D4F448304890A4BCE8000248E2' },
  previous: [
    { version: 'v1.1', crc32: 'ABD8AC13', md5: '8E5320631EDCF274BF5C7A62C0417C55' },
    { version: 'v1.0', crc32: 'F4305A06', md5: 'AF6534D26150F9AB7A3765A9C7AF758D' },
  ],
};

export const GOKUDEN_TOTSUGEKI: RomSpec = {
  name: '초오공전 돌격편',
  size: 2097152,
  header: { title: 'SFX DBZ TOTSUGEKIHEN', mapMode: 0x30, cartType: 0x02, romSize: 0x0b },
  original: { crc32: 'D531289B', md5: '8BD89634D1B2205B1E7EF016485C0076' },
  patched: { crc32: '81DAD733', md5: '96EDB7C2748B1EADBE9375410D3934FF' },
  previous: [
    { version: 'v1.1', crc32: '7405D969', md5: 'FCA11D34E7D5AD8D9D2021AC1C8E34E5' },
    { version: 'v1.0', crc32: '52FEF8C3', md5: 'B00D892B59588393145CF3E848A1BA3A' },
  ],
};

export const GOKUDEN_KAKUSEI: RomSpec = {
  name: '초오공전 각성편',
  size: 2097152,
  // The internal name is half-width katakana (JIS X 0201): ｽｰﾊﾟｰｺﾞｸｳﾃﾞﾝ ｶｸｾｲﾍﾝ.
  header: {
    title: String.fromCharCode(
      0xbd,
      0xb0,
      0xca,
      0xdf,
      0xb0,
      0xba,
      0xde,
      0xb8,
      0xb3,
      0xc3,
      0xde,
      0xdd,
      0x20,
      0xb6,
      0xb8,
      0xbe,
      0xb2,
      0xcd,
      0xdd,
    ),
    mapMode: 0x30,
    cartType: 0x02,
    romSize: 0x0b,
  },
  patchedTitle: 'DBZ SUPER GOKUDEN 2',
  original: { crc32: '3172CD4F', md5: '8502A3E5C0FDC56B6495A644ACA54413' },
  patched: { crc32: 'B9F14962', md5: '7F3D20CAC538E0E197F0EFD3D7B56301' },
  previous: [
    { version: 'v1.2', crc32: 'E46C7A28', md5: 'E2457778B2F11063A75DFA69681E6FA3' },
    { version: 'v1.1', crc32: '32219BC3', md5: 'DBCB002BD5B91ED839BA1425EE13F6DE' },
  ],
};

export const OTOGIRISOU: RomSpec = {
  name: '제절초',
  size: 1048576,
  header: { title: 'OTOGIRISOU', mapMode: 0x20, cartType: 0x02, romSize: 0x0a },
  patchedSize: 2097152,
  original: { crc32: '8E4BEFD0', md5: 'AE1E9C92D0B7E6DBA6C6007D99C9C3F4' },
  patched: { crc32: '2C31A0B2', md5: 'CD48C59B3B80D6C9E3C648E8BDD5A4E0' },
  previous: [
    { crc32: 'C70A8E66', md5: '12A3FA116DB687AA4A60A7DB4A67D383' },
    { crc32: '27EE014E', md5: 'F45317CFAAAB68CCA5D8984AF8452535' },
  ],
};

export const COPIER_HEADER = 512;
const MIN_ROM_SIZE = 1048576;

export const megabytes = (spec: RomSpec, size = spec.size) => `${size / 1048576}MB`;
export const patchedSize = (spec: RomSpec) => spec.patchedSize ?? spec.size;

const matches = (fingerprint: RomFingerprint, crc: string, digest: string) =>
  crc === fingerprint.crc32 && digest === fingerprint.md5;

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export function crc32(bytes: Uint8Array): string {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = ((crcTable[(crc ^ byte) & 255] ?? 0) ^ (crc >>> 8)) >>> 0;
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

const shifts = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const sineTable = Int32Array.from({ length: 64 }, (_, i) => Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1))));

// RFC 1321 MD5 is needed to compare the published ROM fingerprints; Web Crypto does not offer MD5.
export function md5(bytes: Uint8Array): string {
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (bytes.length * 8) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bytes.length / 0x20000000), true);
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  for (let offset = 0; offset < padded.length; offset += 64) {
    let a = a0,
      b = b0,
      c = c0,
      d = d0;
    for (let i = 0; i < 64; i++) {
      const round = i >>> 4;
      const f =
        round === 0 ? (b & c) | (~b & d) : round === 1 ? (d & b) | (~d & c) : round === 2 ? b ^ c ^ d : c ^ (b | ~d);
      const word = round === 0 ? i : round === 1 ? (5 * i + 1) % 16 : round === 2 ? (3 * i + 5) % 16 : (7 * i) % 16;
      const sum = (a + f + (sineTable[i] ?? 0) + view.getInt32(offset + word * 4, true)) | 0;
      const shift = shifts[round * 4 + (i % 4)] ?? 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }
  const result = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((word, i) => result.setInt32(i * 4, word, true));
  return Array.from(new Uint8Array(result.buffer), byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export interface OriginalValidation {
  bytes: Uint8Array;
  headered: boolean;
  crc32: string;
  md5: string;
  valid: boolean;
}

export function validateOriginal(spec: RomSpec, source: Uint8Array): OriginalValidation {
  if (source.length !== spec.size && source.length !== spec.size + COPIER_HEADER) {
    const mb = megabytes(spec);
    const count = (n: number) => n.toLocaleString('ko-KR');
    throw new Error(
      `일본판 원본 ${mb}(${count(spec.size)}바이트) 또는 ${mb}+512바이트(${count(spec.size + COPIER_HEADER)}바이트) 파일만 사용할 수 있습니다.`,
    );
  }
  const headered = source.length === spec.size + COPIER_HEADER;
  const bytes = source.subarray(headered ? COPIER_HEADER : 0);
  const crc = crc32(bytes);
  const digest = md5(bytes);
  return { bytes, headered, crc32: crc, md5: digest, valid: matches(spec.original, crc, digest) };
}

/** Applies an IPS patch whose result must have the spec's patched size. */
export function applyIps(spec: RomSpec, source: Uint8Array, ips: Uint8Array): Uint8Array {
  if (source.length !== spec.size) throw new Error(`헤더 없는 ${megabytes(spec)} ROM에만 패치를 적용할 수 있습니다.`);
  const target = patchedSize(spec);
  const mb = megabytes(spec, target);
  let cursor = 0;
  const patchView = new DataView(ips.buffer, ips.byteOffset, ips.byteLength);
  const read = (count: number): number => {
    if (cursor + count > ips.length) throw new Error('IPS 파일이 중간에 끊겼습니다. 다시 시도해 주세요.');
    let value = 0;
    for (let i = 0; i < count; i++) value = value * 256 + patchView.getUint8(cursor++);
    return value;
  };
  if (read(3) !== 0x504154 || read(2) !== 0x4348) throw new Error('올바른 IPS 패치 파일이 아닙니다.');
  const output = new Uint8Array(target);
  output.set(source);
  while (true) {
    const offset = read(3);
    if (offset === 0x454f46) {
      const remaining = ips.length - cursor;
      if (remaining !== 0 && (remaining !== 3 || read(3) !== output.length)) {
        throw new Error(`IPS 끝부분 또는 출력 크기가 올바르지 않습니다. 이 패치는 ${mb}만 지원합니다.`);
      }
      return output;
    }
    let size = read(2);
    if (size === 0) {
      size = read(2);
      const value = read(1);
      if (size === 0) throw new Error('IPS 반복 기록의 길이가 올바르지 않습니다.');
      if (offset + size > output.length) throw new Error(`IPS 기록이 ${mb} ROM 범위를 벗어납니다.`);
      output.fill(value, offset, offset + size);
    } else {
      if (offset + size > output.length) throw new Error(`IPS 기록이 ${mb} ROM 범위를 벗어납니다.`);
      if (cursor + size > ips.length) throw new Error('IPS 기록이 중간에 끊겼습니다.');
      output.set(ips.subarray(cursor, cursor + size), offset);
      cursor += size;
    }
  }
}

/** `patched` checks the name and size the patch writes; the ROM size byte doubles with each doubling of the size. */
export function hasGameHeader(
  spec: RomSpec,
  normalizedBytes: Uint8Array,
  which: 'original' | 'patched' = 'original',
): boolean {
  const { mapMode, cartType } = spec.header;
  const size = which === 'patched' ? patchedSize(spec) : spec.size;
  const title = which === 'patched' ? (spec.patchedTitle ?? spec.header.title) : spec.header.title;
  const romSize = spec.header.romSize + Math.log2(size / spec.size);
  return (
    normalizedBytes.length === size &&
    Array.from(title).every((character, index) => normalizedBytes[0x7fc0 + index] === character.charCodeAt(0)) &&
    normalizedBytes[0x7fd5] === mapMode &&
    normalizedBytes[0x7fd6] === cartType &&
    normalizedBytes[0x7fd7] === romSize
  );
}

export class PatchOutputHashError extends Error {
  readonly crc32: string;
  readonly md5: string;

  constructor(crc32: string, md5: string) {
    super('패치 결과의 체크섬이 일치하지 않아 다운로드를 만들지 않았습니다. 다시 시도해 주세요.');
    this.crc32 = crc32;
    this.md5 = md5;
  }
}

export function createPatchedRom(
  spec: RomSpec,
  source: Uint8Array,
  ips: Uint8Array,
  options: { allowUnverified?: boolean } = {},
): Uint8Array {
  const original = validateOriginal(spec, source);
  const allowUnverified = options.allowUnverified === true;
  if (!original.valid && !allowUnverified)
    throw new Error('손대지 않은 일본판 롬파일이 아닙니다. 다른 일본판 롬파일을 골라 주세요.');
  if (!hasGameHeader(spec, original.bytes))
    throw new Error(`${spec.name}의 게임 식별 정보와 다릅니다. 이 파일에는 패치를 적용할 수 없습니다.`);
  const output = applyIps(spec, original.bytes, ips);
  if (!hasGameHeader(spec, output, 'patched'))
    throw new Error('패치 결과의 크기 또는 게임 식별 정보가 올바르지 않아 다운로드를 만들지 않았습니다.');
  const crc = crc32(output);
  const digest = md5(output);
  if (!allowUnverified && !matches(spec.patched, crc, digest)) throw new PatchOutputHashError(crc, digest);
  return output;
}

export type RomVerdict =
  | { kind: 'too-small' | 'truncated' | 'wrong-size' | 'wrong-game' | 'other-region' }
  | { kind: 'old-korean'; version?: string | undefined }
  | { kind: 'already-korean' | 'original' | 'different'; bytes: Uint8Array; crc32: string; md5: string };

/** First matching rule wins; the order mirrors what a player should hear first. */
export function classifyRom(spec: RomSpec, source: Uint8Array): RomVerdict {
  if (source.length < MIN_ROM_SIZE) return { kind: 'too-small' };
  if (source.length < spec.size) return { kind: 'truncated' };
  const size = [spec.size, patchedSize(spec)].find(n => source.length === n || source.length === n + COPIER_HEADER);
  if (size === undefined) return { kind: 'wrong-size' };
  const bytes = source.subarray(source.length - size);
  const crc = crc32(bytes);
  const digest = md5(bytes);
  if (matches(spec.patched, crc, digest)) return { kind: 'already-korean', bytes, crc32: crc, md5: digest };
  if (matches(spec.original, crc, digest)) return { kind: 'original', bytes, crc32: crc, md5: digest };
  const earlier = spec.previous?.find(release => matches(release, crc, digest));
  if (earlier) return { kind: 'old-korean', version: earlier.version };
  const renamed = spec.patchedTitle !== undefined || patchedSize(spec) !== spec.size;
  if (renamed && hasGameHeader(spec, bytes, 'patched')) return { kind: 'old-korean' };
  if (size !== spec.size) return { kind: 'wrong-size' };
  if (!hasGameHeader(spec, bytes)) return { kind: 'wrong-game' };
  // Cartridge header destination code: 0x00 is Japan; other versions need a different patch.
  if (bytes[0x7fd9] !== 0x00) return { kind: 'other-region' };
  return { kind: 'different', bytes, crc32: crc, md5: digest };
}

const archiveSignatures = [
  [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], // 7z
  [0x52, 0x61, 0x72, 0x21], // rar
  [0x41, 0x4c, 0x5a, 0x01], // alz
  [0x45, 0x47, 0x47, 0x41], // egg
];

export function isZip(bytes: Uint8Array, name = ''): boolean {
  return (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) || /\.zip$/i.test(name);
}

/** Archives the browser cannot open on its own. */
export function isOtherArchive(bytes: Uint8Array, name = ''): boolean {
  return (
    /\.(7z|rar|alz|egg)$/i.test(name) || archiveSignatures.some(signature => signature.every((b, i) => bytes[i] === b))
  );
}

const romName = /\.(sfc|smc|fig|swc)$/i;

/**
 * Pulls the single ROM out of a zip using the browser's built-in inflater.
 * Returns undefined when the archive needs to be opened by hand (no ROM, several ROMs, encryption, other methods).
 */
export async function extractRomFromZip(
  spec: RomSpec,
  zip: Uint8Array,
): Promise<{ name: string; bytes: Uint8Array } | undefined> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) return undefined;
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const candidates: { name: string; flags: number; method: number; compressed: number; size: number; local: number }[] =
    [];
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > zip.length || view.getUint32(cursor, true) !== 0x02014b50) return undefined;
    const nameLength = view.getUint16(cursor + 28, true);
    const entry = {
      flags: view.getUint16(cursor + 8, true),
      method: view.getUint16(cursor + 10, true),
      compressed: view.getUint32(cursor + 20, true),
      size: view.getUint32(cursor + 24, true),
      local: view.getUint32(cursor + 42, true),
      name: decoder.decode(zip.subarray(cursor + 46, cursor + 46 + nameLength)),
    };
    if (romName.test(entry.name) || entry.size === spec.size || entry.size === spec.size + COPIER_HEADER) {
      candidates.push(entry);
    }
    cursor += 46 + nameLength + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
  }
  const entry = candidates.length === 1 ? candidates[0] : undefined;
  if (!entry || entry.flags & 1 || (entry.method !== 0 && entry.method !== 8)) return undefined;
  if (entry.local + 30 > zip.length || view.getUint32(entry.local, true) !== 0x04034b50) return undefined;
  const start = entry.local + 30 + view.getUint16(entry.local + 26, true) + view.getUint16(entry.local + 28, true);
  const data = zip.subarray(start, start + entry.compressed);
  if (data.length !== entry.compressed) return undefined;
  if (entry.method === 0) return { name: entry.name, bytes: data.slice() };
  try {
    const stream = new Blob([data.slice()]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    return bytes.length === entry.size ? { name: entry.name, bytes } : undefined;
  } catch {
    return undefined;
  }
}
