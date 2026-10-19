import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const stringList = z
  .union([z.string(), z.array(z.union([z.string(), z.number()]))])
  .nullish()
  .transform(v => (v == null ? [] : Array.isArray(v) ? v.map(String) : [v]));

const posts = defineCollection({
  loader: glob({ pattern: '*/*/index.md', base: './src/content/posts' }),
  schema: () =>
    z.object({
      title: z.coerce.string(),
      // YAML parses `2016-12-25 22:17:14` as UTC, so UTC parts reproduce the written date.
      date: z.date(),
      tags: stringList,
      categories: stringList,
      // Original file is served next to the post by scripts/copy-post-assets.mjs.
      image: z.string().optional(),
    }),
});

export const collections = { posts };
