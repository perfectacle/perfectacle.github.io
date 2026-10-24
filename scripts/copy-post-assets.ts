// Copies each post's original files to /YYYY/MM/DD/<slug>/<file>
// (external sites and og:image point here), then moves the optimized copies Astro writes to /_astro/
// next to them, so everything a post shows lives under the post's own URL.
import { copyFile, cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listPostDirs, postUrlOf } from '../src/lib/post-files.ts';
import { ASTRO_SIZES, postImageSizes } from '../src/lib/rehype-post-images.ts';
import { avifFallbacks } from '../src/lib/image-format.ts';

const ASTRO_DIR = join('dist', '_astro');
const OPTIMIZED = /\/_astro\/([^"'\s,()/]+\.(?:webp|avif|png|jpe?g|gif|svg))/g;

async function forEachConcurrent(items: string[], operation: (item: string) => Promise<void>) {
  const iterator = items.values();
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (const item of iterator) await operation(item);
    }),
  );
}

let copied = 0;
// Shared images are copied into every post before unused /_astro/ copies are removed.
const moved = new Set<string>();
await forEachConcurrent(listPostDirs(), async dir => {
  const url = postUrlOf(dir);
  const target = join('dist', url);
  for (const file of await readdir(dir)) {
    if (file === 'index.md') continue;
    await cp(join(dir, file), join(target, file), { recursive: true });
    copied++;
  }
  const page = join(target, 'index.html');
  const html = await readFile(page, 'utf8');
  const names = new Set([...html.matchAll(OPTIMIZED)].map(m => m[1] ?? ''));
  for (const name of names) {
    await copyFile(join(ASTRO_DIR, name), join(target, name));
    moved.add(name);
  }
  // Astro can't know the post column's real width (it depends on the page having a contents sidebar).
  const sidebar = html.includes('class="toc-side"');
  const out = html
    .replace(OPTIMIZED, `${url}$1`)
    .replace(ASTRO_SIZES, (_, w: string) => `sizes="${postImageSizes(sidebar, Number(w))}"`);
  const withFallbacks = avifFallbacks(out);
  if (withFallbacks !== html) await writeFile(page, withFallbacks);
});
// A list thumbnail can share an identical transform with a post image.
const referenced = new Set<string>();
const pages = (await readdir('dist', { recursive: true })).filter(file => file.endsWith('.html'));
await forEachConcurrent(pages, async file => {
  const html = await readFile(join('dist', file), 'utf8');
  for (const match of html.matchAll(OPTIMIZED)) referenced.add(match[1] ?? '');
});
await forEachConcurrent(
  [...moved].filter(name => !referenced.has(name)),
  async name => {
    await rm(join(ASTRO_DIR, name));
  },
);
console.log(`copy-post-assets: ${copied} files, ${moved.size} optimized images moved into post folders`);
