/**
 * Pure helpers for the chapter reading progress (src/scripts/reading-progress.ts).
 */

/** Reading speed for technical prose, in words per minute. */
export const WORDS_PER_MINUTE = 200;

/**
 * How far the reader is through the article, from 0 to 1.
 *
 * 0 while the article's top is still at or below the top of the viewport; 1 once its bottom
 * has reached the bottom of the viewport. An article shorter than the viewport counts as read
 * as soon as all of it is on screen.
 *
 * @param top      The article's top edge, relative to the viewport (getBoundingClientRect().top).
 * @param height   The article's height.
 * @param viewport The viewport height.
 */
export function readingProgress(top: number, height: number, viewport: number): number {
  const scrollable = height - viewport;
  if (scrollable <= 0) return top + height <= viewport ? 1 : 0;
  return Math.min(1, Math.max(0, -top / scrollable));
}

/** Reading time for a word count, in minutes (at least 1 for any text). */
export function readingMinutes(words: number): number {
  return words > 0 ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0;
}

/** The "time left" label for a chapter of `minutes` read to `progress`. */
export function timeLeftLabel(minutes: number, progress: number): string {
  if (minutes <= 0) return '';
  if (progress >= 0.99) return 'Finished';
  const left = minutes * (1 - progress);
  if (left < 1) return 'Under a minute left';
  return `${Math.ceil(left)} min left`;
}

/**
 * The section being read: the last heading whose top has passed `line` (a point near the top
 * of the viewport), or -1 before the first one.
 *
 * @param tops Each section heading's top edge relative to the viewport, in document order.
 */
export function activeSection(tops: readonly number[], line: number): number {
  let active = -1;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= line) active = i;
    else break;
  }
  return active;
}
