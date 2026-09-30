/**
 * The reader's progress through each chapter, kept in this browser only (localStorage):
 * { [slug]: furthest progress, 0 to 1 }. Every access tolerates storage being unavailable
 * (private windows, blocked site data): the page then simply shows no saved progress.
 */

const KEY = 'systemly-reading';

/** A chapter counts as read from this far through. */
export const READ_AT = 0.95;

export type ReadingLog = Record<string, number>;

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Parses a saved log, keeping only valid entries. */
export function parseLog(raw: string | null | undefined): ReadingLog {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const log: ReadingLog = {};
    for (const [slug, progress] of Object.entries(value)) {
      if (typeof progress === 'number' && progress > 0) log[slug] = Math.min(1, progress);
    }
    return log;
  } catch {
    return {};
  }
}

export function loadLog(store: Storage | undefined = storage()): ReadingLog {
  try {
    return parseLog(store?.getItem(KEY));
  } catch {
    return {};
  }
}

/** Records progress for a chapter, keeping the furthest point reached. Returns the saved value. */
export function recordProgress(slug: string, progress: number, store: Storage | undefined = storage()): number {
  const log = loadLog(store);
  const furthest = Math.max(log[slug] ?? 0, Math.min(1, progress));
  if (furthest > (log[slug] ?? 0)) {
    log[slug] = furthest;
    try {
      store?.setItem(KEY, JSON.stringify(log));
    } catch {
      // Storage full or blocked: progress is simply not remembered.
    }
  }
  return furthest;
}

export type ChapterState = 'read' | 'started' | 'unread';

export function chapterState(progress: number | undefined): ChapterState {
  if (!progress) return 'unread';
  return progress >= READ_AT ? 'read' : 'started';
}

/** Summary for a group of chapters (e.g. a level): how many are read, and the share read. */
export function groupSummary(slugs: readonly string[], log: ReadingLog): { read: number; total: number; percent: number } {
  const total = slugs.length;
  const read = slugs.filter((slug) => chapterState(log[slug]) === 'read').length;
  return { read, total, percent: total ? Math.round((read / total) * 100) : 0 };
}

/**
 * The group (e.g. a level) the reader is working through: the first one with an available
 * chapter not yet read. Groups without chapters are skipped; once everything is read it is
 * the last group with chapters, and with nothing read at all it is the first.
 */
export function currentGroupIndex(groups: readonly (readonly string[])[], log: ReadingLog): number {
  let last = -1;
  for (const [index, slugs] of groups.entries()) {
    if (slugs.length === 0) continue;
    if (slugs.some((slug) => chapterState(log[slug]) !== 'read')) return index;
    last = index;
  }
  return Math.max(last, 0);
}
