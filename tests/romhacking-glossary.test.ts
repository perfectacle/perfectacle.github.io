import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { chapterPath } from '../src/components/romhacking/chapters.ts';
import { GLOSSARY, INITIALS, glossaryGroups, initialId, initialOf } from '../src/components/romhacking/glossary.ts';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, 'src/pages', `.${path.replace(/\/$/, '')}.astro`), 'utf8');

test('every term points at a written chapter and a section id that page declares', () => {
  for (const e of GLOSSARY) {
    expect(e.chapter.ready, e.term).toBe(true);
    const page = source(chapterPath(e.chapter));
    expect(page.includes(`id: '${e.anchor}'`) || page.includes(`id="${e.anchor}"`), `${e.term} → #${e.anchor}`).toBe(
      true,
    );
  }
});

test('terms are unique and in Korean order', () => {
  const terms = GLOSSARY.map(e => e.term);
  expect(new Set(terms).size).toBe(terms.length);
  expect(terms).toEqual([...terms].sort(new Intl.Collator('ko').compare));
  expect(GLOSSARY.length).toBeGreaterThan(150);
});

test('initial consonants fold double consonants and send Latin and digits last', () => {
  expect(initialOf('까치')).toBe('ㄱ');
  expect(initialOf('뱅크')).toBe('ㅂ');
  expect(initialOf('쓰기')).toBe('ㅅ');
  expect(initialOf('LoROM')).toBe('영문·숫자');
  expect(initialOf('65c816')).toBe('영문·숫자');
  const groups = glossaryGroups();
  expect(groups.at(-1)?.initial).toBe('영문·숫자');
  expect(groups.map(g => g.initial)).toEqual(INITIALS.filter(i => groups.some(g => g.initial === i)));
  expect(groups.flatMap(g => g.entries)).toHaveLength(GLOSSARY.length);
  expect(new Set(INITIALS.map(initialId)).size).toBe(INITIALS.length);
});
