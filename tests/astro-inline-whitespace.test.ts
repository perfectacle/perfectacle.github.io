import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

// Astro's HTML compression drops whitespace that holds a line break, so text that ends a line and an inline element
// that starts the next one render glued together ("자리는<a>"). Prettier wraps the same way, writing a kept space as
// {' '}. A break is only right where the words really join: after 「·」 or 「(」, or before a particle such as 「</code>입니다」.
const INLINE = '(?:a|code|strong|em|kbd|b|i|small|span|abbr)';
const TEXT_END = /[가-힣A-Za-z0-9.,)」』:;!?%]$/;
const INLINE_START = new RegExp(`^<${INLINE}\\b`);
const INLINE_END = new RegExp(`</${INLINE}>$`);
const TEXT_START = /^[가-힣A-Za-z0-9「『]/;
const PARTICLE = /^(?:은|는|이|가|을|를|의|로|으로|와|과|에|도|만|처럼|부터|입니다)/;

export const gluedBreaks = (source: string) => {
  const lines = source.split('\n');
  const found: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const a = (lines[i] ?? '').trimEnd();
    const b = (lines[i + 1] ?? '').trimStart();
    if ((TEXT_END.test(a) && INLINE_START.test(b)) || (INLINE_END.test(a) && TEXT_START.test(b) && !PARTICLE.test(b)))
      found.push(i + 1);
  }
  return found;
};

const astroFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? astroFiles(join(dir, e.name)) : e.name.endsWith('.astro') ? [join(dir, e.name)] : [],
  );

test('a line break never stands for the space between text and an inline element', () => {
  const root = join(import.meta.dirname, '..', 'src');
  const glued = astroFiles(root).flatMap(f =>
    gluedBreaks(readFileSync(f, 'utf8')).map(n => `${f.slice(root.length + 1)}:${n}`),
  );
  expect(glued).toEqual([]);
});

test('the check sees both sides of the element', () => {
  expect(gluedBreaks('남은 롬 자리는\n  <a href="#x">2절</a>에 있습니다.')).toEqual([1]);
  expect(gluedBreaks('<a href="#x">같은 뱅크 끝으로</a>\n옮겼습니다.')).toEqual([1]);
  expect(gluedBreaks('남은 롬 자리는{\' \'}\n  <a href="#x">2절</a>')).toEqual([]);
  expect(gluedBreaks('<p>\n  <a href="#x">2절</a>')).toEqual([]);
  expect(gluedBreaks('<code>$75</code>\n입니다.')).toEqual([]);
  expect(gluedBreaks('<code>$83:BB0A</code>·\n<code>$83:BADA</code>')).toEqual([]);
});
