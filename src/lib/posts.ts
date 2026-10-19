import { getCollection, type CollectionEntry } from 'astro:content';
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

// Merges tags that differ only by case, keeping the slug the Hexo build published.
const TAG_MAP: Record<string, string> = { Hexo: 'hexo' };

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

export const tagName = (t: string) => TAG_MAP[t] ?? t;
export const tagPath = (t: string) => `/tags/${slugize(tagName(t))}/`;
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

/** First real paragraph of the post as plain text. */
export function excerpt(post: Post, max = 180): string {
  const body = post.body ?? '';
  const blocks = body
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map(b => b.trim());
  for (const block of blocks) {
    if (!block || /^(#|!\[|<|\{%|>|\||[-*+] |\d+\. )/.test(block)) continue;
    const text = block
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[`*_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
    for (const raw of post.data.tags) {
      const name = tagName(raw);
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
