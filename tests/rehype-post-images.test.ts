import type { Element, Root } from 'hast';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { VFile } from 'vfile';
import { imageFormat } from '../src/lib/image-format.ts';
import { rehypePostImages } from '../src/lib/rehype-post-images.ts';

vi.mock('../src/lib/image-format.ts', async importOriginal => ({
  ...(await importOriginal<typeof import('../src/lib/image-format.ts')>()),
  imageFormat: vi.fn(async () => ({ width: 1600, height: 900, animated: false, format: 'avif' as const })),
  originalImageUrl: vi.fn(() => '/post/image.webp'),
}));

const temporary: string[] = [];
beforeEach(() => vi.clearAllMocks());
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'blog-post-image-'));
  temporary.push(directory);
  await sharp({ create: { width: 400, height: 300, channels: 3, background: '#369' } })
    .webp()
    .toFile(join(directory, 'image.webp'));
  const image: Element = { type: 'element', tagName: 'img', properties: { src: 'image.webp' }, children: [] };
  const tree: Root = { type: 'root', children: [image] };
  return { image, tree, file: new VFile({ path: join(directory, 'index.md') }) };
}

it('checks the real width without probing or adding AVIF transformations during sync', async () => {
  const { image, tree, file } = await fixture();
  await rehypePostImages({ optimize: false })(tree, file);
  expect(imageFormat).not.toHaveBeenCalled();
  expect(image.properties).toMatchObject({ width: 400, loading: 'eager', fetchpriority: 'high' });
  expect(image.properties).not.toHaveProperty('format');
  expect(image.properties).not.toHaveProperty('quality');
  expect(image.properties).not.toHaveProperty('data-webp-src');
});

it('keeps AVIF selection, the width cap, and original fallback in the optimized mode', async () => {
  const { image, tree, file } = await fixture();
  await rehypePostImages({ optimize: true })(tree, file);
  expect(imageFormat).toHaveBeenCalledOnce();
  expect(image.properties).toMatchObject({
    width: 960,
    format: 'avif',
    quality: 60,
    'data-webp-src': '/post/image.webp',
  });
});
