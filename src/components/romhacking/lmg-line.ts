import line from './ghost-trick-line.json';

/**
 * Ghost Trick dialogue as 2-byte values: glyph numbers below 0xFF00, control codes FFxx with a fixed number of
 * arguments. `ghost-trick-line.json` holds the first line of the chapter 1 opening cutscene
 * (st01/st01_demo101_Expand.xml.lz, unpacked offset 0x2E0) from the Japanese ROM and from the Korean patch v1.2,
 * the Japanese glyphs it uses and the glyphs below 0x12C that both tables share.
 */

/** Arguments after each control code, from kr-patches nds/ghost-trick/tools/textcodec.py. */
export const ARGS: Record<number, number> = {
  0x2d: 2,
  0x05: 1,
  0x08: 1,
  0x0c: 1,
  0x0d: 1,
  0x0e: 1,
  0x10: 2,
  0x15: 1,
  0x19: 1,
  0x1b: 1,
  0x1c: 1,
  0x1d: 3,
  0x1e: 1,
  0x20: 1,
  0x22: 1,
  0x24: 1,
  0x25: 1,
  0x27: 2,
  0x28: 2,
  0x2b: 1,
  0x2c: 1,
  0x2e: 1,
};

export const HANGUL_START = 0x12c;
export const LINE_AT = line.at;
export const POINTER_AT = line.pointerAt;
export type Version = 'jp' | 'v12';
export const LINES: Record<Version, number[]> = { jp: line.jp, v12: line.v12 };

const hex4 = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');
export const word = hex4;
/** A value as the file stores it: low byte first. */
export const leBytes = (w: number) =>
  `${(w & 0xff).toString(16).toUpperCase().padStart(2, '0')} ${(w >> 8).toString(16).toUpperCase().padStart(2, '0')}`;

const low = new Map(Object.entries(line.low).map(([k, c]) => [parseInt(k, 16), c]));
const jpChars = new Map(Object.entries(line.jpChars).map(([k, c]) => [parseInt(k, 16), c]));

/** The 2,350 Hangul syllables of KS X 1001 in table order, which the patch's glyph table follows from 0x12C. */
export function hangul(): string[] {
  const dec = new TextDecoder('euc-kr');
  const out: string[] = [];
  for (let a = 0xb0; a <= 0xc8; a++) for (let b = 0xa1; b <= 0xfe; b++) out.push(dec.decode(new Uint8Array([a, b])));
  return out;
}

let koTable: Map<number, string> | undefined;
/** The Korean patch's glyph table: the shared low part, a half-width space at 0xFF, then Hangul. */
function ko(): Map<number, string> {
  if (!koTable) {
    koTable = new Map(low);
    koTable.set(0xff, ' ');
    hangul().forEach((c, i) => koTable?.set(HANGUL_START + i, c));
  }
  return koTable;
}

export const charOf = (v: Version, w: number) => (v === 'jp' ? (jpChars.get(w) ?? low.get(w)) : ko().get(w));

const hexArg = (n = 0) => (n < 10 ? String(n) : `0x${n.toString(16).toUpperCase()}`);

const CODE_LABEL: Record<number, (a: number[]) => string> = {
  0x2d: a => `대사 머리: 첫 값 ${hexArg(a[0])}, 번호 ${hexArg(a[1])}`,
  0x08: a => `말하는 인물 ${hexArg(a[0])}`,
  0x05: a => `글자색 ${hexArg(a[0])}`,
  0x02: () => '창을 비우고 다음 창으로',
  0x01: () => '줄바꿈',
  0xfe: () => '대사 끝',
};

export interface Token {
  /** Byte offset in the unpacked file. */
  at: number;
  words: number[];
  kind: 'char' | 'code' | 'unknown';
  /** The glyph, or what the control code does. */
  text: string;
}

export function tokenize(words: number[], glyph: (w: number) => string | undefined, at = 0): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < words.length;) {
    const w = words[i] ?? 0;
    if (w >= 0xff00) {
      const code = w & 0xff;
      const args = words.slice(i + 1, i + 1 + (ARGS[code] ?? 0));
      const label = CODE_LABEL[code];
      out.push({
        at: at + i * 2,
        words: [w, ...args],
        kind: 'code',
        text: label ? label(args) : `제어 코드 ${hex4(w).slice(2)}${args.length ? `, 인수 ${args.length}개` : ''}`,
      });
      i += 1 + args.length;
    } else {
      const c = glyph(w);
      out.push({ at: at + i * 2, words: [w], kind: c ? 'char' : 'unknown', text: c ?? '글자표에 없는 값' });
      i++;
    }
  }
  return out;
}

/** What the player reads: glyphs only, a line break for FF01 and ▶ where FF02 starts a new window. */
export const shown = (tokens: Token[]) =>
  tokens
    .map(t => (t.kind === 'char' ? t.text : t.words[0] === 0xff01 ? '\n' : t.words[0] === 0xff02 ? ' ▶ ' : ''))
    .join('')
    .replace(/^ ▶ | ▶ $/g, '')
    .replace(/\n+$/, '');

let reverse: Map<string, number> | undefined;
const TOKEN = /\{([0-9A-Fa-f]{2})(?::([0-9A-Fa-f,]+))?\}|([\s\S])/gu;

/** Text in the patch's notation ({XX} or {XX:a,b} for control codes) to 2-byte values. */
export function encode(text: string): number[] {
  if (!reverse) {
    reverse = new Map();
    for (const [w, c] of [...ko()].sort((a, b) => a[0] - b[0])) if (!reverse.has(c)) reverse.set(c, w);
  }
  const out: number[] = [];
  for (const m of text.matchAll(TOKEN)) {
    const [, code, args, ch] = m;
    if (code) {
      const c = parseInt(code, 16);
      const list = args ? args.split(',').map(a => parseInt(a, 16)) : [];
      const want = ARGS[c] ?? 0;
      if (list.length !== want)
        throw new Error(
          want
            ? `{${code.toUpperCase()}} 코드는 인수가 ${want}개여야 합니다.`
            : `{${code.toUpperCase()}} 코드는 인수를 받지 않습니다.`,
        );
      out.push(0xff00 | c, ...list);
    } else if (ch === '\n') out.push(0xff01);
    else {
      const w = ch === undefined ? undefined : reverse.get(ch);
      if (w === undefined) throw new Error(`「${ch ?? ''}」 글자는 글자표에 없습니다.`);
      out.push(w);
    }
  }
  return out;
}
