import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import rehypeExternalLinks from 'rehype-external-links';
import { remarkPostLinks } from './src/lib/remark-post-links.ts';
import { rehypeYoutubeFacade } from './src/lib/rehype-youtube-facade.ts';
import { rehypePostImages } from './src/lib/rehype-post-images.ts';
import { rehypeCodeBlocks } from './src/lib/rehype-code-blocks.ts';
import { AVIF_OPTIONS } from './src/lib/image-format.ts';
import { prepareImageCache } from './src/lib/image-cache.ts';

function markdownProcessor(optimize: boolean) {
  return unified({
    // Posts are written with a single newline meaning a line break.
    remarkPlugins: [remarkBreaks, remarkPostLinks],
    rehypePlugins: [
      rehypeYoutubeFacade,
      [rehypePostImages, { optimize }],
      rehypeCodeBlocks,
      [rehypeExternalLinks, { target: '_blank', rel: ['external', 'nofollow', 'noopener', 'noreferrer'] }],
    ],
  });
}

export default defineConfig({
  integrations: [
    {
      name: 'post-image-rendering',
      hooks: {
        'astro:config:setup': async ({ command, config, updateConfig }) => {
          if (command === 'preview') return;
          const optimize = command !== 'sync';
          updateConfig({ markdown: { processor: markdownProcessor(optimize) } });
          await prepareImageCache(fileURLToPath(config.root), optimize ? 'optimized' : 'metadata');
        },
      },
    },
  ],
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
  // srcset/sizes for post images so phones don't download the 1600px originals.
  // Astro adds each image's own width (POST_IMAGE_WIDTH) and its 2x to these, dropping any wider than the original,
  // so an image gets at most four variants. Astro's default breakpoint list made ~6 variants per image,
  // pushing the Pages artifact past 700MB (limit 1GB).
  image: {
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [720, 1440],
    service: { entrypoint: 'astro/assets/services/sharp', config: { avif: AVIF_OPTIONS } },
  },
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
      langAlias: { C: 'c', Java: 'java', javaxcript: 'javascript' },
    },
  },
});
