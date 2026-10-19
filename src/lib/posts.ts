import { getCollection, type CollectionEntry } from 'astro:content';
import { toString } from 'mdast-util-to-string';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { slugize } from './slugize.ts';

export type Post = CollectionEntry<'posts'>;

export const SITE = {
  title: '오늘도 끄적끄적',
  subtitle: '느리더라도 꾸준하게',
  description: 'Toss Server Developer',
  author: '양권성',
  url: 'https://perfectacle.github.io',
  perPage: 10,
};

const pad = (n: number) => String(n).padStart(2, '0');

export const ymd = (d: Date) => ({
  y: String(d.getUTCFullYear()),
  m: pad(d.getUTCMonth() + 1),
  d: pad(d.getUTCDate()),
});

export const formatDate = (d: Date) => {
  const { y, m, d: day } = ymd(d);
  return `${y}-${m}-${day}`;
};

/** Folder name of `<year>/<slug>/index.md`; it is the URL slug. */
export const postSlug = (post: Post): string => {
  const slug = post.filePath?.split('/').at(-2);
  if (!slug) throw new Error(`cannot derive slug for ${post.id}`);
  return slug;
};

export const postPath = (post: Post) => {
  const { y, m, d } = ymd(post.data.date);
  return `/${y}/${m}/${d}/${postSlug(post)}/`;
};

export const tagPath = (t: string) => `/tags/${slugize(t)}/`;
export const categoryPath = (cats: string[]) => `/categories/${cats.map(slugize).join('/')}/`;

let cache: Post[] | undefined;
export async function getPosts(): Promise<Post[]> {
  cache ??= (await getCollection('posts')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return cache;
}

/** Always at least one (possibly empty) page, so the first page can be rendered unconditionally. */
export function paginate<T>(items: T[], perPage = SITE.perPage): [T[], ...T[][]] {
  const pages: [T[], ...T[][]] = [items.slice(0, perPage)];
  for (let i = perPage; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages;
}

export async function getLatestPost(): Promise<Post> {
  const [latest] = await getPosts();
  if (!latest) throw new Error('no posts');
  return latest;
}

/** Page-number path under a base, using Hexo's `page/N/` scheme. */
export const pagePath = (base: string, n: number) => (n === 1 ? base : `${base}page/${n}/`);

/** First real paragraph of the post as plain text (markdown parsed, so `1~2년` or `snake_case` survive). */
export function excerpt(post: Post, max = 180): string {
  const tree = unified()
    .use(remarkParse)
    .parse(post.body ?? '');
  for (const node of tree.children) {
    if (node.type !== 'paragraph') continue;
    // Skip image-only or link-only lines (thumbnails, embeds) that have little text of their own.
    const text = toString(node, { includeImageAlt: false }).replace(/\s+/g, ' ').trim();
    if (text.length < 10) continue;
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
  }
  return '';
}

export function readingMinutes(post: Post): number {
  const chars = (post.body ?? '').replace(/```[\s\S]*?```/g, '').replace(/\s/g, '').length;
  return Math.max(1, Math.round(chars / 500));
}

export interface TagInfo {
  name: string;
  slug: string;
  posts: Post[];
}

export async function getTags(): Promise<TagInfo[]> {
  const map = new Map<string, TagInfo>();
  for (const post of await getPosts()) {
    for (const name of post.data.tags) {
      const slug = slugize(name);
      const info = map.get(slug) ?? { name, slug, posts: [] };
      if (!info.posts.includes(post)) info.posts.push(post);
      map.set(slug, info);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export interface CategoryNode {
  name: string;
  path: string[];
  posts: Post[];
  children: CategoryNode[];
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const roots: CategoryNode[] = [];
  for (const post of await getPosts()) {
    let level = roots;
    const path: string[] = [];
    for (const name of post.data.categories) {
      path.push(name);
      let node = level.find(n => n.name === name);
      if (!node) {
        node = { name, path: [...path], posts: [], children: [] };
        level.push(node);
      }
      node.posts.push(post);
      level = node.children;
    }
  }
  return roots;
}

export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap(n => [n, ...flattenCategories(n.children)]);
}

export function firstImageSrc(post: Post): string | undefined {
  const m = (post.body ?? '').match(/!\[[^\]]*\]\(<?\.\/([^)>\s]+)/);
  return m?.[1];
}

/** Image file (relative to the post folder) that represents the post: frontmatter `image`, else the first image. */
export function coverImage(post: Post): string | undefined {
  return post.data.image?.replace(/^\.\//, '') ?? firstImageSrc(post);
}

/**
 * Other posts most like `post`: a shared category path counts more the deeper it goes, and each shared tag counts 2.
 * Only a shared top-level category (score 1) is too loose to be "related", so at least 2 is required.
 * Ties go to the post closest in date.
 */
export function relatedPosts(
  post: Post,
  all: Post[],
  { limit = 4, exclude = [] as (Post | undefined)[] } = {},
): Post[] {
  const cats = post.data.categories;
  const tags = new Set(post.data.tags);
  const time = post.data.date.valueOf();
  const score = (other: Post) => {
    let s = 0;
    const c = other.data.categories;
    for (let i = 0; i < Math.min(c.length, cats.length) && c[i] === cats[i]; i++) s += i + 1;
    return s + other.data.tags.filter(t => tags.has(t)).length * 2;
  };
  return all
    .filter(p => p !== post && !exclude.includes(p))
    .map(p => ({ p, s: score(p), d: Math.abs(p.data.date.valueOf() - time) }))
    .filter(x => x.s >= 2)
    .sort((a, b) => b.s - a.s || a.d - b.d)
    .slice(0, limit)
    .map(x => x.p);
}

export interface SeriesInfo {
  name: string;
  posts: Post[];
  /** Position of the post in `posts`, 0-based. */
  index: number;
}

/**
 * The series `post` belongs to, in date order. Posts published at the same moment fall back to their id
 * (folder), compared numerically so `java-study-014day` comes before `java-study-016day`.
 */
export function seriesOf(post: Post, all: Post[]): SeriesInfo | undefined {
  const name = post.data.series;
  if (!name) return undefined;
  const posts = all
    .filter(p => p.data.series === name)
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf() || a.id.localeCompare(b.id, 'en', { numeric: true }));
  return { name, posts, index: posts.indexOf(post) };
}
