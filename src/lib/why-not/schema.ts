import { z } from 'astro/zod';
import { STATUSES } from '../content/schema';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** One way to meet the need, with the two questions from MASTER-PROMPT §14. */
export const solutionSchema = z
  .object({
    /** e.g. "Add index". */
    name: z.string().min(1),
    /** The chapter that explains this solution. */
    chapter: slug.optional(),
    /** "Why this?": when this solution makes sense. */
    why: z.string().optional(),
    /** "Why not?": when it does not, or what it costs. */
    whyNot: z.string().optional(),
  })
  .strict();

/**
 * A need and the solutions that could meet it. Written by the content owner;
 * a placeholder may list the solutions before their explanations exist.
 */
export const comparisonSchema = z
  .object({
    /** The problem, stated as a need, e.g. "Reduce database read load". */
    need: z.string().min(1),
    status: z.enum(STATUSES).default('draft'),
    order: z.number().int().default(0),
    /** Optional context: when this need usually appears. */
    summary: z.string().optional(),
    solutions: z.array(solutionSchema).min(2),
  })
  .strict()
  .superRefine((data, ctx) => {
    const names = data.solutions.map((s) => s.name.trim().toLowerCase());
    names.forEach((name, i) => {
      if (names.indexOf(name) !== i) {
        ctx.addIssue({ code: 'custom', path: ['solutions', i, 'name'], message: `"${data.solutions[i]!.name}" is listed twice.` });
      }
    });
    if (data.status !== 'approved') return;
    data.solutions.forEach((s, i) => {
      for (const field of ['why', 'whyNot'] as const) {
        if (!s[field]?.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['solutions', i, field],
            message: `An approved comparison needs "${field}" for every solution ("${s.name}").`,
          });
        }
      }
    });
  });

export type Solution = z.infer<typeof solutionSchema>;
export type ComparisonData = z.infer<typeof comparisonSchema>;
export type Comparison = ComparisonData & { id: string };
