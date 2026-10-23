import { expect, test } from 'vitest';
import {
  APU_STEPS,
  formatPc,
  parseLine,
  portAddress,
  replay,
  stepReport,
} from '../src/components/romhacking/apu-log.ts';

test('log lines parse into frame, port, value and PC', () => {
  expect(parseLine('11 2140 CC pc=8380D4')).toEqual({ frame: 11, port: 0, value: 0xcc, pc: 0x8380d4 });
  expect(formatPc(0x8380d4)).toBe('$83:80D4');
  expect(() => parseLine('11 2144 CC pc=8380D4')).toThrow();
});

test('every written step is a well-formed line and frames never go back', () => {
  let frame = 0;
  for (const s of APU_STEPS) {
    expect(Boolean(s.line) !== Boolean(s.skip), s.title).toBe(true);
    if (!s.line) continue;
    const w = parseLine(s.line);
    expect(w.frame).toBeGreaterThanOrEqual(frame);
    frame = w.frame;
  }
});

// Values below are the port state the full apu-kakusei.txt reaches at the same lines.
test('replay follows the IPL upload: address $0800, then $1E00, then run at $0800', () => {
  const states = replay(APU_STEPS);
  const at = (line: string) => {
    const i = APU_STEPS.findIndex(s => s.line === line);
    const s = states[i];
    if (!s) throw new Error(line);
    return s;
  };
  expect(states[0]).toEqual([undefined, undefined, 0x00, undefined]);
  expect(portAddress(at('11 2143 08 pc=8380C0'))).toBe(0x0800);
  expect(at('11 2140 02 pc=8380F5')).toEqual([0x02, 0x7f, 0x00, 0x08]);
  expect(at('18 2140 23 pc=8380D4')).toEqual([0x23, 0x01, 0x00, 0x1e]);
  expect(portAddress(at('18 2140 23 pc=8380D4'))).toBe(0x1e00);
  expect(at('18 2140 0A pc=8380D4')).toEqual([0x0a, 0x00, 0x00, 0x08]);
  expect(at('150 2140 CC pc=8380D4')).toEqual([0xcc, 0x01, 0x00, 0x1e]);
  expect(at('187 2140 01 pc=83805C')).toEqual([0x01, 0x00, 0x00, 0xd7]);
});

test('each block kick is above the last byte number, as the IPL requires', () => {
  const states = replay(APU_STEPS);
  const kicks: [number, number][] = APU_STEPS.flatMap((s, i) =>
    s.line && /pc=8380D4$/.test(s.line) && i > 0
      ? [[states[i - 1]?.[0] ?? 0, states[i]?.[0] ?? 0] as [number, number]]
      : [],
  );
  // Byte numbers 20 → kick 23, 07 → kick 0A; the first kick of an upload is CC.
  expect(kicks).toContainEqual([0x20, 0x23]);
  expect(kicks).toContainEqual([0x07, 0x0a]);
  for (const [last, kick] of kicks) if (kick !== 0xcc) expect(kick).toBeGreaterThan(last + 1);
});

test('the live report names the step, the port and what the CPU waits for', () => {
  const i = APU_STEPS.findIndex(s => s.line === '11 2140 CC pc=8380D4');
  const step = APU_STEPS[i];
  if (!step) throw new Error('missing step');
  expect(stepReport(step, i, APU_STEPS.length)).toBe(
    `${i + 1}/${APU_STEPS.length}단계, 올리기. 11프레임, $2140에 CC. 시작 신호 CC. 기다림: $2140을 읽어 CC가 돌아올 때까지.`,
  );
  const skip = APU_STEPS.find(s => s.skip);
  if (!skip) throw new Error('no skip');
  expect(stepReport(skip, 0, 1)).toContain('8,718줄을 건너뜁니다');
});
