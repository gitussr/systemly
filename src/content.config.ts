import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { chapterSchema } from './lib/content/schema';
import { DEV_ONLY_GLOB } from './lib/content/rules';

const chapters = defineCollection({
  loader: glob({
    base: './content',
    pattern: import.meta.env.DEV ? '**/*.md' : ['**/*.md', DEV_ONLY_GLOB],
    // The frontmatter slug is the entry id, so moving a file between folders never changes its URL.
    generateId: ({ entry, data }) => (typeof data.slug === 'string' ? data.slug : entry),
  }),
  schema: chapterSchema,
});

export const collections = { chapters };
