import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as postFiles from '../src/lib/post-files.ts';
import { AVIF_OPTIONS, avifFallbacks, imageFormat, localPostImage, originalImageUrl } from '../src/lib/image-format.ts';

const temporary: string[] = [];
async function workspace() {
  const dir = await mkdtemp(join(tmpdir(), 'blog-image-format-'));
  temporary.push(dir);
  return dir;
}
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporary.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('image format selection', () => {
  it('chooses AVIF only when it beats both the equivalent WebP and the original by 10%', async () => {
    const cache = await workspace();
    const source = join(cache, 'texture.webp');
    const width = 480;
    const height = 320;
    const pixels = Buffer.alloc(width * height * 3);
    let seed = 99;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 3;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const noise = (seed >>> 24) / 255;
        const value = Math.max(0, Math.min(255, 128 + 65 * Math.sin(x / 20) + 35 * Math.cos(y / 13) + noise * 32));
        pixels[offset] = value;
        pixels[offset + 1] = value;
        pixels[offset + 2] = value;
      }
    }
    const input = await sharp(pixels, { raw: { width, height, channels: 3 } })
      .webp({ quality: 100 })
      .toBuffer();
    await writeFile(source, input);
    const resized = sharp(input).rotate().resize({ width: 960, withoutEnlargement: true });
    const [avif, webp] = await Promise.all([
      resized.clone().avif(AVIF_OPTIONS).toBuffer(),
      resized.clone().webp({ quality: 80 }).toBuffer(),
    ]);
    expect(avif.length).toBeLessThanOrEqual(Math.min(input.length, webp.length) * 0.9);
    const [first, second] = await Promise.all([
      imageFormat(source, { width: 960 }, cache),
      imageFormat(source, { width: 960 }, cache),
    ]);
    expect(first.format).toBe('avif');
    expect(first).toBe(second);
    expect((await readdir(cache)).filter(file => file.startsWith('image-format-'))).toHaveLength(1);
  });

  it('keeps an already smaller original WebP and includes its contents in the cache key', async () => {
    const dir = await workspace();
    const file = join(dir, 'optimized.webp');
    await sharp({ create: { width: 400, height: 400, channels: 3, background: '#fff' } })
      .webp({ lossless: true })
      .toFile(file);
    expect((await imageFormat(file, { width: 400 }, dir)).format).toBe('webp');
    const before = (await readdir(dir)).filter(name => name.startsWith('image-format-'));
    await sharp({ create: { width: 400, height: 400, channels: 3, background: '#000' } })
      .webp({ lossless: true })
      .toFile(file);
    await imageFormat(file, { width: 400 }, dir);
    expect((await readdir(dir)).filter(name => name.startsWith('image-format-'))).toHaveLength(before.length + 1);
  });

  it('preserves small sprites and multiple animation frames', async () => {
    const dir = await workspace();
    const sprite = join(dir, 'sprite.webp');
    await sharp({ create: { width: 32, height: 32, channels: 3, background: '#369' } })
      .webp()
      .toFile(sprite);
    expect(await imageFormat(sprite, { width: 960 }, dir)).toMatchObject({ format: 'webp', width: 32, height: 32 });
    const animation = join(dir, 'animated.webp');
    const frames = Buffer.concat([Buffer.alloc(256 * 256 * 3, 0), Buffer.alloc(256 * 256 * 3, 255)]);
    await sharp(frames, { raw: { width: 256, height: 512, channels: 3, pageHeight: 256 } })
      .webp({ loop: 0, delay: [100, 100] })
      .toFile(animation);
    expect((await sharp(animation, { animated: true }).metadata()).pages).toBe(2);
    expect(await imageFormat(animation, { width: 960 }, dir)).toMatchObject({ format: 'webp', animated: true });
  });
});

describe('original image fallback', () => {
  it('resolves encoded paths and cross-post references to their published original', () => {
    const postUrl = vi.spyOn(postFiles, 'postUrlOf').mockReturnValue('/2025/12/02/travel-001-kenya-01/');
    const post = resolve('src/content/posts/2025/travel-001-kenya-01/index.md');
    expect(localPostImage('gorge%20one.webp', post)).toBe(
      resolve('src/content/posts/2025/travel-001-kenya-01/gorge one.webp'),
    );
    expect(localPostImage('100%.webp', post)).toBe(resolve('src/content/posts/2025/travel-001-kenya-01/100%.webp'));
    const crossPost = localPostImage(
      '../travel-001-kenya-01/gorge-06.webp',
      resolve('src/content/posts/2025/another/index.md'),
    );
    expect(crossPost).toBeDefined();
    expect(crossPost).toBe(resolve('src/content/posts/2025/travel-001-kenya-01/gorge-06.webp'));
    expect(originalImageUrl(resolve('src/content/posts/2025/travel-001-kenya-01/gorge-06.webp'))).toBe(
      '/2025/12/02/travel-001-kenya-01/gorge-06.webp',
    );
    expect(postUrl).toHaveBeenCalledWith(resolve('src/content/posts/2025/travel-001-kenya-01'));
    expect(localPostImage('https://example.com/image.webp', post)).toBeUndefined();
    expect(localPostImage('/image.webp', post)).toBeUndefined();
    expect(localPostImage('', post)).toBeUndefined();
  });

  it('keeps native responsive candidates and sizing with an original WebP fallback', () => {
    const img =
      '<img data-webp-src="/post/original.webp" alt="a &gt; b" src="/post/full.avif" srcset="/post/small.avif 720w, /post/full.avif 960w" sizes="(min-width: 960px) 960px, 100vw" width="960" height="640" loading="eager">';
    const html = avifFallbacks(`<p>${img}</p>`);
    expect(html).toContain(
      '<source type="image/avif" srcset="/post/small.avif 720w, /post/full.avif 960w" sizes="(min-width: 960px) 960px, 100vw">',
    );
    expect(html).toContain('<img alt="a &gt; b" src="/post/original.webp"');
    expect(html).not.toContain('data-webp-src');
    expect(html).not.toMatch(/<img[^>]*srcset=/);
    expect(avifFallbacks(html)).toBe(html);
    expect(avifFallbacks('<img src="/unchanged.webp">')).toBe('<img src="/unchanged.webp">');
  });
});
