import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { AVIF_OPTIONS } from './image-format.ts';

const CODE = [
  'astro.config.ts',
  'pnpm-lock.yaml',
  'src/lib/image-format.ts',
  'src/lib/rehype-post-images.ts',
  'src/components/PostList.astro',
];

/** Astro's native image filenames omit the global AVIF encoder settings. */
export async function prepareAvifCache(
  directory: string,
  settings = JSON.stringify({ avif: AVIF_OPTIONS, versions: sharp.versions }),
): Promise<boolean> {
  const fingerprint = createHash('sha256').update(settings).digest('hex');
  const stamp = join(directory, 'avif-settings-hash');
  try {
    if ((await readFile(stamp, 'utf8')) === fingerprint) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  await mkdir(directory, { recursive: true });
  const files = await readdir(directory);
  await Promise.all(
    files.filter(file => file.endsWith('.avif')).map(file => rm(join(directory, file), { force: true })),
  );
  await writeFile(stamp, fingerprint);
  return true;
}

/** Astro's Markdown digest does not track image contents or a rehype plugin's selection logic. */
export async function prepareImageCache(
  root = process.cwd(),
  mode: 'optimized' | 'metadata' = 'optimized',
): Promise<boolean> {
  const posts = join(root, 'src/content/posts');
  // Code-only CI checkouts omit the post collection.
  const files = await readdir(posts, { recursive: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const images = files
    .filter(file => /\.(?:webp|avif|png|jpe?g|gif|svg)$/i.test(file))
    .map(file => join('src/content/posts', file));
  const hash = createHash('sha256').update(mode).update('\0');
  for (const file of [...CODE, ...images].sort()) {
    const contents = await readFile(join(root, file));
    hash.update(file).update('\0').update(String(contents.length)).update('\0').update(contents);
  }
  const fingerprint = hash.digest('hex');
  const directory = resolve(root, 'node_modules/.astro');
  if (mode === 'optimized') await prepareAvifCache(join(directory, 'assets'));
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
