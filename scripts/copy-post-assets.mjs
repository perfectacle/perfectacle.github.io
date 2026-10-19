// Copies each post's original files to /YYYY/MM/DD/<slug>/<file>, the URLs the Hexo build served.
// Pages use the optimized copies in /_astro/, but external sites and og:image still point here.
import { cp, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'src/content/posts';
const out = 'dist';
let copied = 0;

const visible = async dir => (await readdir(dir, { withFileTypes: true })).filter(e => e.isDirectory() && !e.name.startsWith('.'));

for (const year of await visible(root)) {
  for (const post of await visible(join(root, year.name))) {
    const slug = post.name;
    const dir = join(root, year.name, slug);
    const md = await readFile(join(dir, 'index.md'), 'utf8');
    const frontmatter = md.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    const m = frontmatter.match(/^date:\s*(\d{4})-(\d{2})-(\d{2})/m);
    if (!m) throw new Error(`no date in ${dir}`);
    const target = join(out, m[1], m[2], m[3], slug);
    for (const file of await readdir(dir)) {
      if (file === 'index.md') continue;
      await cp(join(dir, file), join(target, file), { recursive: true });
      copied++;
    }
  }
}
console.log(`copy-post-assets: ${copied} files`);
