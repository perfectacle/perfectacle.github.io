import { describe, expect, it } from 'vitest';
import { excerpt, pagePath, paginate, ymd, type Post } from '../src/lib/posts.ts';

const post = (body: string) => ({ body }) as Post;

describe('paginate', () => {
  it('splits into pages of 10 like Hexo', () => {
    const pages = paginate(Array.from({ length: 222 }, (_, i) => i));
    expect(pages).toHaveLength(23);
    expect(pages.at(-1)).toHaveLength(2);
  });

  it('returns one empty page for no items', () => {
    expect(paginate([])).toEqual([[]]);
  });
});

describe('pagePath', () => {
  it('uses Hexo page/N/ paths with page 1 at the base', () => {
    expect(pagePath('/tags/JS/', 1)).toBe('/tags/JS/');
    expect(pagePath('/tags/JS/', 3)).toBe('/tags/JS/page/3/');
  });
});

describe('ymd', () => {
  it('reads the written date regardless of the machine time zone', () => {
    expect(ymd(new Date('2016-12-25T23:59:59Z'))).toEqual({ y: '2016', m: '12', d: '25' });
  });
});

describe('excerpt', () => {
  it('skips images, headings and code to find the first real paragraph', () => {
    const body =
      '![](./thumb.png)\n\n## 들어가며\n\n```js\nconst a = 1;\n```\n\n[TDZ](../../2016/ES6-Scope/index.md)에 대한 **정리**다.';
    expect(excerpt(post(body))).toBe('TDZ에 대한 정리다.');
  });

  it('truncates long paragraphs', () => {
    const text = excerpt(post('가'.repeat(300)), 100);
    expect(text).toHaveLength(101);
    expect(text.endsWith('…')).toBe(true);
  });
});
