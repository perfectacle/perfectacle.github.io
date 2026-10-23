import {
  flattenCategories,
  getCategoryTree,
  getLatestPost,
  getPosts,
  getTags,
  categoryPath,
  postPath,
  SITE,
} from '../lib/posts.ts';
import { GUIDE_PATH, chapterPath, readyChapters } from '../components/romhacking/chapters.ts';

export async function GET() {
  const posts = await getPosts();
  const urls: [string, string?][] = [
    ['/', (await getLatestPost()).data.date.toISOString()],
    ...posts.map(p => [postPath(p), p.data.date.toISOString()] as [string, string]),
    ['/about/'],
    ['/archives/'],
    ['/tags/'],
    ['/categories/'],
    ['/games/kr-patches/'],
    ['/games/kr-patches/sfc/'],
    ['/games/kr-patches/sfc/super-mario-rpg/'],
    ['/games/kr-patches/sfc/dragon-ball-z-super-gokuden-totsugeki/'],
    ['/games/kr-patches/sfc/dragon-ball-z-super-gokuden-kakusei/'],
    ['/games/kr-patches/sfc/otogirisou/'],
    [GUIDE_PATH],
    ...readyChapters().map(c => [chapterPath(c)] as [string]),
    ...(await getTags()).map(t => [`/tags/${t.slug}/`] as [string]),
    ...flattenCategories(await getCategoryTree()).map(c => [categoryPath(c.path)] as [string]),
  ];
  const body = urls
    .map(
      ([path, lastmod]) =>
        `  <url><loc>${new URL(path, SITE.url).href.replace(/&/g, '&amp;')}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`,
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
