// Copies each post's original files to /YYYY/MM/DD/<slug>/<file>, the URLs the Hexo build served
// (external sites and og:image still point here), then moves the optimized copies Astro writes to /_astro/
// next to them, so everything a post shows lives under the post's own URL.
import { copyFile, cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listPostDirs, postUrlOf } from '../src/lib/post-files.ts';
import { ASTRO_SIZES, postImageSizes } from '../src/lib/rehype-post-images.ts';

const ASTRO_DIR = join('dist', '_astro');
const OPTIMIZED = /\/_astro\/([^"'\s,()/]+\.(?:webp|avif|png|jpe?g|gif|svg))/g;

let copied = 0;
// Posts showing the same image share one /_astro/ copy, so each post gets its own and the shared one goes last.
const moved = new Set<string>();
for (const dir of listPostDirs()) {
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
  if (out !== html) await writeFile(page, out);
}
for (const name of moved) await rm(join(ASTRO_DIR, name));
console.log(`copy-post-assets: ${copied} files, ${moved.size} optimized images moved into post folders`);
