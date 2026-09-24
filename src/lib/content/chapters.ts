/**
 * The one place pages read chapters from. Applies the publishing rules
 * (drafts only in dev, dev-only fixtures never in navigation) and curriculum order.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { sortChapters } from './catalog';
import { SHOW_DRAFTS } from './env';
import { isDevOnlyPath, isVisible } from './rules';

export type ChapterEntry = CollectionEntry<'chapters'>;

/** Every chapter that gets a page in this build. */
export async function getPublishedChapters(): Promise<ChapterEntry[]> {
  return getCollection('chapters', ({ data }) => isVisible(data.status, SHOW_DRAFTS));
}

/** Entries listed in the roadmap, library, search and previous/next links (no dev fixtures). */
export async function getCurriculumEntries(): Promise<ChapterEntry[]> {
  const entries = await getPublishedChapters();
  return entries.filter((entry) => !isDevOnlyPath(entry.filePath ?? ''));
}

/** Curriculum metadata in curriculum order. */
export async function getCurriculum(): Promise<ChapterEntry['data'][]> {
  return sortChapters((await getCurriculumEntries()).map((entry) => entry.data));
}
