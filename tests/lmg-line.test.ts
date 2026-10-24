import { expect, test } from 'vitest';
import {
  HANGUL_START,
  LINES,
  LINE_AT,
  charOf,
  encode,
  hangul,
  leBytes,
  shown,
  tokenize,
} from '../src/components/romhacking/lmg-line.ts';

// The two lines were read from the unpacked st01/st01_demo101 of each ROM with kr-patches' textcodec.
test('the Korean patch line reads as the patch shows it', () => {
  const tokens = tokenize(LINES.v12, w => charOf('v12', w), LINE_AT);
  expect(shown(tokens)).toBe('…………… ▶ 그래…그랬어． ▶ 생각났어．\n…당신에 대해．');
  expect(tokens[0]).toEqual({ at: 0x2e0, words: [0xff2d, 4, 0], kind: 'code', text: '대사 머리: 첫 값 4, 번호 0' });
  expect(tokens.at(-1)).toMatchObject({ at: 0x326, words: [0xfffe], text: '대사 끝' });
  expect(tokens.filter(t => t.kind === 'unknown')).toEqual([]);
});

test('the Japanese line uses the same control codes around its own glyphs', () => {
  const tokens = tokenize(LINES.jp, w => charOf('jp', w), LINE_AT);
  expect(shown(tokens)).toBe('…………… ▶ そうだ…そうだよ。 ▶ 思い出したわ。\n…あなたのコト。');
  const codes = (v: 'jp' | 'v12') =>
    tokenize(LINES[v], w => charOf(v, w))
      .filter(t => t.kind === 'code')
      .map(t => t.words);
  expect(codes('jp')).toEqual(codes('v12'));
  expect(LINES.jp.length * 2).toBe(80);
  expect(LINES.v12.length * 2).toBe(72);
});

test('Hangul follows KS X 1001 from 0x12C', () => {
  const h = hangul();
  expect(h).toHaveLength(2350);
  expect([h[0], h[1], h.at(-1)]).toEqual(['가', '각', '힝']);
  expect(HANGUL_START + h.length - 1).toBe(0xa59);
  expect(charOf('v12', 0x12d)).toBe('각');
  expect(charOf('v12', 0xff)).toBe(' ');
});

test('text in the patch notation encodes back to the same values', () => {
  const text = '{2D:4,0}{08:4}……………{02}그래…그랬어．{02}{0D:16}생각났어．{01}…당신에 대해．{FE}';
  expect(encode(text)).toEqual(LINES.v12);
  expect(encode('{2D:4,0}각{FE}')).toEqual([0xff2d, 4, 0, 0x12d, 0xfffe]);
  expect(encode('가\n나')).toEqual([0x12c, 0xff01, 0x24f]);
  expect(charOf('v12', 0x24f)).toBe('나');
  expect(() => encode('{2D:4}')).toThrow('{2D} 코드는 인수가 2개여야 합니다');
  expect(() => encode('漢')).toThrow('글자표에 없습니다');
  expect(() => encode('{01:3}')).toThrow('{01} 코드는 인수를 받지 않습니다');
  expect(leBytes(0xff2d)).toBe('2D FF');
});
