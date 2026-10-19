import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import rehypeExternalLinks from 'rehype-external-links';
import { rehypeHexoHeadingIds } from './src/lib/rehype-hexo-heading-ids.ts';
import { remarkPostLinks } from './src/lib/remark-post-links.ts';

export default defineConfig({
  site: 'https://perfectacle.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  markdown: {
    processor: unified({
      // Posts were written against Hexo's marked renderer, where a single newline is a line break.
      remarkPlugins: [remarkBreaks, remarkPostLinks],
      rehypePlugins: [
        rehypeHexoHeadingIds,
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
