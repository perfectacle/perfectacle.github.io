// Converts post images to WebP and rewrites their references in the posts (`pnpm images`).
// PNG (mostly screenshots): lossless unless that is over 1.5x the lossy size. JPEG: quality 75, metadata
// (including GPS) dropped. GIF: animated WebP. SVG stays as is.
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, normalize, relative } from 'node:path';
import sharp from 'sharp';
import { POSTS_ROOT } from '../src/lib/post-files.ts';

const RASTER = /\.(png|jpe?g|gif)$/i;

async function toWebp(file: string): Promise<Buffer> {
  const input = readFileSync(file);
  const ext = extname(file).toLowerCase();
  if (ext === '.gif') {
    const lossless = await sharp(input, { animated: true }).webp({ lossless: true, effort: 6 }).toBuffer();
    const lossy = await sharp(input, { animated: true }).webp({ quality: 75, effort: 6 }).toBuffer();
    return lossless.length <= lossy.length ? lossless : lossy;
  }
  if (ext === '.png') {
    const lossless = await sharp(input).rotate().webp({ lossless: true, effort: 6 }).toBuffer();
    const lossy = await sharp(input).rotate().webp({ quality: 90, effort: 6 }).toBuffer();
    return lossless.length <= lossy.length * 1.5 ? lossless : lossy;
  }
  return sharp(input).rotate().webp({ quality: 75, effort: 6 }).toBuffer();
}

const files = readdirSync(POSTS_ROOT, { recursive: true, encoding: 'utf8' })
  .filter(f => RASTER.test(f))
  .map(f => join(POSTS_ROOT, f));
const converted = new Set<string>();
for (const file of files) {
  writeFileSync(join(dirname(file), `${basename(file, extname(file))}.webp`), await toWebp(file));
  unlinkSync(file);
  converted.add(normalize(file));
  console.log(`webp: ${relative(POSTS_ROOT, file)}`);
}

if (converted.size) {
  // Image, link and raw <img> targets plus frontmatter `image:`, resolved against the post's folder.
  const ref = /(\]\(<?)([^)\s>]+)|(\bsrc=["'])([^"']+)|(^image:\s*)(\S+)/gm;
  const posts = readdirSync(POSTS_ROOT, { recursive: true, encoding: 'utf8' }).filter(f => f.endsWith('index.md'));
  for (const post of posts) {
    const md = join(POSTS_ROOT, post);
    const text = readFileSync(md, 'utf8');
    const next = text.replace(ref, (whole, ...g: (string | undefined)[]) => {
      const prefix = g[0] ?? g[2] ?? g[4] ?? '';
      const url = g[1] ?? g[3] ?? g[5] ?? '';
      if (/^([a-z]+:|\/|#)/i.test(url)) return whole;
      const path = url.split('#')[0] ?? '';
      if (!converted.has(normalize(join(dirname(md), decodeURI(path))))) return whole;
      return prefix + url.replace(path, path.replace(RASTER, '.webp'));
    });
    if (next !== text) writeFileSync(md, next);
  }
}
console.log(`convert-images: ${converted.size} converted`);
