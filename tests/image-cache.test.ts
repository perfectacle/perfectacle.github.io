import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { prepareAvifCache, prepareImageCache } from '../src/lib/image-cache.ts';

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
  ];
  for (const file of files) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), file);
  }
  const assets = join(root, 'node_modules/.astro/assets');
  await prepareAvifCache(assets);
  await writeFile(join(assets, 'optimized.avif'), 'optimized.avif');
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
  await writeFile(content, 'optimized Markdown');
  const encoderStamp = join(assets, 'avif-settings-hash');
  const encoderSettings = await readFile(encoderStamp, 'utf8');
  await writeFile(encoderStamp, 'restored older encoder settings');
  expect(await prepareImageCache(root, 'metadata')).toBe(true);
  await expect(readFile(content)).rejects.toMatchObject({ code: 'ENOENT' });
  expect(await readFile(join(root, 'node_modules/.astro/assets/optimized.avif'), 'utf8')).toContain('optimized.avif');
  expect(await readFile(encoderStamp, 'utf8')).toBe('restored older encoder settings');
  await writeFile(encoderStamp, encoderSettings);
  await writeFile(content, 'metadata Markdown');
  expect(await prepareImageCache(root, 'metadata')).toBe(false);
  expect(await readFile(content, 'utf8')).toBe('metadata Markdown');
  expect(await prepareImageCache(root, 'optimized')).toBe(true);
  await expect(readFile(content)).rejects.toMatchObject({ code: 'ENOENT' });
  expect(await readFile(join(root, 'node_modules/.astro/assets/optimized.avif'), 'utf8')).toContain('optimized.avif');
  await rm(join(root, 'src/content'), { recursive: true });
  expect(await prepareImageCache(root)).toBe(true);
  expect(await prepareImageCache(root)).toBe(false);
});

it('invalidates only AVIF outputs when restored encoder settings are missing or changed', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'blog-avif-cache-'));
  temporary.push(directory);
  await writeFile(join(directory, 'cached.webp'), 'original WebP');
  await writeFile(join(directory, 'cached.avif'), 'previous AVIF');
  await writeFile(join(directory, 'image-format-choice.json'), 'cached selection');
  expect(await prepareAvifCache(directory, 'effort:2')).toBe(true);
  await expect(readFile(join(directory, 'cached.avif'))).rejects.toMatchObject({ code: 'ENOENT' });
  await writeFile(join(directory, 'cached.avif'), 'current AVIF');
  expect(await prepareAvifCache(directory, 'effort:2')).toBe(false);
  expect(await readFile(join(directory, 'cached.avif'), 'utf8')).toBe('current AVIF');
  expect(await prepareAvifCache(directory, 'effort:4')).toBe(true);
  await expect(readFile(join(directory, 'cached.avif'))).rejects.toMatchObject({ code: 'ENOENT' });
  expect(await readFile(join(directory, 'cached.webp'), 'utf8')).toBe('original WebP');
  expect(await readFile(join(directory, 'image-format-choice.json'), 'utf8')).toBe('cached selection');
});
