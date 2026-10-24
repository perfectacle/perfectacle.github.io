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
    entry('older', '2017-01-02T03:04:05', ['Babel', 'Astro'], ['Front-end', 'Babel']),
    entry('newer', '2018-12-31T23:59:59', ['babel', 'astro'], ['Front-end']),
    entry('other', '2018-06-01T00:00:00', [], ['Back-end', 'Spring Boot']),
  ],
}));

const { categoryPath, flattenCategories, getCategoryTree, getLatestPost, getPosts, getTags, postPath, tagPath } =
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

  it('merges tags that differ only in case', async () => {
    const tags = await getTags();
    expect(tags.map(t => `${t.slug}:${t.posts.length}`).sort()).toEqual(['astro:2', 'babel:2']);
  });

  it('slugs tag and category paths like Astro heading ids', () => {
    expect(tagPath('Spring Boot')).toBe('/tags/spring-boot/');
    expect(tagPath('Node.js')).toBe('/tags/nodejs/');
    expect(tagPath('자알쓰')).toBe('/tags/자알쓰/');
    expect(categoryPath(['Back-end', 'Spring Boot'])).toBe('/categories/back-end/spring-boot/');
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
