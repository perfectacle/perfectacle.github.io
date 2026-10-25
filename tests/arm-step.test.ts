import { expect, test } from 'vitest';
import { OBJECT_AT, PROGRAM, decode, run, start, step } from '../src/components/romhacking/arm-step.ts';

// The listing matches capstone's disassembly of the unpacked Ghost Trick (J) ARM9 program at 0x02012BA0.
test('the function decodes to the same eleven instructions as a real disassembler', () => {
  expect(PROGRAM.map(i => i.text)).toEqual([
    'mov r2, #0x4',
    'str r2, [r0, #0x4]',
    'cmp r1, #0x3',
    'ldrlt r2, [pc, #0x1C]',
    'strlt r1, [r0, #0x4]',
    'ldrlt r1, [r2, r1, lsl #3]',
    'strlt r1, [r0, #0x14]',
    'ldr r0, [r0, #0x4]',
    'cmp r0, #0x4',
    'moveq r0, #0x0',
    'movne r0, #0x1',
    'bx lr',
    '.word 0x020A6EB0',
  ]);
});

test('a font number below 3 picks that font’s file name from the table and returns 1', () => {
  const steps = run(1);
  expect(steps.every(s => s.ran || ['eq'].includes(s.instr.cond))).toBe(true);
  const last = steps.at(-1)?.state;
  expect(last?.r[0]).toBe(1);
  expect(last?.mem.get(OBJECT_AT + 4)).toBe(1);
  expect(last?.mem.get(OBJECT_AT + 0x14)).toBe(0x020a6e88);
  expect(steps[3]?.text).toContain('= 0x020A6EB0');
  expect(steps[5]?.text).toContain('balloon_font.imb의 주소');
  expect(last?.pc).toBe(0x020125ec);
});

test('font number 3 or more skips the lt instructions and returns 0', () => {
  const steps = run(3);
  expect(steps.filter(s => !s.ran).map(s => s.instr.cond)).toEqual(['lt', 'lt', 'lt', 'lt', 'ne']);
  expect(steps.at(-1)?.state.r[0]).toBe(0);
  expect(steps.at(-1)?.state.mem.get(OBJECT_AT + 0x14)).toBeUndefined();
});

test('cmp sets the flags that lt reads, and step never changes its input', () => {
  const s0 = start(0);
  const after = step(step(step(s0).state).state).state;
  expect(after.flags).toEqual({ n: true, z: false, c: false, v: false });
  expect(s0.r[2]).toBe(0);
  expect(decode(0xe12fff1e, 0).text).toBe('bx lr');
});
