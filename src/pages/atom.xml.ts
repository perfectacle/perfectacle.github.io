import { excerpt, getLatestPost, getPosts, postPath, SITE, tagName } from '../lib/posts.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const posts = (await getPosts()).slice(0, 20);
  const entries = posts.map(post => {
    const url = new URL(postPath(post), SITE.url).href;
    const date = post.data.date.toISOString();
    return `  <entry>
    <title>${esc(post.data.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${date}</published>
    <updated>${date}</updated>
    <summary type="text">${esc(excerpt(post, 300))}</summary>
${post.data.categories.map(c => `    <category term="${esc(c)}"/>`).join('\n')}
${post.data.tags.map(t => `    <category term="${esc(tagName(t))}"/>`).join('\n')}
  </entry>`;
  });
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(SITE.title)}</title>
  <subtitle>${esc(SITE.subtitle)}</subtitle>
  <link href="${SITE.url}/atom.xml" rel="self"/>
  <link href="${SITE.url}/" rel="alternate"/>
  <id>${SITE.url}/</id>
  <author><name>${esc(SITE.author)}</name></author>
  <updated>${(await getLatestPost()).data.date.toISOString()}</updated>
${entries.join('\n')}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
}
