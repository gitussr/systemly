/**
 * Pure functions over "Why not?" comparisons: order, URLs, link validation and the
 * chapter back-links ("compared with alternatives in …").
 */
import type { Comparison } from './schema';

export function whyNotHref(id: string): string {
  return `/why-not/${id}`;
}

export function sortComparisons<T extends Pick<Comparison, 'order' | 'need'>>(list: T[]): T[] {
  return [...list].sort((a, b) => a.order - b.order || a.need.localeCompare(b.need));
}

/** Solution chapter links that point to no chapter in this build. */
export function findChapterIssues(list: Comparison[], chapterSlugs: Set<string>): string[] {
  return list.flatMap((c) =>
    c.solutions
      .filter((s) => s.chapter !== undefined && !chapterSlugs.has(s.chapter))
      .map((s) => `why-not/${c.id}: "${s.name}" links to chapter "${s.chapter}", but no chapter has that slug`),
  );
}

/** Solutions that still lack "Why this?" or "Why not?" (allowed in drafts and placeholders). */
export function missingExplanations(c: Pick<Comparison, 'solutions'>): string[] {
  return c.solutions.filter((s) => !s.why?.trim() || !s.whyNot?.trim()).map((s) => s.name);
}

export interface ChapterComparison<T> {
  comparison: T;
  /** The solution this chapter explains. */
  solution: string;
}

/** For each chapter, the comparisons in which it is one of the solutions. */
export function comparisonsByChapter<T extends Comparison>(list: T[]): Map<string, ChapterComparison<T>[]> {
  const result = new Map<string, ChapterComparison<T>[]>();
  for (const comparison of sortComparisons(list)) {
    for (const s of comparison.solutions) {
      if (!s.chapter) continue;
      const entries = result.get(s.chapter) ?? [];
      if (!entries.some((e) => e.comparison.id === comparison.id)) entries.push({ comparison, solution: s.name });
      result.set(s.chapter, entries);
    }
  }
  return result;
}
