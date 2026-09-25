/**
 * The one place pages read "Why not?" comparisons from. Same publishing rules as chapters:
 * drafts only in review builds.
 */
import { getCollection } from 'astro:content';
import { getCurriculum } from '../content/chapters';
import { SHOW_DRAFTS } from '../content/env';
import { isVisible } from '../content/rules';
import { findChapterIssues, sortComparisons } from './compare';
import type { Comparison } from './schema';

let comparisons: Promise<Comparison[]> | undefined;

/** Published comparisons in order. Links to missing chapters fail the build. */
export function getComparisons(): Promise<Comparison[]> {
  comparisons ??= load();
  return comparisons;
}

async function load(): Promise<Comparison[]> {
  const [entries, curriculum] = await Promise.all([getCollection('whyNot'), getCurriculum()]);
  const list = sortComparisons(
    entries.filter((e) => isVisible(e.data.status, SHOW_DRAFTS)).map((e) => ({ ...e.data, id: e.id })),
  );
  const issues = findChapterIssues(list, new Set(curriculum.map((c) => c.slug)));
  if (issues.length > 0) throw new Error(`Broken "Why not?" links:\n  ${issues.join('\n  ')}`);
  return list;
}
