import { z } from 'astro/zod';
import { COMPONENT_IDS } from '../advisor/components';
import { INPUT_FIELDS } from '../advisor/inputs';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** Advisor answers that correspond to a stage, for "open this stage in the Advisor". */
const advisorAnswers = z
  .object(
    Object.fromEntries(
      INPUT_FIELDS.map((f) => [f.id, z.enum(f.options.map((o) => o.value) as [string, ...string[]]).optional()]),
    ),
  )
  .strict();

/**
 * One version of the architecture. The narrative follows MASTER-PROMPT §7:
 * a problem appears → it is measured → one change is made → a new trade-off appears.
 */
export const stageSchema = z
  .object({
    /** The growth marker, e.g. "10,000 users". */
    label: z.string().min(1),
    /** Short name, e.g. "V2 — Several application instances". */
    title: z.string().min(1),
    components: z.array(z.enum(COMPONENT_IDS)).min(1),
    /** What forced this version (for the first stage: the starting requirements). */
    problem: z.string().optional(),
    /** Signals that showed the problem. */
    measure: z.array(z.string()).default([]),
    /** The one change made at this stage. */
    change: z.string().optional(),
    /** What the change costs, or the new problem it introduces. */
    tradeOff: z.string().optional(),
    chapters: z.array(slug).default([]),
    advisor: advisorAnswers.optional(),
  })
  .strict();

export const scenarioSchema = z
  .object({
    title: z.string().min(1),
    status: z.enum(['approved', 'draft']).default('draft'),
    order: z.number().int().default(0),
    summary: z.string().optional(),
    stages: z.array(stageSchema).min(2),
  })
  .strict();

export type Stage = z.infer<typeof stageSchema>;
export type Scenario = z.infer<typeof scenarioSchema> & { id: string };
