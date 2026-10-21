import { describe, expect, it } from 'vitest';
import { blogPosting, breadcrumbs, profilePage, serializeJsonLd, website } from '../src/lib/structured-data.ts';

const site = { title: '블로그', description: 'Server Developer', author: '작성자', url: 'https://example.com' };

describe('blogPosting', () => {
  const base = {
    title: '제목',
    description: '요약',
    path: '/2022/06/06/slug/',
    date: new Date('2022-06-06T01:02:03Z'),
    tags: ['Java', 'JVM'],
    categories: ['Programming', 'Java'],
  };

  it('uses absolute URLs and the author profile', () => {
    const data = blogPosting(site, { ...base, image: '/2022/06/06/slug/cover.webp' });
    expect(data).toMatchObject({
      '@type': 'BlogPosting',
      headline: '제목',
      url: 'https://example.com/2022/06/06/slug/',
      image: 'https://example.com/2022/06/06/slug/cover.webp',
      datePublished: '2022-06-06T01:02:03.000Z',
      keywords: 'Java, JVM',
      articleSection: 'Programming / Java',
      author: { '@type': 'Person', name: '작성자', url: 'https://example.com/about/' },
    });
  });

  it('leaves out empty optional fields', () => {
    const data = blogPosting(site, { ...base, tags: [], categories: [] });
    expect(data).not.toHaveProperty('image');
    expect(data).not.toHaveProperty('keywords');
    expect(data).not.toHaveProperty('articleSection');
  });
});

describe('breadcrumbs', () => {
  it('starts at the home page and numbers from 1', () => {
    const data = breadcrumbs(site, [{ name: 'Java', path: '/categories/Java/' }]);
    expect(data['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: '블로그', item: 'https://example.com/' },
      { '@type': 'ListItem', position: 2, name: 'Java', item: 'https://example.com/categories/Java/' },
    ]);
  });

  it('starts at the trail itself when there is no root', () => {
    const data = breadcrumbs(site, [{ name: '한글패치', path: '/games/kr-patches/' }], null);
    expect(data['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: '한글패치', item: 'https://example.com/games/kr-patches/' },
    ]);
  });
});

describe('website and profilePage', () => {
  it('describe the same author', () => {
    expect(profilePage(site, '/about/profile.webp')['mainEntity']).toMatchObject({
      ...(website(site)['author'] as object),
      image: 'https://example.com/about/profile.webp',
      jobTitle: 'Server Developer',
    });
  });
});

describe('serializeJsonLd', () => {
  it('cannot close the surrounding script element', () => {
    expect(serializeJsonLd({ headline: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});
