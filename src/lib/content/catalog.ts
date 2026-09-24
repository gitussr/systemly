/**
 * Pure functions that turn chapter metadata into navigation structures:
 * curriculum order, roadmap levels, the A–Z library and previous/next links.
 */
import { LEVEL_NAMES } from './levels';
import type { ChapterData } from './schema';

export type ChapterMeta = Pick<
  ChapterData,
  'title' | 'slug' | 'level' | 'order' | 'status' | 'topics'
> &
  Partial<Pick<ChapterData, 'chapter' | 'summary'>>;

export function isAvailable(chapter: Pick<ChapterData, 'status'>): boolean {
  return chapter.status !== 'placeholder';
}

export function sortChapters<T extends ChapterMeta>(chapters: T[]): T[] {
  return [...chapters].sort(
    (a, b) =>
      a.level - b.level ||
      a.order - b.order ||
      (a.chapter ?? '').localeCompare(b.chapter ?? '') ||
      a.title.localeCompare(b.title),
  );
}

export interface RoadmapLevel<T extends ChapterMeta> {
  level: number;
  name: string;
  chapters: T[];
  available: number;
}

/** Every roadmap level in order, including levels that have no chapters yet. */
export function groupByLevel<T extends ChapterMeta>(chapters: T[]): RoadmapLevel<T>[] {
  const sorted = sortChapters(chapters);
  const levels = new Set([...Object.keys(LEVEL_NAMES).map(Number), ...sorted.map((c) => c.level)]);
  return [...levels]
    .sort((a, b) => a - b)
    .map((level) => {
      const inLevel = sorted.filter((c) => c.level === level);
      return {
        level,
        name: LEVEL_NAMES[level] ?? `Level ${level}`,
        chapters: inLevel,
        available: inLevel.filter(isAvailable).length,
      };
    });
}

export interface LetterGroup<T extends ChapterMeta> {
  letter: string;
  chapters: T[];
}

/** A–Z index by title. Titles that do not start with a letter are grouped under "#". */
export function groupAlphabetically<T extends ChapterMeta>(chapters: T[]): LetterGroup<T>[] {
  const groups = new Map<string, T[]>();
  const byTitle = [...chapters].sort(
    (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }) || a.level - b.level,
  );
  for (const chapter of byTitle) {
    const first = chapter.title.trim().charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : '#';
    groups.set(letter, [...(groups.get(letter) ?? []), chapter]);
  }
  return [...groups]
    .sort(([a], [b]) => (a === '#' ? -1 : b === '#' ? 1 : a.localeCompare(b)))
    .map(([letter, list]) => ({ letter, chapters: list }));
}

/** Previous and next chapter in curriculum order, across level boundaries. */
export function neighbours<T extends ChapterMeta>(
  chapters: T[],
  slug: string,
): { previous?: T; next?: T } {
  const sorted = sortChapters(chapters);
  const index = sorted.findIndex((c) => c.slug === slug);
  if (index === -1) return {};
  return { previous: sorted[index - 1], next: sorted[index + 1] };
}

/** The first published chapter in curriculum order: where a beginner should start. */
export function firstAvailable<T extends ChapterMeta>(chapters: T[]): T | undefined {
  return sortChapters(chapters).find(isAvailable);
}
