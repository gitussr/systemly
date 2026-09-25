/**
 * Pure functions over decision-record metadata: labels, order, the section check,
 * link validation, and the links computed from `supersedes` and `chapters`.
 */
import { ADR_SECTIONS, type DecisionData, type Outcome } from './schema';

export type DecisionMeta = Pick<
  DecisionData,
  'number' | 'title' | 'slug' | 'status' | 'outcome' | 'supersedes' | 'chapters'
> &
  Partial<Pick<DecisionData, 'summary'>>;

/** What a reader sees: the authored outcome, or "superseded" once an accepted record replaces it. */
export type DisplayOutcome = Outcome | 'superseded';

export function adrLabel(number: number): string {
  return `ADR-${String(number).padStart(3, '0')}`;
}

export function decisionHref(slug: string): string {
  return `/decisions/${slug}`;
}

export function sortDecisions<T extends Pick<DecisionData, 'number'>>(records: T[]): T[] {
  return [...records].sort((a, b) => a.number - b.number);
}

export interface SectionCheck {
  /** Required sections with no matching `##` heading. */
  missing: string[];
  /** True when the required sections that are present are not in the standard order. */
  outOfOrder: boolean;
}

/**
 * Compares a record's `##` headings with the standard sections. Matching ignores case;
 * extra headings are allowed anywhere.
 */
export function checkSections(headings: string[]): SectionCheck {
  const normalise = (text: string) => text.trim().toLowerCase();
  const present = headings.map(normalise);
  const positions = ADR_SECTIONS.map((section) => present.indexOf(normalise(section)));
  const found = positions.filter((p) => p !== -1);
  return {
    missing: ADR_SECTIONS.filter((_, i) => positions[i] === -1),
    outOfOrder: found.some((p, i) => i > 0 && p < found[i - 1]!),
  };
}

export interface RecordNode extends Pick<DecisionData, 'number' | 'slug' | 'supersedes' | 'chapters'> {
  source?: string;
}

const where = (r: RecordNode) => (r.source ? ` (${r.source})` : '');

/** Numbers and slugs used by more than one record. Numbers are never reused, even by drafts. */
export function findIdentityIssues(records: RecordNode[]): string[] {
  const issues: string[] = [];
  const group = <K,>(key: (r: RecordNode) => K) => {
    const map = new Map<K, RecordNode[]>();
    for (const r of records) map.set(key(r), [...(map.get(key(r)) ?? []), r]);
    return [...map].filter(([, list]) => list.length > 1);
  };
  for (const [number, list] of group((r) => r.number)) {
    issues.push(`${adrLabel(number)} is used by ${list.length} records: ${list.map((r) => r.source ?? r.slug).join(', ')}`);
  }
  for (const [slug, list] of group((r) => r.slug)) {
    issues.push(`Slug "${slug}" is used by ${list.length} records: ${list.map((r) => r.source ?? adrLabel(r.number)).join(', ')}`);
  }
  return issues;
}

/** `supersedes` and `chapters` links that point nowhere: publishing them would break a page. */
export function findLinkIssues(records: RecordNode[], chapterSlugs: Set<string>): string[] {
  const issues: string[] = [];
  const numbers = new Set(records.map((r) => r.number));
  for (const r of records) {
    for (const n of r.supersedes) {
      if (n === r.number) issues.push(`${adrLabel(r.number)} supersedes itself${where(r)}`);
      else if (n > r.number) issues.push(`${adrLabel(r.number)} supersedes the later ${adrLabel(n)}; a record can only replace an earlier one${where(r)}`);
      else if (!numbers.has(n)) issues.push(`${adrLabel(r.number)} supersedes ${adrLabel(n)}, which is not published${where(r)}`);
    }
    for (const chapter of r.chapters) {
      if (!chapterSlugs.has(chapter)) issues.push(`${adrLabel(r.number)} links to chapter "${chapter}", but no chapter has that slug${where(r)}`);
    }
  }
  return issues;
}

export interface DecisionLinks<T> {
  outcome: DisplayOutcome;
  /** Earlier records this one replaces. */
  supersedes: T[];
  /** Later records that replace this one (accepted or not), in number order. */
  supersededBy: T[];
}

export function buildDecisionLinks<T extends DecisionMeta>(records: T[]): Map<string, DecisionLinks<T>> {
  const byNumber = new Map(records.map((r) => [r.number, r]));
  const result = new Map<string, DecisionLinks<T>>();
  for (const r of records) {
    const supersededBy = sortDecisions(records.filter((other) => other.supersedes.includes(r.number)));
    const replaced = supersededBy.some((other) => other.outcome === 'accepted');
    result.set(r.slug, {
      outcome: replaced ? 'superseded' : r.outcome,
      supersedes: sortDecisions(
        [...new Set(r.supersedes)].map((n) => byNumber.get(n)).filter((x): x is T => x !== undefined),
      ),
      supersededBy,
    });
  }
  return result;
}

/** Records grouped by the chapters they link to, so a chapter can list the decisions that use it. */
export function decisionsByChapter<T extends DecisionMeta>(records: T[]): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const r of sortDecisions(records)) {
    for (const chapter of new Set(r.chapters)) result.set(chapter, [...(result.get(chapter) ?? []), r]);
  }
  return result;
}

export const OUTCOME_LABELS: Record<DisplayOutcome, string> = {
  proposed: 'Proposed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  deprecated: 'Deprecated',
  superseded: 'Superseded',
};
