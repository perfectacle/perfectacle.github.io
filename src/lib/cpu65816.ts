/**
 * A tiny 65c816 interpreter for the guide's step-through CPU widget. It runs only in native mode (E = 0), knows only the
 * handful of instructions the guide's examples use, and does binary arithmetic only (the D flag is never set by the
 * examples). Register widths follow the M and X flags exactly as the W65C816S datasheet describes, because showing
 * that switch is the point of the widget.
 */

export const FLAG = { N: 0x80, V: 0x40, M: 0x20, X: 0x10, D: 0x08, I: 0x04, Z: 0x02, C: 0x01 } as const;
export const FLAG_ORDER = ['N', 'V', 'M', 'X', 'D', 'I', 'Z', 'C'] as const;

export interface CpuState {
  /** Full 16-bit accumulator C. With M = 1 only the low byte (A) is used and the high byte (B) is kept. */
  a: number;
  x: number;
  y: number;
  s: number;
  d: number;
  db: number;
  pb: number;
  pc: number;
  p: number;
  stopped: boolean;
}

type Mode = 'imp' | 'immM' | 'immX' | 'imm8' | 'abs' | 'absX' | 'dp' | 'rel';
type Op =
  | 'ADC'
  | 'BCC'
  | 'BCS'
  | 'BEQ'
  | 'BNE'
  | 'BRA'
  | 'CLC'
  | 'CMP'
  | 'CPX'
  | 'DEX'
  | 'DEY'
  | 'INX'
  | 'INY'
  | 'JSR'
  | 'LDA'
  | 'LDX'
  | 'LDY'
  | 'NOP'
  | 'REP'
  | 'RTS'
  | 'SEC'
  | 'SEP'
  | 'STA'
  | 'STP'
  | 'STX'
  | 'TAX'
  | 'TAY'
  | 'TXA'
  | 'TYA';

const OPCODES: Record<number, [Op, Mode]> = {
  0x18: ['CLC', 'imp'],
  0x20: ['JSR', 'abs'],
  0x38: ['SEC', 'imp'],
  0x60: ['RTS', 'imp'],
  0x65: ['ADC', 'dp'],
  0x69: ['ADC', 'immM'],
  0x6d: ['ADC', 'abs'],
  0x80: ['BRA', 'rel'],
  0x85: ['STA', 'dp'],
  0x86: ['STX', 'dp'],
  0x88: ['DEY', 'imp'],
  0x8a: ['TXA', 'imp'],
  0x8d: ['STA', 'abs'],
  0x8e: ['STX', 'abs'],
  0x90: ['BCC', 'rel'],
  0x98: ['TYA', 'imp'],
  0x9d: ['STA', 'absX'],
  0xa0: ['LDY', 'immX'],
  0xa2: ['LDX', 'immX'],
  0xa5: ['LDA', 'dp'],
  0xa6: ['LDX', 'dp'],
  0xa8: ['TAY', 'imp'],
  0xa9: ['LDA', 'immM'],
  0xaa: ['TAX', 'imp'],
  0xad: ['LDA', 'abs'],
  0xae: ['LDX', 'abs'],
  0xb0: ['BCS', 'rel'],
  0xbd: ['LDA', 'absX'],
  0xc2: ['REP', 'imm8'],
  0xc5: ['CMP', 'dp'],
  0xc8: ['INY', 'imp'],
  0xc9: ['CMP', 'immM'],
  0xca: ['DEX', 'imp'],
  0xcd: ['CMP', 'abs'],
  0xd0: ['BNE', 'rel'],
  0xdb: ['STP', 'imp'],
  0xe0: ['CPX', 'immX'],
  0xe2: ['SEP', 'imm8'],
  0xe8: ['INX', 'imp'],
  0xea: ['NOP', 'imp'],
  0xf0: ['BEQ', 'rel'],
};

export const SUPPORTED_OPCODES = Object.keys(OPCODES).map(Number);

/** Bank $00-$3F/$80-$BF, $0000-$1FFF is a mirror of the first 8KB of WRAM ($7E:0000). */
export const normalize = (addr: number) => {
  const bank = (addr >>> 16) & 0xff;
  const lo = addr & 0xffff;
  if ((bank < 0x40 || (bank >= 0x80 && bank < 0xc0)) && lo < 0x2000) return 0x7e0000 | lo;
  return addr & 0xffffff;
};

const isRom = (addr: number) => {
  const bank = addr >>> 16;
  return bank !== 0x7e && bank !== 0x7f && (addr & 0xffff) >= 0x8000;
};

export class Memory {
  readonly bytes = new Map<number, number>();

  constructor(rom: Record<number, number[]> = {}) {
    for (const [start, data] of Object.entries(rom)) data.forEach((b, i) => this.bytes.set(Number(start) + i, b));
  }

  read(addr: number) {
    return this.bytes.get(normalize(addr)) ?? 0;
  }

  /** Writes one byte; ROM ignores writes, as on the console. Returns the address actually written, if any. */
  write(addr: number, value: number) {
    const at = normalize(addr);
    if (isRom(at)) return null;
    this.bytes.set(at, value & 0xff);
    return at;
  }
}

export interface Instruction {
  /** 24-bit address of the opcode. */
  addr: number;
  bytes: number[];
  op: Op;
  mode: Mode;
  operand: number;
  /** Assembly the way `krpatch snes dis` prints it, e.g. `LDA $8012,X`. */
  text: string;
}

const h = (n: number, digits: number) => '$' + n.toString(16).toUpperCase().padStart(digits, '0');

const flag = (p: number, f: number) => (p & f) !== 0;

/** Reads the instruction at PB:PC; operand sizes depend on the current M and X flags. */
export function decode(mem: Memory, state: Pick<CpuState, 'pb' | 'pc' | 'p'>): Instruction {
  const addr = (state.pb << 16) | state.pc;
  const at = (i: number) => mem.read((state.pb << 16) | ((state.pc + i) & 0xffff));
  const opcode = at(0);
  const entry = OPCODES[opcode];
  if (!entry) throw new Error(`opcode ${h(opcode, 2)} at ${h(addr, 6)} is not part of the guide's instruction set`);
  const [op, mode] = entry;
  const size =
    mode === 'imp'
      ? 0
      : mode === 'imm8' || mode === 'dp' || mode === 'rel'
        ? 1
        : mode === 'immM'
          ? flag(state.p, FLAG.M)
            ? 1
            : 2
          : mode === 'immX'
            ? flag(state.p, FLAG.X)
              ? 1
              : 2
            : 2;
  const bytes = [opcode];
  for (let i = 1; i <= size; i++) bytes.push(at(i));
  const operand = size === 2 ? (bytes[1] ?? 0) | ((bytes[2] ?? 0) << 8) : (bytes[1] ?? 0);
  let arg = '';
  switch (mode) {
    case 'immM':
    case 'immX':
    case 'imm8':
      arg = `#${h(operand, size * 2)}`;
      break;
    case 'abs':
      arg = h(operand, 4);
      break;
    case 'absX':
      arg = `${h(operand, 4)},X`;
      break;
    case 'dp':
      arg = h(operand, 2);
      break;
    case 'rel': {
      const target = (state.pc + 2 + ((operand << 24) >> 24)) & 0xffff;
      arg = h(target, 4);
      break;
    }
  }
  return { addr, bytes, op, mode, operand, text: arg ? `${op} ${arg}` : op };
}

export interface Write {
  /** WRAM or other RAM address after mirroring, e.g. $80:0A00 lands at $7E:0A00. */
  addr: number;
  value: number;
}

export interface StepResult {
  instruction: Instruction;
  state: CpuState;
  writes: Write[];
}

/** Runs one instruction. `state` is not modified; `mem` is. */
export function step(prev: CpuState, mem: Memory): StepResult {
  if (prev.stopped) throw new Error('the CPU has stopped (STP)');
  const ins = decode(mem, prev);
  const s: CpuState = { ...prev, pc: (prev.pc + ins.bytes.length) & 0xffff };
  const writes: Write[] = [];
  const m16 = !flag(s.p, FLAG.M);
  const x16 = !flag(s.p, FLAG.X);

  const setNZ = (value: number, wide: boolean) => {
    const sign = wide ? 0x8000 : 0x80;
    const mask = wide ? 0xffff : 0xff;
    s.p = (s.p & ~(FLAG.N | FLAG.Z)) | (value & sign ? FLAG.N : 0) | ((value & mask) === 0 ? FLAG.Z : 0);
  };
  const setFlag = (f: number, on: boolean) => {
    s.p = on ? s.p | f : s.p & ~f;
  };
  const target = (): number => {
    switch (ins.mode) {
      case 'abs':
        return (s.db << 16) | ins.operand;
      case 'absX':
        return (((s.db << 16) | ins.operand) + s.x) & 0xffffff;
      case 'dp':
        return (s.d + ins.operand) & 0xffff;
      default:
        throw new Error(`${ins.text} has no memory operand`);
    }
  };
  const load = (wide: boolean) => {
    if (ins.mode === 'immM' || ins.mode === 'immX') return ins.operand;
    const at = target();
    const lo = mem.read(at);
    return wide ? lo | (mem.read((at + 1) & 0xffffff) << 8) : lo;
  };
  const store = (value: number, wide: boolean) => {
    const at = target();
    const put = (addr: number, byte: number) => {
      const written = mem.write(addr, byte);
      if (written !== null) writes.push({ addr: written, value: byte & 0xff });
    };
    put(at, value);
    if (wide) put((at + 1) & 0xffffff, value >> 8);
  };
  const setA = (value: number) => {
    s.a = m16 ? value & 0xffff : (s.a & 0xff00) | (value & 0xff);
    setNZ(value, m16);
  };
  const index = (value: number) => (x16 ? value & 0xffff : value & 0xff);
  const compare = (reg: number, value: number, wide: boolean) => {
    const mask = wide ? 0xffff : 0xff;
    const r = reg & mask;
    setFlag(FLAG.C, r >= value);
    setNZ((r - value) & mask, wide);
  };
  const branch = (taken: boolean) => {
    if (taken) s.pc = (s.pc + ((ins.operand << 24) >> 24)) & 0xffff;
  };
  const push = (byte: number) => {
    const written = mem.write(s.s, byte);
    if (written !== null) writes.push({ addr: written, value: byte & 0xff });
    s.s = (s.s - 1) & 0xffff;
  };
  const pull = () => {
    s.s = (s.s + 1) & 0xffff;
    return mem.read(s.s);
  };

  switch (ins.op) {
    case 'LDA':
      setA(load(m16));
      break;
    case 'LDX':
      s.x = index(load(x16));
      setNZ(s.x, x16);
      break;
    case 'LDY':
      s.y = index(load(x16));
      setNZ(s.y, x16);
      break;
    case 'STA':
      store(s.a, m16);
      break;
    case 'STX':
      store(s.x, x16);
      break;
    case 'INX':
      s.x = index(s.x + 1);
      setNZ(s.x, x16);
      break;
    case 'DEX':
      s.x = index(s.x - 1);
      setNZ(s.x, x16);
      break;
    case 'INY':
      s.y = index(s.y + 1);
      setNZ(s.y, x16);
      break;
    case 'DEY':
      s.y = index(s.y - 1);
      setNZ(s.y, x16);
      break;
    // Transfers take the destination's width: TAX copies all of C when X is 16-bit, even if A is 8-bit.
    case 'TAX':
      s.x = index(s.a);
      setNZ(s.x, x16);
      break;
    case 'TAY':
      s.y = index(s.a);
      setNZ(s.y, x16);
      break;
    case 'TXA':
      setA(s.x);
      break;
    case 'TYA':
      setA(s.y);
      break;
    case 'CMP':
      compare(s.a, load(m16), m16);
      break;
    case 'CPX':
      compare(s.x, load(x16), x16);
      break;
    case 'ADC': {
      const mask = m16 ? 0xffff : 0xff;
      const sign = m16 ? 0x8000 : 0x80;
      const a = s.a & mask;
      const v = load(m16);
      const r = a + v + (flag(s.p, FLAG.C) ? 1 : 0);
      setFlag(FLAG.C, r > mask);
      setFlag(FLAG.V, (~(a ^ v) & (a ^ r) & sign) !== 0);
      setA(r & mask);
      break;
    }
    case 'CLC':
      setFlag(FLAG.C, false);
      break;
    case 'SEC':
      setFlag(FLAG.C, true);
      break;
    case 'REP':
      s.p &= ~ins.operand;
      break;
    case 'SEP':
      s.p |= ins.operand;
      // Setting X to 8-bit clears the high bytes of X and Y; the hidden B byte of the accumulator is kept.
      if (flag(s.p, FLAG.X)) {
        s.x &= 0xff;
        s.y &= 0xff;
      }
      break;
    case 'BNE':
      branch(!flag(s.p, FLAG.Z));
      break;
    case 'BEQ':
      branch(flag(s.p, FLAG.Z));
      break;
    case 'BCC':
      branch(!flag(s.p, FLAG.C));
      break;
    case 'BCS':
      branch(flag(s.p, FLAG.C));
      break;
    case 'BRA':
      branch(true);
      break;
    case 'JSR': {
      // The return address pushed is the last byte of the JSR itself; RTS adds one.
      const ret = (prev.pc + 2) & 0xffff;
      push(ret >> 8);
      push(ret);
      s.pc = ins.operand;
      break;
    }
    case 'RTS': {
      const lo = pull();
      const hi = pull();
      s.pc = (((hi << 8) | lo) + 1) & 0xffff;
      break;
    }
    case 'STP':
      s.stopped = true;
      break;
    case 'NOP':
      break;
  }
  return { instruction: ins, state: s, writes };
}

/** State right after the guide's examples are entered: native mode, 8-bit A and X/Y, code and data bank $80. */
export const startState = (pc = 0x8000): CpuState => ({
  a: 0,
  x: 0,
  y: 0,
  s: 0x1fff,
  d: 0,
  db: 0x80,
  pb: 0x80,
  pc,
  p: FLAG.M | FLAG.X | FLAG.I,
  stopped: false,
});

export interface Trace {
  steps: StepResult[];
  final: CpuState;
}

/** Runs until STP, with a step limit so a wrong program cannot hang the page. */
export function run(mem: Memory, state = startState(), limit = 500): Trace {
  const steps: StepResult[] = [];
  let current = state;
  while (!current.stopped) {
    if (steps.length >= limit) throw new Error(`no STP within ${limit} steps`);
    const result = step(current, mem);
    steps.push(result);
    current = result.state;
  }
  return { steps, final: current };
}

export const flagString = (p: number) => FLAG_ORDER.map(f => (p & FLAG[f] ? f : f.toLowerCase())).join('');
