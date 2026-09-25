/**
 * The one place pages read decision records from. Applies the same publishing rules
 * as chapters: drafts only in review builds, dev-only fixtures never in production.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { getCurriculum } from '../content/chapters';
import { SHOW_DRAFTS } from '../content/env';
import { isVisible } from '../content/rules';
import {
  buildDecisionLinks,
  findIdentityIssues,
  findLinkIssues,
  type DecisionLinks,
  type DisplayOutcome,
} from './records';
import type { DecisionData } from './schema';

export type DecisionEntry = CollectionEntry<'decisions'>;
export type DecisionRecord = DecisionData & { displayOutcome: DisplayOutcome };

export interface DecisionCatalog {
  /** Every record that gets a page in this build, in number order. */
  entries: DecisionEntry[];
  records: DecisionRecord[];
  links: Map<string, DecisionLinks<DecisionRecord>>;
}

let catalog: Promise<DecisionCatalog> | undefined;

/** Loaded and validated once per build. Broken links between records or to chapters fail the build. */
export function getDecisionCatalog(): Promise<DecisionCatalog> {
  catalog ??= load();
  return catalog;
}

async function load(): Promise<DecisionCatalog> {
  const [all, curriculum] = await Promise.all([getCollection('decisions'), getCurriculum()]);

  const entries = all
    .filter((e) => isVisible(e.data.status, SHOW_DRAFTS))
    .sort((a, b) => a.data.number - b.data.number);

  const issues = [
    // Numbers and slugs are unique across every record, drafts included.
    ...findIdentityIssues(all.map((e) => ({ ...e.data, source: e.filePath }))),
    // Links are checked for the records in this build, against the chapters in this build.
    ...findLinkIssues(
      entries.map((e) => ({ ...e.data, source: e.filePath })),
      new Set(curriculum.map((c) => c.slug)),
    ),
  ];
  if (issues.length > 0) throw new Error(`Broken decision records:\n  ${issues.join('\n  ')}`);
  // Links are computed over published records only, so no page links to an unpublished one.
  const baseLinks = buildDecisionLinks(entries.map((e) => e.data));
  const records = entries.map((e) => ({ ...e.data, displayOutcome: baseLinks.get(e.data.slug)!.outcome }));
  return { entries, records, links: buildDecisionLinks(records) };
}
