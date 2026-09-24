/**
 * The related-topics graph. Authors list outgoing links in `related`;
 * incoming links ("referenced by") are computed, so a link is written once.
 */
import { sortChapters, type ChapterMeta } from './catalog';

export interface GraphNode {
  slug: string;
  related: string[];
  source?: string;
}

export interface RelatedIssue {
  kind: 'missing' | 'self' | 'duplicate';
  from: string;
  to: string;
  source?: string;
}

/** Problems in `related` lists: unknown slugs and self-links are errors, repeats are warnings. */
export function findRelatedIssues(nodes: GraphNode[]): RelatedIssue[] {
  const known = new Set(nodes.map((n) => n.slug));
  const issues: RelatedIssue[] = [];
  for (const node of nodes) {
    const seen = new Set<string>();
    for (const to of node.related) {
      const base = { from: node.slug, to, source: node.source };
      if (to === node.slug) issues.push({ kind: 'self', ...base });
      else if (!known.has(to)) issues.push({ kind: 'missing', ...base });
      else if (seen.has(to)) issues.push({ kind: 'duplicate', ...base });
      seen.add(to);
    }
  }
  return issues;
}

export function formatRelatedIssue(issue: RelatedIssue): string {
  const where = issue.source ? ` (${issue.source})` : '';
  switch (issue.kind) {
    case 'missing':
      return `"${issue.from}" lists related "${issue.to}", but no chapter has that slug${where}`;
    case 'self':
      return `"${issue.from}" lists itself as related${where}`;
    case 'duplicate':
      return `"${issue.from}" lists related "${issue.to}" more than once${where}`;
  }
}

export interface Connections<T> {
  /** Chapters this chapter links to, in the author's order. */
  related: T[];
  /** Chapters that link here and are not already in `related`, in curriculum order. */
  referencedBy: T[];
}

export function buildConnections<T extends ChapterMeta & { related: string[] }>(
  chapters: T[],
): Map<string, Connections<T>> {
  const bySlug = new Map(chapters.map((c) => [c.slug, c]));
  const incoming = new Map<string, T[]>();
  for (const chapter of chapters) {
    for (const to of new Set(chapter.related)) {
      if (to === chapter.slug) continue;
      incoming.set(to, [...(incoming.get(to) ?? []), chapter]);
    }
  }

  const result = new Map<string, Connections<T>>();
  for (const chapter of chapters) {
    const related = [...new Set(chapter.related)]
      .filter((slug) => slug !== chapter.slug)
      .map((slug) => bySlug.get(slug))
      .filter((c): c is T => c !== undefined);
    const relatedSlugs = new Set(related.map((c) => c.slug));
    const referencedBy = sortChapters(
      (incoming.get(chapter.slug) ?? []).filter((c) => !relatedSlugs.has(c.slug)),
    );
    result.set(chapter.slug, { related, referencedBy });
  }
  return result;
}
