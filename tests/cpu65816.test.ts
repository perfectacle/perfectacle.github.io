import { describe, expect, test } from 'vitest';
import {
  FLAG,
  Memory,
  decode,
  flagString,
  normalize,
  run,
  startState,
  step,
  type CpuState,
} from '../src/lib/cpu65816.ts';
import {
  COPY_PROGRAM,
  CPU_PROGRAMS,
  LOOP_PROGRAM,
  WIDTH_PROGRAM,
  type CpuProgram,
} from '../src/components/romhacking/cpu-programs.ts';

const load = (program: CpuProgram) => new Memory({ 0x808000: program.code });

const listing = (program: CpuProgram) => {
  const mem = load(program);
  return run(mem).steps.map(s => `${(s.instruction.addr & 0xffff).toString(16)} ${s.instruction.text}`);
};

const regs = (s: CpuState) => ({ a: s.a, x: s.x, y: s.y, s: s.s, pc: s.pc, p: flagString(s.p) });

describe('width program', () => {
  test('decodes with the operand size the M flag selects', () => {
    expect(listing(WIDTH_PROGRAM)).toEqual([
      '8000 REP #$20',
      '8002 LDA #$1234',
      '8005 STA $0A00',
      '8008 SEP #$20',
      '800a LDA #$56',
      '800c STA $0A02',
      '800f STP',
    ]);
  });

  test('16-bit store writes low byte first; 8-bit load keeps B', () => {
    const mem = load(WIDTH_PROGRAM);
    const { steps, final } = run(mem);
    expect(steps[1]?.state.a).toBe(0x1234);
    expect(steps[2]?.writes).toEqual([
      { addr: 0x7e0a00, value: 0x34 },
      { addr: 0x7e0a01, value: 0x12 },
    ]);
    expect(steps[5]?.writes).toEqual([{ addr: 0x7e0a02, value: 0x56 }]);
    // Hand-checked: A low byte 56, hidden B still 12; N and Z from the 8-bit value $56.
    expect(regs(final)).toEqual({ a: 0x1256, x: 0, y: 0, s: 0x1fff, pc: 0x8010, p: 'nvMXdIzc' });
  });
});

describe('loop program', () => {
  test('runs the loop three times and returns from the subroutine', () => {
    expect(listing(LOOP_PROGRAM)).toEqual([
      '8000 SEP #$30',
      '8002 LDX #$03',
      '8004 LDA #$00',
      ...Array.from({ length: 3 }, () => ['8006 CLC', '8007 ADC #$05', '8009 DEX', '800a BNE $8006']).flat(),
      '800c STA $10',
      '800e JSR $8012',
      '8012 CLC',
      '8013 ADC $10',
      '8015 STA $11',
      '8017 RTS',
      '8011 STP',
    ]);
  });

  test('pushes the address of the last JSR byte, high byte first', () => {
    const mem = load(LOOP_PROGRAM);
    const { steps, final } = run(mem);
    const jsr = steps.find(s => s.instruction.op === 'JSR');
    expect(jsr?.writes).toEqual([
      { addr: 0x7e1fff, value: 0x80 },
      { addr: 0x7e1ffe, value: 0x10 },
    ]);
    expect(jsr?.state.s).toBe(0x1ffd);
    expect(mem.read(0x7e0010)).toBe(0x0f);
    expect(mem.read(0x7e0011)).toBe(0x1e);
    expect(regs(final)).toEqual({ a: 0x1e, x: 0, y: 0, s: 0x1fff, pc: 0x8012, p: 'nvMXdIzc' });
  });

  test('BNE falls through only when DEX reaches zero', () => {
    const mem = load(LOOP_PROGRAM);
    const { steps } = run(mem);
    const dex = steps.filter(s => s.instruction.op === 'DEX').map(s => [s.state.x, s.state.p & FLAG.Z]);
    expect(dex).toEqual([
      [2, 0],
      [1, 0],
      [0, FLAG.Z],
    ]);
  });
});

describe('copy program', () => {
  test('copies 16-bit codes until 0000', () => {
    const mem = load(COPY_PROGRAM);
    const { steps, final } = run(mem);
    expect(steps.map(s => s.instruction.text).slice(0, 8)).toEqual([
      'REP #$30',
      'LDX #$0000',
      'LDA $8012,X',
      'BEQ $8011',
      'STA $0A00,X',
      'INX',
      'INX',
      'BRA $8005',
    ]);
    expect([0, 1, 2, 3, 4, 5].map(i => mem.read(0x7e0a00 + i))).toEqual([0xf3, 0x08, 0xb5, 0x06, 0x27, 0x05]);
    // Three characters copied, then the zero word ends the loop with X pointing at it.
    expect(regs(final)).toEqual({ a: 0, x: 6, y: 0, s: 0x1fff, pc: 0x8012, p: 'nvmxdIZc' });
    expect(steps).toHaveLength(2 + 3 * 6 + 2 + 1);
  });
});

describe('instruction details', () => {
  const at = (code: number[], state: Partial<CpuState> = {}) => {
    const mem = new Memory({ 0x808000: code });
    return { mem, state: { ...startState(), ...state } };
  };

  test('SEP #$10 clears the high bytes of X and Y', () => {
    const { mem, state } = at([0xe2, 0x10], { x: 0x1234, y: 0xabcd, p: FLAG.I });
    expect(regs(step(state, mem).state)).toMatchObject({ x: 0x34, y: 0xcd });
  });

  test('TAX copies all of C when X is 16-bit, even with an 8-bit A', () => {
    const { mem, state } = at([0xaa], { a: 0x1234, p: FLAG.M | FLAG.I });
    expect(step(state, mem).state.x).toBe(0x1234);
  });

  test('TXA with 8-bit A keeps B', () => {
    const { mem, state } = at([0x8a], { a: 0xab00, x: 0x0012, p: FLAG.M | FLAG.X });
    expect(step(state, mem).state.a).toBe(0xab12);
  });

  test('CMP sets carry when A is greater or equal', () => {
    const { mem, state } = at([0xc9, 0x10]);
    expect(flagString(step({ ...state, a: 0x10 }, mem).state.p)).toBe('nvMXdIZC');
    expect(flagString(step({ ...state, a: 0x0f }, mem).state.p)).toBe('NvMXdIzc');
  });

  test('ADC sets overflow on signed overflow', () => {
    const { mem, state } = at([0x69, 0x01], { a: 0x7f });
    expect(flagString(step(state, mem).state.p)).toBe('NVMXdIzc');
  });

  test('the immediate operand of LDX grows with X = 0', () => {
    const mem = new Memory({ 0x808000: [0xa2, 0x00, 0x01] });
    expect(decode(mem, { pb: 0x80, pc: 0x8000, p: 0 }).text).toBe('LDX #$0100');
    expect(decode(mem, { pb: 0x80, pc: 0x8000, p: FLAG.X }).text).toBe('LDX #$00');
  });

  test('stores into ROM are ignored', () => {
    const { mem, state } = at([0x8d, 0x00, 0x90], { a: 0x55 });
    expect(step(state, mem).writes).toEqual([]);
    expect(mem.read(0x809000)).toBe(0);
  });

  test('low banks mirror the first 8KB of WRAM', () => {
    expect(normalize(0x800a00)).toBe(0x7e0a00);
    expect(normalize(0x001fff)).toBe(0x7e1fff);
    expect(normalize(0x802000)).toBe(0x802000);
    expect(normalize(0xc00a00)).toBe(0xc00a00);
  });

  test('unknown opcodes are refused', () => {
    const mem = new Memory({ 0x808000: [0x00] });
    expect(() => decode(mem, startState())).toThrow(/not part/);
  });

  test('every program stops', () => {
    for (const program of CPU_PROGRAMS) expect(run(load(program)).final.stopped).toBe(true);
  });
});
