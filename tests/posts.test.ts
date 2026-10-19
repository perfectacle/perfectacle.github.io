import { describe, expect, it } from 'vitest';
import {
  byPostCount,
  coverImage,
  excerpt,
  pagePath,
  paginate,
  relatedPosts,
  seriesOf,
  ymd,
  type Post,
} from '../src/lib/posts.ts';

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

  it('keeps tildes and underscores that are not markdown syntax', () => {
    expect(excerpt(post('1~2년 전에 쓴 snake_case 변수 이야기를 다시 꺼내 본다.'))).toBe(
      '1~2년 전에 쓴 snake_case 변수 이야기를 다시 꺼내 본다.',
    );
  });

  it('truncates long paragraphs', () => {
    const text = excerpt(post('가'.repeat(300)), 100);
    expect(text).toHaveLength(101);
    expect(text.endsWith('…')).toBe(true);
  });
});

describe('coverImage', () => {
  const withData = (body: string, image?: string) => ({ body, data: { image } }) as unknown as Post;

  it('prefers the frontmatter image', () => {
    expect(coverImage(withData('![](./first.webp)', './thumb.webp'))).toBe('thumb.webp');
  });

  it('falls back to the first image in the body, or nothing', () => {
    expect(coverImage(withData('글\n\n![설명](./a/first.webp)\n\n![](./second.webp)'))).toBe('a/first.webp');
    expect(coverImage(withData('이미지 없는 글'))).toBeUndefined();
  });
});

describe('relatedPosts', () => {
  const p = (id: string, date: string, categories: string[], tags: string[] = []) =>
    ({ id, data: { date: new Date(date), categories, tags } }) as unknown as Post;
  const me = p('me', '2022-06-06', ['설계', '테스트'], ['TDD', 'mock']);
  const sameSub = p('sameSub', '2020-01-01', ['설계', '테스트']);
  const sharedTag = p('sharedTag', '2022-06-01', ['Java'], ['TDD']);
  const topOnly = p('topOnly', '2022-06-05', ['설계', '패턴']);
  const unrelated = p('unrelated', '2022-06-06', ['일상']);
  const all = [me, sameSub, sharedTag, topOnly, unrelated];

  it('ranks deeper category matches and shared tags, and drops loose matches', () => {
    expect(relatedPosts(me, all).map(x => x.id)).toEqual(['sameSub', 'sharedTag']);
  });

  it('breaks ties by closeness in date and honours exclude and limit', () => {
    const near = p('near', '2022-05-01', ['설계', '테스트']);
    expect(relatedPosts(me, [...all, near]).map(x => x.id)).toEqual(['near', 'sameSub', 'sharedTag']);
    expect(relatedPosts(me, [...all, near], { exclude: [near], limit: 1 }).map(x => x.id)).toEqual(['sameSub']);
  });
});

describe('seriesOf', () => {
  const p = (title: string, date: string, series?: string, id = title, seriesOrder?: number) =>
    ({ id, data: { title, date: new Date(date), series, seriesOrder, categories: [], tags: [] } }) as unknown as Post;
  const part2 = p('2편', '2021-12-31T14:00:00Z', '여행', '2021/trip-2');
  const part1 = p('1편', '2021-12-31T14:00:00Z', '여행', '2021/trip-1');
  const part3 = p('3편', '2022-01-02T00:00:00Z', '여행');
  const other = p('다른 시리즈', '2021-12-30T00:00:00Z', '자바');
  const single = p('단독 글', '2021-12-30T00:00:00Z');
  const all = [part3, other, part2, single, part1];

  it('orders the series by date, then id, and locates the post', () => {
    const s = seriesOf(part2, all);
    expect(s?.name).toBe('여행');
    expect(s?.posts.map(x => x.data.title)).toEqual(['1편', '2편', '3편']);
    expect(s?.index).toBe(1);
  });

  it('compares same-date ids numerically, not by title', () => {
    const day16 = p('015일차 (다시)', '2017-08-04T00:00:00Z', '정석', '2017/java-study-016day');
    const day14 = p('014일차', '2017-08-04T00:00:00Z', '정석', '2017/java-study-014day');
    const day9 = p('009일차', '2017-08-04T00:00:00Z', '정석', '2017/java-study-9day');
    expect(seriesOf(day14, [day16, day14, day9])?.posts.map(x => x.id)).toEqual([
      '2017/java-study-9day',
      '2017/java-study-014day',
      '2017/java-study-016day',
    ]);
  });

  it('follows seriesOrder over dates, and puts parts without one last', () => {
    // 함수형 JS: the introduction (00편) was written after parts 01–06.
    const intro = p('00편', '2017-06-30T00:00:00Z', 'FP', 'fp-00', 1);
    const filter = p('02편', '2017-06-26T00:00:00Z', 'FP', 'fp-02', 3);
    const why = p('01편', '2017-06-26T00:00:00Z', 'FP', 'fp-01', 2);
    const extra = p('번외', '2017-01-01T00:00:00Z', 'FP', 'fp-extra');
    expect(seriesOf(why, [extra, filter, intro, why])?.posts.map(x => x.data.title)).toEqual([
      '00편',
      '01편',
      '02편',
      '번외',
    ]);
  });

  it('is undefined for a post outside any series', () => {
    expect(seriesOf(single, all)).toBeUndefined();
  });
});

describe('byPostCount', () => {
  const tag = (name: string, n: number) => ({ name, slug: name, posts: Array.from({ length: n }) as Post[] });

  it('puts the most used tags first and orders ties by name', () => {
    const sorted = byPostCount([tag('mock', 1), tag('자바의 정석', 16), tag('TDD', 3), tag('가비지', 3)]);
    // Korean collation puts Hangul before Latin, so 가비지 precedes TDD at the same count.
    expect(sorted.map(t => t.name)).toEqual(['자바의 정석', '가비지', 'TDD', 'mock']);
  });
});
