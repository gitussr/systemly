import { z } from 'astro/zod';
import { COMPONENT_IDS } from './components';
import { INPUT_FIELDS } from './inputs';

/** Answer sections, in the order MASTER-PROMPT §10 lists them. */
export const SECTIONS = [
  { id: 'why', title: 'Why' },
  { id: 'alternatives', title: 'Alternatives' },
  { id: 'notYet', title: 'What you do not need yet' },
  { id: 'bottlenecks', title: 'Expected bottlenecks' },
  { id: 'scalingPath', title: 'Scaling path' },
  { id: 'lockIn', title: 'Lock-in risks' },
  { id: 'migration', title: 'Migration difficulty' },
  { id: 'measure', title: 'What to measure before scaling' },
  { id: 'at10x', title: 'What changes at 10× traffic' },
  { id: 'at100x', title: 'What changes at 100× traffic' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** A section entry: plain text, or text with chapters to read next. */
const item = z.union([
  z.string().min(1).transform((text) => ({ text, chapters: [] as string[] })),
  z.object({ text: z.string().min(1), chapters: z.array(slug).default([]) }),
]);

/** `when` accepts only real input fields, and only values those fields offer. */
const when = z
  .object(
    Object.fromEntries(
      INPUT_FIELDS.map((f) => [
        f.id,
        z.array(z.enum(f.options.map((o) => o.value) as [string, ...string[]])).min(1).optional(),
      ]),
    ),
  )
  .strict()
  .default({});

export const ruleSchema = z
  .object({
    title: z.string().min(1),
    status: z.enum(['approved', 'draft']).default('draft'),
    /** When two rules disagree about a component, the higher priority wins. */
    priority: z.number().int().default(0),
    when,
    architecture: z
      .object({
        add: z.array(z.enum(COMPONENT_IDS)).default([]),
        /** Components this rule considers unnecessary for these inputs. */
        omit: z.array(z.enum(COMPONENT_IDS)).default([]),
      })
      .strict()
      .default({ add: [], omit: [] }),
    sections: z
      .object(Object.fromEntries(SECTIONS.map((s) => [s.id, z.array(item).default([])])))
      .strict()
      .default({}),
  })
  .strict();

export type Rule = z.infer<typeof ruleSchema> & { id: string };
export type RuleItem = { text: string; chapters: string[] };
