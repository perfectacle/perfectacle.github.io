import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  BUTTONS,
  ScriptError,
  heldAt,
  parseScript,
  presses,
  pyInt,
  pyRepr,
  tapCount,
  tapFrames,
  type RunScript,
} from '../src/lib/run-script.ts';

interface Case {
  name: string;
  text: string;
  error?: string;
  script?: {
    end: number;
    presses: [number, number, number[]][];
    shots: number[];
    dumps: number[];
    pokes: [number, [number, number][]][];
  };
}

// Written by kr-patch-toolkit's own parser; see tests/fixtures/krpatch-run-scripts.py.
const CASES = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'fixtures/krpatch-run-scripts.json'), 'utf8'),
) as Case[];

const describeScript = (sc: RunScript) => {
  const frames = (kind: 'shot' | 'dump') => [...new Set(sc.commands.filter(c => c.kind === kind).map(c => c.frame))];
  const pokes = new Map<number, [number, number][]>();
  for (const c of sc.commands)
    if (c.kind === 'poke') pokes.set(c.frame, [...(pokes.get(c.frame) ?? []), [c.offset, c.value]]);
  return {
    end: sc.end,
    presses: presses(sc),
    shots: frames('shot').sort((a, b) => a - b),
    dumps: frames('dump').sort((a, b) => a - b),
    pokes: [...pokes].sort(([a], [b]) => a - b),
  };
};

describe('same result as the toolkit', () => {
  test('the fixture covers the toolkit tests and the corners', () => {
    expect(CASES.length).toBeGreaterThan(70);
    expect(CASES.filter(c => c.name.startsWith('toolkit:')).length).toBeGreaterThan(15);
    expect(CASES.filter(c => c.error).length).toBeGreaterThan(30);
  });

  test.each(CASES.map(c => [c.name, c] as const))('%s', (_, c) => {
    if (c.error !== undefined) {
      expect(() => parseScript(c.text)).toThrow(ScriptError);
      expect(() => parseScript(c.text)).toThrow(new RegExp(`^${c.error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    } else {
      expect(describeScript(parseScript(c.text))).toEqual(c.script);
    }
  });
});

describe('errors carry what the reader needs', () => {
  const error = (text: string) => {
    try {
      parseScript(text);
    } catch (e) {
      if (e instanceof ScriptError) return e;
    }
    throw new Error('no error');
  };

  test.each([
    ['10 jump 4\n20 end', 'button', 1, 'jump'],
    ['10 end\n20 shot', 'after-end', 2, '10'],
    ['10 shot', 'no-end', undefined, ''],
    ['10 poke 1FFFF 1\n20 end', 'wram', 1, '1FFFF'],
    ['10 poke zz 1\n20 end', 'number', 1, 'zz'],
    ['x shot\n20 end', 'number', 1, 'x'],
    ['5 shot\n10 tap a 0 20\n30 end', 'period', 2, '0'],
    ['5 shot\n10 tap a\n20 end', 'missing', 2, 'tap'],
    ['\n\n10\n20 end', 'expected', 3, '10'],
  ] as const)('%j', (text, kind, line, token) => {
    const e = error(text);
    expect([e.kind, e.line, e.token]).toEqual([kind, line, token]);
  });
});

describe('held buttons match the toolkit definition', () => {
  // Script.held: every press whose [first, stop) covers the frame.
  const brute = (sc: RunScript, f: number) =>
    [...new Set(presses(sc).flatMap(([a, b, ids]) => (a <= f && f < b ? ids : [])))].sort((x, y) => x - y);

  test.each(CASES.filter(c => c.script).map(c => [c.name, c.text] as const))('%s', (_, text) => {
    const sc = parseScript(text);
    for (let f = -10; f <= Math.min(sc.end + 10, 6000); f++) expect(heldAt(sc, f), `frame ${f}`).toEqual(brute(sc, f));
  });

  test('the toolkit test_held cases', () => {
    const sc = parseScript(CASES[0]?.text ?? '');
    expect(heldAt(sc, 499)).toEqual([]);
    expect(heldAt(sc, 500)).toEqual([BUTTONS.start]);
    expect(heldAt(sc, 503)).toEqual([BUTTONS.start]);
    expect(heldAt(sc, 504)).toEqual([]);
    expect(heldAt(sc, 801)).toEqual([BUTTONS.b, BUTTONS.a]);
  });

  test('taps with short or negative periods overlap like the toolkit', () => {
    for (const text of [
      '10 tap a 2 30\n40 end',
      '10 tap b 3 11\n40 end',
      '30 tap y -5 0\n40 end',
      '30 tap y -1 20\n40 end',
    ]) {
      const sc = parseScript(text);
      for (let f = -5; f < 45; f++) expect(heldAt(sc, f), `${text} @ ${f}`).toEqual(brute(sc, f));
    }
  });
});

test('tap counts without listing every press', () => {
  const tap = (text: string) => {
    const c = parseScript(text).commands[0];
    if (c?.kind !== 'tap') throw new Error('not a tap');
    return c;
  };
  for (const text of [
    '900 tap a 40 2000\n3000 end',
    '10 tap a 4 10\n20 end',
    '30 tap y -5 0\n40 end',
    '10 tap a 3 11\n20 end',
  ])
    expect(tapCount(tap(text))).toBe(tapFrames(tap(text)).length);
  expect(tapCount(tap('1 tap a 1 100000001\n100000001 end'))).toBe(100_000_000);
});

test("Python's int() and repr()", () => {
  expect(pyInt('1_000', 10)).toBe(1000n);
  expect(pyInt('0x_1f', 16)).toBe(31n);
  expect(pyInt('_1f', 16)).toBeUndefined();
  expect(pyInt('-0010', 16)).toBe(-16n);
  expect(pyInt('١٢', 10)).toBe(12n);
  expect(pyInt('𝟗', 10)).toBe(9n);
  expect(pyInt('', 10)).toBeUndefined();
  expect(pyRepr("it's")).toBe('"it\'s"');
  expect(pyRepr('a​b')).toBe("'a\\u200bb'");
  expect(pyRepr('\x07')).toBe("'\\x07'");
  expect(pyRepr('한글')).toBe("'한글'");
});
