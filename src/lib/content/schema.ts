import { z } from 'astro/zod';

export const LEVELS = { min: 0, max: 12 } as const;

/**
 * approved     published
 * draft        visible in `astro dev` only
 * placeholder  published as "in preparation"; listed as CONTENT REQUIRED at build
 */
export const STATUSES = ['approved', 'draft', 'placeholder'] as const;
export type ContentStatus = (typeof STATUSES)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case, e.g. "load-balancer".');

export const chapterSchema = z.object({
  title: z.string().min(1),
  /** Stable URL identity: /learn/<slug>. Independent of the file's folder. */
  slug,
  level: z.number().int().min(LEVELS.min).max(LEVELS.max),
  order: z.number().int().default(0),
  difficulty: z.enum(DIFFICULTIES).optional(),
  // Unapproved by default: nothing is published by accident.
  status: z.enum(STATUSES).default('draft'),
  /** "In one sentence". Written by the content owner. */
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  /** Slugs of related chapters. Link validation arrives in Phase 3. */
  related: z.array(slug).default([]),
  updated: z.coerce.date().optional(),
});

export type ChapterData = z.infer<typeof chapterSchema>;
