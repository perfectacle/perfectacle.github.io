import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import rehypeExternalLinks from 'rehype-external-links';
import { rehypeHexoHeadingIds } from './src/lib/rehype-hexo-heading-ids.ts';
import { remarkPostLinks } from './src/lib/remark-post-links.ts';
import { rehypeYoutubeFacade } from './src/lib/rehype-youtube-facade.ts';
import { rehypePostImages } from './src/lib/rehype-post-images.ts';

export default defineConfig({
  site: 'https://perfectacle.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // srcset/sizes for post images so phones don't download the 1600px originals.
  image: { layout: 'constrained', responsiveStyles: true },
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
