// A post link that remark-post-links could not resolve stays as a relative `.md` href.
// Astro only logs content render errors, so this is what fails the build instead.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const broken = [];
for (const entry of await readdir('dist', { recursive: true })) {
  if (!entry.endsWith('.html')) continue;
  const html = await readFile(join('dist', entry), 'utf8');
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!/^[a-z]+:|^\/\//i.test(href) && /\.md(#|$)/.test(href)) broken.push(`${entry}: ${href}`);
  }
}
if (broken.length) {
  console.error(`Unresolved post links:\n${broken.join('\n')}`);
  process.exit(1);
}
console.log('check-post-links: ok');
