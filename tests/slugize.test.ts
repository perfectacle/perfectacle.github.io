import { describe, expect, it } from 'vitest';
import { slugize } from '../src/lib/slugize.ts';

// Expected values are the URLs the Hexo build published (tests/fixtures/legacy-paths.txt).
describe('slugize', () => {
  it.each([
    ['Node.js', 'Node-js'],
    ['Spring Boot', 'Spring-Boot'],
    ['ES2015+', 'ES2015'],
    ['자알쓰', '자알쓰'],
    ['기타', '기타'],
    ['C++', 'C'],
    ['  --a  b--  ', 'a-b'],
    ['Café', 'Cafe'],
  ])('%s -> %s', (input, expected) => {
    expect(slugize(input)).toBe(expected);
  });

  it('keeps case so Babel and babel stay separate tags', () => {
    expect(slugize('Babel')).not.toBe(slugize('babel'));
  });
});
