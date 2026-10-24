import { expect, test } from 'vitest';
import { GLOSSARY, termHref, termId } from '../src/components/romhacking/glossary.ts';
import { processGuideHtml, termNames } from '../src/components/romhacking/guide-html.ts';

const entry = (term: string) => {
  const e = GLOSSARY.find(x => x.term === term);
  if (!e) throw new Error(term);
  return e;
};
const links = (html: string) => [...html.matchAll(/<a class="term" href="([^"]+)">([^<]*)<\/a>/g)].map(m => m[2]);

test('glossary anchors are unique', () => {
  expect(new Set(GLOSSARY.map(termId)).size).toBe(GLOSSARY.length);
  expect(termHref(entry('롬'))).toBe('/games/romhacking/glossary/#term-롬');
});

test('the outline lists h2 and h3, drops badges and gives h3 without an id one', () => {
  const { headings, html } = processGuideHtml(
    '<h2 id="table">글자표 <span class="layer-badge">쉽게</span></h2><h3>포인터가 코드 안에 있을 때</h3>' +
      '<details><h3>접힌 곳</h3></details><section class="widget"><h3 id="w">위젯</h3></section><h3 id="table-1">끝</h3>',
  );
  expect(headings).toEqual([
    { depth: 2, id: 'table', text: '글자표' },
    { depth: 3, id: '포인터가-코드-안에-있을-때', text: '포인터가 코드 안에 있을 때' },
    { depth: 3, id: 'table-1', text: '끝' },
  ]);
  expect(html).toContain('<h3 id="포인터가-코드-안에-있을-때">');
});

test('a generated id never collides with an id already on the page', () => {
  const { headings } = processGuideHtml('<h3>try</h3><p id="try">x</p>');
  expect(headings[0]?.id).toBe('try-1');
});

test('each term links once per h2 section, longest name first', () => {
  const { html, terms } = processGuideHtml(
    '<p>포인터 표는 포인터를 모은 표입니다. 포인터 표를 다시 봅니다.</p><h2 id="b">다음</h2><p>포인터 표와 롬</p>',
  );
  expect(links(html)).toEqual(['포인터 표', '포인터', '포인터 표', '롬']);
  expect(html).toContain(`href="${termHref(entry('포인터 표'))}"`);
  expect(terms.map(e => e.term).sort()).toEqual(['롬', '포인터', '포인터 표']);
});

test('terms inside headings, code, links, widgets, figures and summaries stay as they are', () => {
  const { html } = processGuideHtml(
    '<h2 id="a">롬</h2><p><code>롬</code> <a href="/x/">롬</a></p><figure><figcaption>롬</figcaption></figure>' +
      '<section class="widget"><p>롬</p></section><details><summary>롬</summary></details><pre>롬</pre>',
  );
  expect(links(html)).toEqual([]);
});

test('names match whole words only', () => {
  // 「패치」 inside 「한글패치」, 「PC」 inside 「SPC」, 「CPU」 inside 「S-CPU」 and 「롬」 inside 「프롬프트」 are not terms.
  const { html } = processGuideHtml('<p>프롬프트, SPC, S-CPU, 한글패치</p>');
  expect(links(html)).toEqual(['S-CPU', '한글패치']);
  // Korean particles may follow a term.
  expect(links(processGuideHtml('<p>롬은 크다</p>').html)).toEqual(['롬']);
});

test('ambiguous bases and plain English originals are not names', () => {
  const names = new Set(termNames().map(n => n.name));
  expect(names.has('덤프')).toBe(false);
  expect(names.has('레지스터')).toBe(false);
  expect(names.has('mask')).toBe(false);
  expect(names.has('샘플')).toBe(true);
  expect(names.has('JSL')).toBe(true);
  expect(names.has('ROM')).toBe(true);
});
