import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const CODE = [
  'astro.config.ts',
  'pnpm-lock.yaml',
  'src/lib/image-format.ts',
  'src/lib/rehype-post-images.ts',
  'src/components/PostList.astro',
];

/** Astro's Markdown digest does not track image contents or a rehype plugin's selection logic. */
export async function prepareImageCache(root = process.cwd()): Promise<boolean> {
  const posts = join(root, 'src/content/posts');
  const images = (await readdir(posts, { recursive: true }))
    .filter(file => /\.(?:webp|avif|png|jpe?g|gif|svg)$/i.test(file))
    .map(file => join('src/content/posts', file));
  const hash = createHash('sha256');
  for (const file of [...CODE, ...images].sort()) {
    const contents = await readFile(join(root, file));
    hash.update(file).update('\0').update(String(contents.length)).update('\0').update(contents);
  }
  const fingerprint = hash.digest('hex');
  const directory = resolve(root, 'node_modules/.astro');
  const stamp = join(directory, 'image-inputs-hash');
  let previous: string | undefined;
  try {
    previous = await readFile(stamp, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (previous === fingerprint) return false;
  await mkdir(directory, { recursive: true });
  await rm(join(directory, 'data-store.json'), { force: true });
  await writeFile(stamp, fingerprint);
  return true;
}
