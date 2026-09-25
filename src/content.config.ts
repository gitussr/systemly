import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { chapterSchema } from './lib/content/schema';
import { DECISIONS_GLOB, DEV_ONLY_GLOB } from './lib/content/rules';
import { ruleSchema } from './lib/advisor/schema';
import { scenarioSchema } from './lib/evolution/schema';
import { checkTextSchema } from './lib/playground/schema';
import { decisionSchema } from './lib/decisions/schema';
import { comparisonSchema } from './lib/why-not/schema';

const chapters = defineCollection({
  loader: glob({
    base: './content',
    pattern: import.meta.env.DEV ? ['**/*.md', DECISIONS_GLOB] : ['**/*.md', DECISIONS_GLOB, DEV_ONLY_GLOB],
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

/** Architecture Playground check wording: one YAML list, one entry per check id. */
const playgroundChecks = defineCollection({
  loader: file('./content/playground/checks.yaml'),
  schema: checkTextSchema,
});

/** Architecture Decision Records: one Markdown file each; the frontmatter slug is the entry id. */
const decisions = defineCollection({
  loader: glob({
    base: './content/decisions',
    pattern: import.meta.env.DEV ? '**/*.md' : ['**/*.md', DEV_ONLY_GLOB],
    generateId: ({ entry, data }) => (typeof data.slug === 'string' ? data.slug : entry),
  }),
  schema: decisionSchema,
});

/** "Why not?" comparisons: one YAML file per need; the file name is the id and URL. */
const whyNot = defineCollection({
  loader: glob({ base: './content/why-not', pattern: '*.yaml' }),
  schema: comparisonSchema,
});

export const collections = { chapters, decisions, advisorRules, evolution, playgroundChecks, whyNot };
