import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { chapterSchema } from './lib/content/schema';
import { DEV_ONLY_GLOB } from './lib/content/rules';
import { ruleSchema } from './lib/advisor/schema';
import { scenarioSchema } from './lib/evolution/schema';

const chapters = defineCollection({
  loader: glob({
    base: './content',
    pattern: import.meta.env.DEV ? '**/*.md' : ['**/*.md', DEV_ONLY_GLOB],
    // The frontmatter slug is the entry id, so moving a file between folders never changes its URL.
    generateId: ({ entry, data }) => (typeof data.slug === 'string' ? data.slug : entry),
  }),
  schema: chapterSchema,
});

/** Architecture Advisor rules: one YAML file per rule; the file name is the rule id. */
const advisorRules = defineCollection({
  loader: glob({ base: './content/advisor/rules', pattern: '*.yaml' }),
  schema: ruleSchema,
});

/** Evolution Simulator scenarios: one YAML file each; the file name is the scenario id. */
const evolution = defineCollection({
  loader: glob({ base: './content/evolution', pattern: '*.yaml' }),
  schema: scenarioSchema,
});

export const collections = { chapters, advisorRules, evolution };
