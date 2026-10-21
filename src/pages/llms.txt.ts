// https://llmstxt.org — a plain-text map of the blog for AI assistants that read a site on a user's behalf.
import { categoryPath, excerpt, getCategoryTree, getPosts, postPath, SITE, ymd } from '../lib/posts.ts';

export async function GET() {
  const posts = await getPosts();
  const byYear = new Map<string, string[]>();
  for (const post of posts) {
    const { y } = ymd(post.data.date);
    const summary = excerpt(post, 120);
    const line = `- [${post.data.title}](${new URL(postPath(post), SITE.url).href})${summary ? `: ${summary}` : ''}`;
    byYear.set(y, [...(byYear.get(y) ?? []), line]);
  }
  const topics = (await getCategoryTree())
    .map(c => `- [${c.name}](${new URL(categoryPath(c.path), SITE.url).href})`)
    .join('\n');
  const sections = [...byYear].map(([year, lines]) => `## ${year}\n\n${lines.join('\n')}`);
  const body = `# ${SITE.title}

> ${SITE.author}(${SITE.description})의 개인 기술 블로그. 한국어 글 ${posts.length}개가 있다.

- 소개: ${SITE.url}/about/
- 전체 글 목록: ${SITE.url}/archives/
- 피드(최근 20개): ${SITE.url}/atom.xml
- 사이트맵: ${SITE.url}/sitemap.xml

## 카테고리

${topics}

${sections.join('\n\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
