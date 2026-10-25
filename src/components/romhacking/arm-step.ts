import fn from './ghost-trick-font-fn.json';

/**
 * A tiny ARM (ARMv5, ARM state) decoder and interpreter for the handful of instruction forms in Ghost Trick's font
 * selection function at 0x02012BA0 (from the unpacked ARM9 program): MOV/CMP with an immediate, LDR/STR with an
 * immediate or shifted-register offset, and BX. Anything else is reported as unsupported.
 */

const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], b => parseInt(b, 16));
const word = (b: Uint8Array, o: number) =>
  ((b[o] ?? 0) | ((b[o + 1] ?? 0) << 8) | ((b[o + 2] ?? 0) << 16) | ((b[o + 3] ?? 0) << 24)) >>> 0;

export const CODE_AT = fn.codeAt;
export const CODE = bytes(fn.code);
export const TABLE_AT = fn.tableAt;
export const TABLE = bytes(fn.table);
export const NAMES = new Map(Object.entries(fn.names).map(([k, v]) => [parseInt(k, 16), v]));
/** Where the example pretends the caller's object lives; any free RAM address would do. */
export const OBJECT_AT = 0x02100000;

export const hex = (n: number, w = 8) => `0x${(n >>> 0).toString(16).toUpperCase().padStart(w, '0')}`;

const COND = ['eq', 'ne', 'cs', 'cc', 'mi', 'pl', 'vs', 'vc', 'hi', 'ls', 'ge', 'lt', 'gt', 'le', '', 'nv'];
export const COND_TEXT: Record<string, string> = {
  '': '늘 실행',
  eq: '같으면(Z = 1)',
  ne: '다르면(Z = 0)',
  lt: '작으면(N ≠ V)',
};

export type Op =
  | { kind: 'mov'; rd: number; imm: number }
  | { kind: 'cmp'; rn: number; imm: number }
  | { kind: 'mem'; load: boolean; rd: number; rn: number; imm?: number; rm?: number; lsl?: number }
  | { kind: 'bx'; rm: number }
  | { kind: 'word'; value: number };

export interface Instr {
  at: number;
  raw: number;
  cond: string;
  op: Op;
  text: string;
}

const reg = (n: number) => (n === 15 ? 'pc' : n === 14 ? 'lr' : n === 13 ? 'sp' : `r${n}`);
const ror = (v: number, r: number) => ((v >>> r) | (v << (32 - r))) >>> 0;

export function decode(raw: number, at: number): Instr {
  const cond = COND[raw >>> 28] ?? '';
  const c = cond;
  let op: Op = { kind: 'word', value: raw };
  let text = `.word ${hex(raw)}`;
  if ((raw & 0x0ffffff0) === 0x012fff10) {
    op = { kind: 'bx', rm: raw & 15 };
    text = `bx${c} ${reg(raw & 15)}`;
  } else if (((raw >>> 26) & 3) === 0 && (raw >>> 25) & 1) {
    const opcode = (raw >>> 21) & 15;
    const imm = ror(raw & 0xff, ((raw >>> 8) & 15) * 2);
    const rn = (raw >>> 16) & 15;
    const rd = (raw >>> 12) & 15;
    if (opcode === 0b1101) {
      op = { kind: 'mov', rd, imm };
      text = `mov${c} ${reg(rd)}, #${hex(imm, 1)}`;
    } else if (opcode === 0b1010 && (raw >>> 20) & 1) {
      op = { kind: 'cmp', rn, imm };
      text = `cmp${c} ${reg(rn)}, #${hex(imm, 1)}`;
    }
  } else if (
    ((raw >>> 26) & 3) === 1 &&
    (raw >>> 24) & 1 &&
    (raw >>> 23) & 1 &&
    !((raw >>> 21) & 1) &&
    !((raw >>> 22) & 1)
  ) {
    const load = Boolean((raw >>> 20) & 1);
    const rn = (raw >>> 16) & 15;
    const rd = (raw >>> 12) & 15;
    const name = load ? 'ldr' : 'str';
    if (!((raw >>> 25) & 1)) {
      const imm = raw & 0xfff;
      op = { kind: 'mem', load, rd, rn, imm };
      text = `${name}${c} ${reg(rd)}, [${reg(rn)}, #${hex(imm, 1)}]`;
    } else if (((raw >>> 5) & 3) === 0) {
      const rm = raw & 15;
      const lsl = (raw >>> 7) & 31;
      op = { kind: 'mem', load, rd, rn, rm, lsl };
      text = `${name}${c} ${reg(rd)}, [${reg(rn)}, ${reg(rm)}, lsl #${lsl}]`;
    }
  }
  return { at, raw, cond, op, text };
}

export const PROGRAM: Instr[] = Array.from({ length: CODE.length / 4 }, (_, i) =>
  decode(word(CODE, i * 4), CODE_AT + i * 4),
);

export interface Flags {
  n: boolean;
  z: boolean;
  c: boolean;
  v: boolean;
}

export interface State {
  r: number[];
  flags: Flags;
  pc: number;
  mem: Map<number, number>;
  done: boolean;
}

export function start(fontNumber: number): State {
  const r = Array.from({ length: 16 }, () => 0);
  r[0] = OBJECT_AT;
  r[1] = fontNumber >>> 0;
  r[14] = 0x020125ec;
  return { r, flags: { n: false, z: false, c: false, v: false }, pc: CODE_AT, mem: new Map(), done: false };
}

const passes = (cond: string, f: Flags) =>
  cond === '' ? true : cond === 'eq' ? f.z : cond === 'ne' ? !f.z : cond === 'lt' ? f.n !== f.v : false;

function load(s: State, addr: number) {
  if (s.mem.has(addr)) return s.mem.get(addr) ?? 0;
  if (addr >= CODE_AT && addr + 4 <= CODE_AT + CODE.length) return word(CODE, addr - CODE_AT);
  if (addr >= TABLE_AT && addr + 4 <= TABLE_AT + TABLE.length) return word(TABLE, addr - TABLE_AT);
  return 0;
}

export interface Step {
  instr: Instr;
  ran: boolean;
  /** What happened, in words. */
  text: string;
  state: State;
}

/** Runs one instruction and returns the new state; the input is not changed. */
export function step(prev: State): Step {
  const s: State = { r: [...prev.r], flags: { ...prev.flags }, pc: prev.pc, mem: new Map(prev.mem), done: prev.done };
  const instr = PROGRAM[(s.pc - CODE_AT) / 4];
  if (!instr || s.done) return { instr: instr ?? decode(0, s.pc), ran: false, text: '끝났습니다.', state: s };
  const ran = passes(instr.cond, s.flags);
  // Reading pc gives the address of this instruction + 8 in ARM state.
  const read = (n: number) => (n === 15 ? instr.at + 8 : (s.r[n] ?? 0));
  let text = '조건이 맞지 않아 건너뜁니다.';
  s.pc = instr.at + 4;
  if (ran) {
    const op = instr.op;
    if (op.kind === 'mov') {
      s.r[op.rd] = op.imm;
      text = `${reg(op.rd)} ← ${hex(op.imm, 1)}`;
    } else if (op.kind === 'cmp') {
      const a = read(op.rn) | 0;
      const res = (a - op.imm) | 0;
      s.flags = { n: res < 0, z: res === 0, c: a >>> 0 >= op.imm >>> 0, v: ((a ^ op.imm) & (a ^ res)) < 0 };
      text = `${reg(op.rn)} − ${hex(op.imm, 1)} = ${String(res).replace('-', '−')}. N=${+s.flags.n} Z=${+s.flags.z} C=${+s.flags.c} V=${+s.flags.v}`;
    } else if (op.kind === 'mem') {
      const off = op.rm !== undefined ? (read(op.rm) << (op.lsl ?? 0)) >>> 0 : (op.imm ?? 0);
      const addr = (read(op.rn) + off) >>> 0;
      if (op.load) {
        const v = load(s, addr);
        s.r[op.rd] = v;
        const name = NAMES.get(v);
        text = `${reg(op.rd)} ← [${hex(addr)}] = ${hex(v)}${name ? `(${name}의 주소)` : ''}`;
      } else {
        s.mem.set(addr, read(op.rd));
        text = `[${hex(addr)}] ← ${reg(op.rd)} = ${hex(read(op.rd))}`;
      }
    } else if (op.kind === 'bx') {
      s.pc = read(op.rm) & ~1;
      s.done = true;
      text = `돌아갈 곳 ${hex(s.pc)}, 돌려주는 값 r0 = ${s.r[0] ?? 0}`;
    } else text = '이 해석기가 다루지 않는 명령입니다.';
  }
  return { instr, ran, text, state: s };
}

export function run(fontNumber: number): Step[] {
  const out: Step[] = [];
  let s = start(fontNumber);
  for (let i = 0; i < 20 && !s.done; i++) {
    const st = step(s);
    out.push(st);
    s = st.state;
  }
  return out;
}
