import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import rehypeExternalLinks from 'rehype-external-links';
import { rehypeHexoHeadingIds } from './src/lib/rehype-hexo-heading-ids.ts';
import { remarkPostLinks } from './src/lib/remark-post-links.ts';
import { rehypeYoutubeFacade } from './src/lib/rehype-youtube-facade.ts';
import { rehypePostImages } from './src/lib/rehype-post-images.ts';
import { TAXONOMY_REDIRECTS } from './src/lib/taxonomy-redirects.ts';

export default defineConfig({
  vite: {
    build: {
      // Mermaid splits layout engines (elk ~1.4MB, cytoscape) into chunks fetched only for diagrams that need them;
      // what pages actually load is guarded by the Lighthouse script budgets instead.
      chunkSizeWarningLimit: 1500,
    },
  },
  site: 'https://perfectacle.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  redirects: TAXONOMY_REDIRECTS,
  // srcset/sizes for post images so phones don't download the 1600px originals.
  // Widths for the 720px post column at 1x / 1.5x / 2x. Astro's default breakpoint list made ~6 variants per image,
  // pushing the Pages artifact past 700MB (limit 1GB).
  image: { layout: 'constrained', responsiveStyles: true, breakpoints: [720, 1080, 1440] },
  markdown: {
    processor: unified({
      // Posts were written against Hexo's marked renderer, where a single newline is a line break.
      remarkPlugins: [remarkBreaks, remarkPostLinks],
      rehypePlugins: [
        rehypeHexoHeadingIds,
        rehypeYoutubeFacade,
        rehypePostImages,
        [rehypeExternalLinks, { target: '_blank', rel: ['external', 'nofollow', 'noopener', 'noreferrer'] }],
      ],
      // marked (Hexo) made `--` an en dash; heading anchors include it.
      smartypants: { dashes: 'oldschool' },
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
      langAlias: { C: 'c', Java: 'java', javaxcript: 'javascript' },
    },
  },
});
