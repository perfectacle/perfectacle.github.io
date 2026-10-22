import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';
import { POSTS_ROOT, postUrlOf } from './post-files.ts';

export const AVIF_OPTIONS = { quality: 60, effort: 4, chromaSubsampling: '4:4:4' } as const;
const choices = new Map<string, Promise<ImageChoice>>();
const waiting: (() => void)[] = [];
let active = 0;

interface ImageChoice {
  format: 'avif' | 'webp';
  width: number;
  height: number;
  animated: boolean;
}
interface Dimensions {
  width: number;
  height?: number;
  fit?: 'cover' | 'inside';
}

// Content rendering can request hundreds of images at once; libavif needs a bounded work queue.
async function encode<T>(operation: () => Promise<T>): Promise<T> {
  if (active < 2) active++;
  else await new Promise<void>(done => waiting.push(done));
  try {
    return await operation();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

export function localPostImage(src: unknown, postFile: string | undefined): string | undefined {
  if (typeof src !== 'string' || !src || !postFile || /^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith('/')) return;
  let decoded = src;
  try {
    decoded = decodeURI(src);
  } catch {
    // A literal percent in an image filename is not an encoded URI.
  }
  return resolve(dirname(postFile), decoded);
}

/** The published original also works for references to an image in another post. */
export function originalImageUrl(source: string): string {
  const [year, slug, ...parts] = relative(POSTS_ROOT, source).split(sep);
  if (!year || !slug || !parts.length || year === '..') throw new Error(`not a post image: ${source}`);
  return postUrlOf(join(POSTS_ROOT, year, slug)) + parts.map(encodeURIComponent).join('/');
}

/** Probe the original; Astro performs the final responsive encodes from that same original. */
export async function imageFormat(
  source: string,
  dimensions: Dimensions,
  cacheDir = resolve('node_modules/.astro/assets'),
): Promise<ImageChoice> {
  const info = await stat(source);
  const request = JSON.stringify([source, info.size, info.mtimeMs, dimensions, cacheDir]);
  let pending = choices.get(request);
  if (!pending) {
    pending = encode(async () => {
      const input = await readFile(source);
      const metadata = await sharp(input, { animated: true }).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.pageHeight ?? metadata.height ?? 0;
      const animated = (metadata.pages ?? 1) > 1;
      const result: ImageChoice = { format: 'webp', width, height, animated };
      if (animated || width * height <= 128 ** 2 || Math.min(width, height) <= 32) return result;
      const key = createHash('sha256')
        .update(input)
        .update(JSON.stringify({ dimensions, avif: AVIF_OPTIONS, webp: 80, versions: sharp.versions, schema: 1 }))
        .digest('hex');
      const cache = join(cacheDir, `image-format-${key}.json`);
      try {
        const cached: unknown = JSON.parse(await readFile(cache, 'utf8'));
        if (cached === 'avif' || cached === 'webp') return { ...result, format: cached };
      } catch {
        // A missing or interrupted probe is safe to recompute.
      }
      const resized = sharp(input)
        .rotate()
        .resize({ ...dimensions, withoutEnlargement: true });
      const [webp, avif] = await Promise.all([
        resized.clone().webp({ quality: 80 }).toBuffer(),
        resized.clone().avif(AVIF_OPTIONS).toBuffer(),
      ]);
      if (avif.length <= Math.min(webp.length, input.length) * 0.9) result.format = 'avif';
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cache, JSON.stringify(result.format));
      return result;
    });
    choices.set(request, pending);
    void pending.catch(() => choices.delete(request));
  }
  return pending;
}

/** Move native AVIF candidates to a source, leaving the canonical WebP as the fallback. */
export function avifFallbacks(html: string): string {
  return html.replace(/<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/g, img => {
    const original = /\sdata-webp-src="([^"]*)"/.exec(img);
    if (!original) return img;
    const candidates = /\ssrcset="([^"]*)"/.exec(img)?.[1] ?? /\ssrc="([^"]*)"/.exec(img)?.[1];
    if (!candidates) return img;
    const sizes = /\ssizes="([^"]*)"/.exec(img)?.[0] ?? '';
    const fallback = img
      .replace(original[0], '')
      .replace(/\ssrcset="[^"]*"/, '')
      .replace(/\ssrc="[^"]*"/, () => ` src="${original[1]}"`);
    return `<picture><source type="image/avif" srcset="${candidates}"${sizes}>${fallback}</picture>`;
  });
}
