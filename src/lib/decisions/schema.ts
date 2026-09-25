import { z } from 'astro/zod';
import { STATUSES } from '../content/schema';

/**
 * Where the decision stands. "Superseded" is not listed: it is computed from the
 * `supersedes` lists of later records, so the link between two records is written once.
 */
export const OUTCOMES = ['proposed', 'accepted', 'rejected', 'deprecated'] as const;
export type Outcome = (typeof OUTCOMES)[number];

/** The sections every record uses, in this order (MASTER-PROMPT §13). */
export const ADR_SECTIONS = [
  'Context',
  'Problem',
  'Options',
  'Decision',
  'Reasoning',
  'Consequences',
  'Failure Considerations',
  'Reversal Plan',
] as const;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case, e.g. "introduce-redis".');

export const decisionSchema = z.object({
  /** ADR number: 4 is shown as "ADR-004". Numbers are never reused. */
  number: z.number().int().min(1),
  /** The decision, without the "ADR-004:" prefix, e.g. "Introduce Redis". */
  title: z.string().min(1),
  /** Stable URL identity: /decisions/<slug>. */
  slug,
  // Publishing status, as for chapters: unapproved by default.
  status: z.enum(STATUSES).default('draft'),
  outcome: z.enum(OUTCOMES).default('accepted'),
  /** Numbers of earlier records this one replaces. */
  supersedes: z.array(z.number().int().min(1)).default([]),
  /** Slugs of the chapters that explain the concepts this decision relies on. */
  chapters: z.array(slug).default([]),
  /** One sentence: what was decided. Written by the content owner. */
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  date: z.coerce.date().optional(),
});

export type DecisionData = z.infer<typeof decisionSchema>;
