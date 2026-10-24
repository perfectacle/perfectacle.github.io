/**
 * Input scripts of `krpatch sfc run`, ported from kr-patch-toolkit (`kr_patch/sfc/script.py`) so the guide's script
 * reader accepts and rejects exactly what the toolkit does. Error messages are the toolkit's own, word for word, and
 * `tests/run-script.test.ts` checks every case in `tests/fixtures/krpatch-run-scripts.json`, which the toolkit's parser
 * produced.
 *
 * One command per line, frames counted from power-on:
 *
 *     F button[+button] LEN       hold buttons for LEN frames
 *     F tap button PERIOD UNTIL   4-frame presses every PERIOD frames until frame UNTIL
 *     F shot | F dump             screenshot / WRAM and SRAM dump after frame F
 *     F poke ADDR VALUE           16-bit WRAM write after frame F (hex)
 *     F end                       stop after frame F (required)
 *
 * Numbers follow Python's int(): decimal frames, hex addresses and values, `_` between digits, an optional sign. That is
 * why the parser keeps BigInt until a value is known to be small.
 */

export const BUTTONS = {
  b: 0,
  y: 1,
  select: 2,
  start: 3,
  up: 4,
  down: 5,
  left: 6,
  right: 7,
  a: 8,
  x: 9,
  l: 10,
  r: 11,
} as const;
export const BUTTON_NAMES = Object.keys(BUTTONS) as (keyof typeof BUTTONS)[];
export const TAP_LEN = 4;
export const WRAM_SIZE = 0x20000;
export const POKE_SIZE = 2;

export type ScriptCommand =
  | { kind: 'press'; line: number; frame: number; length: number; buttons: number[] }
  | { kind: 'tap'; line: number; frame: number; period: number; until: number; buttons: number[] }
  | { kind: 'shot' | 'dump' | 'end'; line: number; frame: number }
  | { kind: 'poke'; line: number; frame: number; offset: number; value: number };

export interface RunScript {
  /** Every command in file order, `end` lines included. */
  commands: ScriptCommand[];
  /** The frame of the last `end` line; the toolkit keeps the last one. */
  end: number;
}

export type ScriptErrorKind = 'expected' | 'button' | 'missing' | 'number' | 'wram' | 'period' | 'no-end' | 'after-end';

export class ScriptError extends Error {
  readonly kind: ScriptErrorKind;
  /** 1-based line the error is about, even when the toolkit's message leaves it out. */
  readonly line: number | undefined;
  /** The word or number the error is about. */
  readonly token: string;

  constructor(message: string, kind: ScriptErrorKind, line: number | undefined, token = '') {
    super(message);
    this.kind = kind;
    this.line = line;
    this.token = token;
  }
}

// Python's str.split() and str.strip() whitespace.
const PY_SPACE = '\\t-\\r\\x1c-\\x20\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000';
const SPACE_RUN = new RegExp(`[${PY_SPACE}]+`, 'u');
const EDGE_SPACE = new RegExp(`^[${PY_SPACE}]+|[${PY_SPACE}]+$`, 'gu');
const words = (line: string) => line.split(SPACE_RUN).filter(Boolean);

const DECIMAL_DIGIT = /\p{Nd}/u;
/** Unicode decimal digits come in runs of ten from 0 to 9, so a digit's value is its place in its run. */
function digitValue(ch: string): number {
  let cp = ch.codePointAt(0) ?? 0;
  let k = 0;
  while (DECIMAL_DIGIT.test(String.fromCodePoint(cp - 1))) {
    cp--;
    k++;
  }
  return k % 10;
}

const NON_PRINTABLE = /[\p{C}\p{Z}]/u;
/** Python's repr() of a str. */
export function pyRepr(s: string): string {
  const quote = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = quote;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === quote || ch === '\\') out += `\\${ch}`;
    else if (ch === '\t') out += '\\t';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch !== ' ' && NON_PRINTABLE.test(ch)) {
      const hex = cp.toString(16);
      out +=
        cp < 0x100
          ? `\\x${hex.padStart(2, '0')}`
          : cp < 0x10000
            ? `\\u${hex.padStart(4, '0')}`
            : `\\U${hex.padStart(8, '0')}`;
    } else out += ch;
  }
  return out + quote;
}

/** Python's int(s, base) for base 10 or 16, or undefined where Python raises. */
export function pyInt(s: string, base: 10 | 16): bigint | undefined {
  let t = [...s.replace(EDGE_SPACE, '')].map(ch => (DECIMAL_DIGIT.test(ch) ? String(digitValue(ch)) : ch)).join('');
  let negative = false;
  if (t[0] === '+' || t[0] === '-') {
    negative = t[0] === '-';
    t = t.slice(1);
  }
  let digits: RegExp;
  if (base === 16) {
    const prefixed = /^0[xX]/.test(t);
    if (prefixed) t = t.slice(2);
    digits = prefixed ? /^_?[0-9a-fA-F]+(?:_[0-9a-fA-F]+)*$/ : /^[0-9a-fA-F]+(?:_[0-9a-fA-F]+)*$/;
  } else digits = /^[0-9]+(?:_[0-9]+)*$/;
  if (!digits.test(t)) return undefined;
  const v = BigInt((base === 16 ? '0x' : '') + t.replaceAll('_', ''));
  return negative ? -v : v;
}

const MAX_REPR = 200;
function int(s: string, base: 10 | 16, line: number): bigint {
  const v = pyInt(s, base);
  if (v === undefined)
    // CPython formats this message with %.200R, which cuts the repr after 200 characters.
    throw new ScriptError(
      `invalid literal for int() with base ${base}: ${pyRepr(s).slice(0, MAX_REPR)}`,
      'number',
      line,
      s,
    );
  return v;
}

const hexUpper = (v: bigint) => (v < 0n ? `-${(-v).toString(16)}` : v.toString(16)).toUpperCase();

/** WRAM offset of a $7E/$7F address or offset, checked so `size` bytes fit. The toolkit's `wram_offset`. */
function wramOffset(a: bigint, size: number): bigint {
  if (a >= 0x7e0000n && a <= 0x7fffffn) a -= 0x7e0000n;
  if (a + BigInt(size) > BigInt(WRAM_SIZE)) throw new Error(`$${hexUpper(a)} + ${size} bytes is outside WRAM`);
  return a;
}

function buttons(spec: string, n: number): number[] {
  const ids = new Set<number>();
  for (const b of spec.toLowerCase().split('+')) {
    if (!Object.hasOwn(BUTTONS, b)) throw new ScriptError(`line ${n}: unknown button ${pyRepr(b)}`, 'button', n, b);
    ids.add(BUTTONS[b as keyof typeof BUTTONS]);
  }
  return [...ids].sort((x, y) => x - y);
}

/** Parses a script the way `kr_patch.sfc.script.parse` does, throwing ScriptError with the toolkit's message. */
export function parseScript(text: string): RunScript {
  const commands: ScriptCommand[] = [];
  let end: bigint | undefined;
  const frames: [bigint, number][] = [];
  // Reading a text file in Python splits lines at \n, \r\n and \r.
  text.split(/\r\n|\r|\n/).forEach((line, i) => {
    const n = i + 1;
    const p = words(line);
    if (p.length === 0 || p[0]?.startsWith('#')) return;
    if (p.length < 2) {
      const stripped = line.replace(EDGE_SPACE, '');
      throw new ScriptError(`line ${n}: expected 'frame command ...': ${pyRepr(stripped)}`, 'expected', n, stripped);
    }
    const f = int(p[0] ?? '', 10, n);
    const cmd = (p[1] ?? '').toLowerCase();
    const frame = Number(f);
    const arg = (k: number) => {
      const v = p[k];
      if (v === undefined) throw new ScriptError(`line ${n}: missing argument for ${pyRepr(cmd)}`, 'missing', n, cmd);
      return v;
    };
    if (cmd === 'end') {
      end = f;
      commands.push({ kind: 'end', line: n, frame });
      return;
    }
    if (cmd === 'shot' || cmd === 'dump') commands.push({ kind: cmd, line: n, frame });
    else if (cmd === 'tap') {
      const btn = buttons(arg(2), n);
      // range(f, int(p[4]), int(p[3])): Python reads UNTIL before PERIOD.
      const until = int(arg(4), 10, n);
      const period = int(arg(3), 10, n);
      if (period === 0n) throw new ScriptError('range() arg 3 must not be zero', 'period', n, arg(3));
      commands.push({ kind: 'tap', line: n, frame, period: Number(period), until: Number(until), buttons: btn });
    } else if (cmd === 'poke') {
      let offset: bigint;
      try {
        offset = wramOffset(int(arg(2), 16, n), POKE_SIZE);
      } catch (e) {
        if (e instanceof ScriptError && e.kind === 'missing') throw e;
        const message = e instanceof Error ? e.message : String(e);
        throw new ScriptError(`line ${n}: ${message}`, e instanceof ScriptError ? e.kind : 'wram', n, arg(2));
      }
      const value = Number(int(arg(3), 16, n) & 0xffffn);
      commands.push({ kind: 'poke', line: n, frame, offset: Number(offset), value });
    } else {
      const length = int(arg(2), 10, n);
      commands.push({ kind: 'press', line: n, frame, length: Number(length), buttons: buttons(cmd, n) });
    }
    frames.push([f, n]);
  });
  if (end === undefined) throw new ScriptError("script has no 'end' command", 'no-end', undefined);
  const last = end;
  const late = frames.find(([f]) => f > last);
  if (late)
    throw new ScriptError(`line ${late[1]}: frame is after 'end' at frame ${last}`, 'after-end', late[1], String(last));
  return { commands, end: Number(end) };
}

/** Frames a tap command presses on: range(frame, until, period). */
export function tapFrames(c: Extract<ScriptCommand, { kind: 'tap' }>): number[] {
  const out: number[] = [];
  if (c.period > 0) for (let t = c.frame; t < c.until; t += c.period) out.push(t);
  else for (let t = c.frame; t > c.until; t += c.period) out.push(t);
  return out;
}

/** How many presses a tap makes, without listing them. */
export function tapCount(c: Extract<ScriptCommand, { kind: 'tap' }>): number {
  const span = c.period > 0 ? c.until - c.frame : c.frame - c.until;
  return span > 0 ? Math.ceil(span / Math.abs(c.period)) : 0;
}

/** Every press as [first frame, frame after the last, button ids], in the toolkit's order. */
export function presses(script: RunScript): [number, number, number[]][] {
  const out: [number, number, number[]][] = [];
  for (const c of script.commands) {
    if (c.kind === 'press') out.push([c.frame, c.frame + c.length, c.buttons]);
    if (c.kind === 'tap') for (const t of tapFrames(c)) out.push([t, t + TAP_LEN, c.buttons]);
  }
  return out;
}

/** Buttons held during a frame: the toolkit's `Script.held`. */
export function heldAt(script: RunScript, frame: number): number[] {
  const held = new Set<number>();
  const hold = (ids: number[]) => ids.forEach(b => held.add(b));
  for (const c of script.commands) {
    if (c.kind === 'press' && c.frame <= frame && frame < c.frame + c.length) hold(c.buttons);
    if (c.kind !== 'tap') continue;
    // Presses start at frame + k * period (k >= 0) while they are short of `until`; only the ones that started in the
    // last TAP_LEN frames can be down now.
    const s = c.period;
    const first = s > 0 ? Math.ceil((frame - TAP_LEN + 1 - c.frame) / s) : Math.ceil((c.frame - frame) / -s);
    for (let k = Math.max(0, first); ; k++) {
      const t = c.frame + k * s;
      if (s > 0 ? t > frame : t <= frame - TAP_LEN) break;
      if (t <= frame && t > frame - TAP_LEN && (s > 0 ? t < c.until : t > c.until)) hold(c.buttons);
    }
  }
  return [...held].sort((x, y) => x - y);
}
