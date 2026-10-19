import { describe, expect, it, vi } from 'vitest';

const entry = (slug: string, date: string, tags: string[], categories: string[]) => ({
  id: slug,
  collection: 'posts',
  filePath: `src/content/posts/${date.slice(0, 4)}/${slug}/index.md`,
  body: '',
  data: { title: slug, date: new Date(`${date}Z`), tags, categories },
});

vi.mock('astro:content', () => ({
  getCollection: async () => [
    entry('older', '2017-01-02T03:04:05', ['Babel', 'Hexo'], ['Front-end', 'Babel']),
    entry('newer', '2018-12-31T23:59:59', ['babel', 'hexo'], ['Front-end']),
    entry('other', '2018-06-01T00:00:00', [], ['Back-end', 'Spring Boot']),
  ],
}));

const { flattenCategories, getCategoryTree, getLatestPost, getPosts, getTags, postPath, tagPath } =
  await import('../src/lib/posts.ts');

describe('collection helpers', () => {
  it('sorts posts newest first', async () => {
    expect((await getPosts()).map(p => p.id)).toEqual(['newer', 'other', 'older']);
    expect((await getLatestPost()).id).toBe('newer');
  });

  it('builds the URL from the written date and folder name', async () => {
    const [newer] = await getPosts();
    expect(newer && postPath(newer)).toBe('/2018/12/31/newer/');
  });

  it('keeps case-only-different tags apart but merges mapped ones', async () => {
    const tags = await getTags();
    expect(tags.map(t => `${t.slug}:${t.posts.length}`).sort()).toEqual(['Babel:1', 'babel:1', 'hexo:2']);
    expect(tagPath('Hexo')).toBe('/tags/hexo/');
  });

  it('nests categories and counts posts at every level', async () => {
    const all = flattenCategories(await getCategoryTree());
    expect(all.map(c => `${c.path.join('/')}:${c.posts.length}`)).toEqual([
      'Front-end:2',
      'Front-end/Babel:1',
      'Back-end:1',
      'Back-end/Spring Boot:1',
    ]);
  });
});
