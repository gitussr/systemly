import { z } from 'astro/zod';
import { CHECK_IDS } from './checks';

/** Wording for one Playground check (content/playground/checks.yaml). */
export const checkTextSchema = z
  .object({
    id: z.enum(CHECK_IDS),
    /** Always published: the warning itself. */
    title: z.string().min(1),
    /** Explanations are published only once approved. */
    status: z.enum(['approved', 'draft']).default('draft'),
    why: z.string().optional(),
    fix: z.string().optional(),
    chapters: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).default([]),
  })
  .strict();

export type CheckText = z.infer<typeof checkTextSchema>;
