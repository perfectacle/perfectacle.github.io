/**
 * VCDIFF (RFC 3284) decoder for xdelta3 patches, ported from kr-patch-toolkit (`kr_patch/vcdiff.py`). The Nintendo DS
 * patches are xdelta files because their ROMs are larger than IPS can address (16 MiB).
 *
 * Supported: the default code table, the xdelta3 application header (skipped) and the per-window Adler-32 of the
 * target, which fails when the player picked a different source file. Secondary compression and custom code tables are
 * errors; the patches are made with `xdelta3 -S none`.
 */

export class VcdiffError extends Error {}

const MAGIC = [0xd6, 0xc3, 0xc4, 0x00];
const VCD_SOURCE = 1;
const VCD_TARGET = 2;
const VCD_ADLER32 = 4;
const NOOP = 0;
const ADD = 1;
const RUN = 2;
const COPY = 3;
const NEAR = 4;
const SAME = 3;

type Instruction = readonly [type: number, size: number, mode: number];

const CODE_TABLE: readonly (readonly [Instruction, Instruction])[] = (() => {
  const none: Instruction = [NOOP, 0, 0];
  const table: [Instruction, Instruction][] = [
    [[RUN, 0, 0], none],
    [[ADD, 0, 0], none],
  ];
  for (let size = 1; size <= 17; size++) table.push([[ADD, size, 0], none]);
  for (let mode = 0; mode < 9; mode++) {
    table.push([[COPY, 0, mode], none]);
    for (let size = 4; size <= 18; size++) table.push([[COPY, size, mode], none]);
  }
  for (let mode = 0; mode < 6; mode++)
    for (let add = 1; add <= 4; add++)
      for (let copy = 4; copy <= 6; copy++)
        table.push([
          [ADD, add, 0],
          [COPY, copy, mode],
        ]);
  for (let mode = 6; mode < 9; mode++)
    for (let add = 1; add <= 4; add++)
      table.push([
        [ADD, add, 0],
        [COPY, 4, mode],
      ]);
  for (let mode = 0; mode < 9; mode++)
    table.push([
      [COPY, 4, mode],
      [ADD, 1, 0],
    ]);
  return table;
})();

class Reader {
  readonly data: Uint8Array;
  pos: number;
  readonly end: number;

  constructor(data: Uint8Array, pos: number, end = data.length) {
    this.data = data;
    this.pos = pos;
    this.end = end;
  }

  byte(): number {
    if (this.pos >= this.end) throw new VcdiffError('패치 파일이 중간에 끊겼습니다.');
    return this.data[this.pos++] ?? 0;
  }

  varint(): number {
    let value = 0;
    for (let i = 0; i < 10; i++) {
      const b = this.byte();
      value = value * 128 + (b & 0x7f);
      if (!(b & 0x80)) return value;
    }
    throw new VcdiffError('패치 파일의 숫자가 너무 깁니다.');
  }

  take(n: number): Uint8Array {
    if (this.pos + n > this.end) throw new VcdiffError('패치 파일이 중간에 끊겼습니다.');
    const out = this.data.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
}

export function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  // 5552 is the largest block whose sums cannot overflow before the modulo.
  for (let i = 0; i < bytes.length; i += 5552) {
    const end = Math.min(bytes.length, i + 5552);
    for (let j = i; j < end; j++) {
      a += bytes[j] ?? 0;
      b += a;
    }
    a %= 65521;
    b %= 65521;
  }
  return (b * 65536 + a) >>> 0;
}

/** Growable output that windows with VCD_TARGET can read back. */
class Output {
  bytes: Uint8Array;
  length = 0;

  constructor(capacity: number) {
    this.bytes = new Uint8Array(capacity);
  }

  reserve(extra: number) {
    if (this.length + extra <= this.bytes.length) return;
    let size = this.bytes.length;
    while (size < this.length + extra) size *= 2;
    const grown = new Uint8Array(size);
    grown.set(this.bytes.subarray(0, this.length));
    this.bytes = grown;
  }
}

function header(patch: Uint8Array): number {
  const r = new Reader(patch, 0);
  if (!MAGIC.every(b => r.byte() === b)) throw new VcdiffError('xdelta(VCDIFF) 패치 파일이 아닙니다.');
  const indicator = r.byte();
  if (indicator & 1) throw new VcdiffError('2차 압축을 쓴 xdelta 패치는 지원하지 않습니다.');
  if (indicator & 2) throw new VcdiffError('사용자 코드 표를 쓴 xdelta 패치는 지원하지 않습니다.');
  if (indicator & 4) r.take(r.varint());
  return r.pos;
}

/**
 * Target bytes of a VCDIFF patch applied to `source`. Throws VcdiffError for a malformed patch or a wrong source.
 * `expectedSize` sizes the output up front, so a large ROM is neither regrown nor copied at the end.
 */
export function applyVcdiff(source: Uint8Array, patch: Uint8Array, expectedSize = 1 << 20): Uint8Array {
  const r = new Reader(patch, header(patch));
  const out = new Output(Math.max(1, expectedSize));
  let window = 0;
  while (r.pos < patch.length) {
    const indicator = r.byte();
    if (indicator & ~(VCD_SOURCE | VCD_TARGET | VCD_ADLER32) || (indicator & VCD_SOURCE && indicator & VCD_TARGET))
      throw new VcdiffError('패치 파일이 손상되었습니다.');
    let segment = new Uint8Array(0);
    if (indicator & (VCD_SOURCE | VCD_TARGET)) {
      const length = r.varint();
      const position = r.varint();
      const from = indicator & VCD_SOURCE ? source : out.bytes.subarray(0, out.length);
      if (position + length > from.length) throw new VcdiffError('고른 파일이 이 패치의 원본이 아닙니다.');
      segment = from.slice(position, position + length);
    }
    const deltaLength = r.varint();
    const deltaAt = r.pos;
    const targetLength = r.varint();
    if (r.byte()) throw new VcdiffError('압축된 구역을 쓴 xdelta 패치는 지원하지 않습니다.');
    const dataLength = r.varint();
    const instLength = r.varint();
    const addrLength = r.varint();
    const checksum = indicator & VCD_ADLER32 ? new DataView(r.take(4).slice().buffer).getUint32(0) : undefined;
    if (r.pos - deltaAt + dataLength + instLength + addrLength !== deltaLength)
      throw new VcdiffError('패치 파일이 손상되었습니다.');
    const data = new Reader(patch, r.pos, r.pos + dataLength);
    const inst = new Reader(patch, data.end, data.end + instLength);
    const addr = new Reader(patch, inst.end, inst.end + addrLength);
    r.pos = addr.end;
    const start = out.length;
    out.reserve(targetLength);
    decodeWindow(segment, out, start + targetLength, data, inst, addr);
    if (out.length - start !== targetLength || data.pos !== data.end || addr.pos !== addr.end)
      throw new VcdiffError('패치 파일이 손상되었습니다.');
    if (checksum !== undefined && adler32(out.bytes.subarray(start, out.length)) !== checksum)
      throw new VcdiffError('고른 파일이 이 패치의 원본이 아닙니다.');
    window++;
  }
  if (!window) throw new VcdiffError('패치 파일이 비어 있습니다.');
  return out.length === out.bytes.length ? out.bytes : out.bytes.slice(0, out.length);
}

function decodeWindow(segment: Uint8Array, out: Output, limit: number, data: Reader, inst: Reader, addr: Reader) {
  const slen = segment.length;
  const start = out.length;
  const near = new Array<number>(NEAR).fill(0);
  const same = new Array<number>(SAME * 256).fill(0);
  let next = 0;
  const bytes = () => out.bytes;
  while (inst.pos < inst.end) {
    for (const [type, fixed, mode] of CODE_TABLE[inst.byte()] ?? []) {
      if (type === NOOP) continue;
      const size = fixed || inst.varint();
      if (out.length + size > limit) throw new VcdiffError('패치 파일이 손상되었습니다.');
      if (type === ADD) {
        bytes().set(data.take(size), out.length);
        out.length += size;
      } else if (type === RUN) {
        bytes().fill(data.byte(), out.length, out.length + size);
        out.length += size;
      } else {
        const here = slen + out.length - start;
        let a: number;
        if (mode === 0) a = addr.varint();
        else if (mode === 1) a = here - addr.varint();
        else if (mode < 2 + NEAR) a = (near[mode - 2] ?? 0) + addr.varint();
        else a = same[(mode - 2 - NEAR) * 256 + addr.byte()] ?? 0;
        near[next] = a;
        next = (next + 1) % NEAR;
        same[a % (SAME * 256)] = a;
        if (a < 0 || a >= here) throw new VcdiffError('패치 파일이 손상되었습니다.');
        let k = 0;
        for (; k < size && a + k < slen; k++) bytes()[out.length++] = segment[a + k] ?? 0;
        // From the target: chunks no longer than the distance, so an overlapping copy repeats its pattern.
        while (k < size) {
          const from = start + a + k - slen;
          const n = Math.min(size - k, out.length - from);
          bytes().copyWithin(out.length, from, from + n);
          out.length += n;
          k += n;
        }
      }
    }
  }
}
