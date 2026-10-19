// Copies each post's original files to /YYYY/MM/DD/<slug>/<file>, the URLs the Hexo build served.
// Pages use the optimized copies in /_astro/, but external sites and og:image still point here.
import { cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { listPostDirs, postUrlOf } from '../src/lib/post-files.ts';

let copied = 0;
for (const dir of listPostDirs()) {
  const target = join('dist', postUrlOf(dir));
  for (const file of await readdir(dir)) {
    if (file === 'index.md') continue;
    await cp(join(dir, file), join(target, file), { recursive: true });
    copied++;
  }
}
console.log(`copy-post-assets: ${copied} files`);
