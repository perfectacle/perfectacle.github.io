import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { prepareImageCache } from '../src/lib/image-cache.ts';

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

it('invalidates Markdown only when image contents, paths, or selection inputs change', async () => {
  const root = await mkdtemp(join(tmpdir(), 'blog-image-cache-'));
  temporary.push(root);
  const files = [
    'astro.config.ts',
    'pnpm-lock.yaml',
    'src/lib/image-format.ts',
    'src/lib/rehype-post-images.ts',
    'src/components/PostList.astro',
    'src/content/posts/2025/post/image.webp',
    'node_modules/.astro/data-store.json',
    'node_modules/.astro/assets/optimized.avif',
  ];
  for (const file of files) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), file);
  }
  const content = join(root, 'node_modules/.astro/data-store.json');
  expect(await prepareImageCache(root)).toBe(true);
  await expect(readFile(content)).rejects.toMatchObject({ code: 'ENOENT' });
  expect(await readFile(join(root, 'node_modules/.astro/assets/optimized.avif'), 'utf8')).toContain('optimized.avif');
  await writeFile(content, 'warm content');
  expect(await prepareImageCache(root)).toBe(false);
  expect(await readFile(content, 'utf8')).toBe('warm content');
  await writeFile(join(root, 'src/content/posts/2025/post/image.webp'), 'new pixels');
  expect(await prepareImageCache(root)).toBe(true);
  await writeFile(join(root, 'src/lib/image-format.ts'), 'new selection settings');
  expect(await prepareImageCache(root)).toBe(true);
  await writeFile(join(root, 'src/content/posts/2025/post/another.webp'), 'new pixels');
  expect(await prepareImageCache(root)).toBe(true);
  await rm(join(root, 'src/content/posts/2025/post/another.webp'));
  expect(await prepareImageCache(root)).toBe(true);
  await writeFile(join(root, 'unrelated.md'), 'unrelated documentation');
  expect(await prepareImageCache(root)).toBe(false);
});
