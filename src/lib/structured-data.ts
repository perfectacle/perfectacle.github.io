// schema.org JSON-LD for search engines and AI crawlers. Builders take plain values so they stay testable
// without the content collection.

type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

export interface SiteInfo {
  title: string;
  description: string;
  author: string;
  url: string;
}

/** Profiles that identify the author, so the person can be linked to the same entity elsewhere. */
export const AUTHOR_PROFILES = ['https://github.com/perfectacle', 'https://kr.linkedin.com/in/perfectacle'];

const abs = (site: SiteInfo, path: string) => new URL(path, site.url).href;

export const person = (site: SiteInfo): JsonLd => ({
  '@type': 'Person',
  name: site.author,
  url: abs(site, '/about/'),
  sameAs: AUTHOR_PROFILES,
});

export const website = (site: SiteInfo): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'WebSite',
  name: site.title,
  description: site.description,
  url: abs(site, '/'),
  inLanguage: 'ko-KR',
  author: person(site),
});

export const profilePage = (site: SiteInfo, image: string): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'ProfilePage',
  url: abs(site, '/about/'),
  mainEntity: { ...person(site), image: abs(site, image), jobTitle: site.description },
});

export interface ArticleInfo {
  title: string;
  description: string;
  path: string;
  date: Date;
  tags: string[];
  categories: string[];
  image?: string | undefined;
}

export const blogPosting = (site: SiteInfo, a: ArticleInfo): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'BlogPosting',
  headline: a.title,
  description: a.description,
  url: abs(site, a.path),
  mainEntityOfPage: abs(site, a.path),
  datePublished: a.date.toISOString(),
  inLanguage: 'ko-KR',
  author: person(site),
  ...(a.image && { image: abs(site, a.image) }),
  ...(a.categories.length > 0 && { articleSection: a.categories.join(' / ') }),
  ...(a.tags.length > 0 && { keywords: a.tags.join(', ') }),
  isPartOf: { '@type': 'Blog', name: site.title, url: abs(site, '/') },
});

interface Crumb {
  name: string;
  path: string;
}

/** `root` (the blog home unless given), then each category level, then the page itself. */
export const breadcrumbs = (
  site: SiteInfo,
  trail: Crumb[],
  root: Crumb | null = { name: site.title, path: '/' },
): JsonLd => ({
  '@context': CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: [...(root ? [root] : []), ...trail].map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: abs(site, item.path),
  })),
});

/** `</script>` inside a string value would end the script element early. */
export const serializeJsonLd = (data: JsonLd): string => JSON.stringify(data).replace(/</g, '\\u003c');
