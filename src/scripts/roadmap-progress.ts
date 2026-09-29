/**
 * Roadmap: the reader's own progress, from what they have read in this browser
 * (src/lib/reading/store.ts), and the level strip.
 *
 * - Each level chip's ring fills with the share of its available chapters read.
 * - Each level shows one cell per available chapter (read, started or not yet) and
 *   "2 of 14 read · 14%"; each chapter row shows a slim bar and its percentage.
 *   Nothing is shown until the reader has started at least one chapter.
 * - The chip for the level on screen is highlighted and kept in view in the strip.
 */
import { chapterState, groupSummary, loadLog, type ReadingLog } from '../lib/reading/store';

const slugsOf = (el: HTMLElement) => (el.dataset.slugs ?? '').split(' ').filter(Boolean);

export function initRoadmapProgress(): void {
  const log = loadLog();
  if (Object.keys(log).length > 0) showProgress(log);
  followLevels();
}

function showProgress(log: ReadingLog): void {
  for (const chip of document.querySelectorAll<HTMLElement>('.level-chip')) {
    const { read, total, percent } = groupSummary(slugsOf(chip), log);
    chip.querySelector<SVGCircleElement>('.level-chip__fill')?.style.setProperty('stroke-dashoffset', String(100 - percent));
    chip.classList.toggle('is-done', total > 0 && read === total);
    if (total > 0) chip.title = `${read} of ${total} available chapters read`;
  }

  for (const level of document.querySelectorAll<HTMLElement>('.reader-progress')) {
    const { read, total, percent } = groupSummary(slugsOf(level), log);
    for (const cell of level.querySelectorAll<HTMLElement>('.reader-progress__cell')) {
      const progress = log[cell.dataset.slug ?? ''];
      cell.dataset.state = chapterState(progress);
      if (progress) cell.style.setProperty('--cell-fill', `${Math.round(progress * 100)}%`);
    }
    const label = level.querySelector<HTMLElement>('.reader-progress__label');
    if (label) {
      label.innerHTML = '';
      const strong = document.createElement('strong');
      strong.textContent = `${read} of ${total} read`;
      label.append(strong, ` · ${percent}%`);
    }
    level.hidden = false;
  }

  for (const row of document.querySelectorAll<HTMLElement>('.row-progress')) {
    const progress = log[row.dataset.slug ?? ''];
    if (!progress) continue;
    const state = chapterState(progress);
    row.dataset.state = state;
    row.style.setProperty('--progress', String(progress));
    const value = row.querySelector<HTMLElement>('.row-progress__value');
    if (value) value.textContent = state === 'read' ? 'Read ✓' : `${Math.round(progress * 100)}% read`;
    row.hidden = false;
  }
}

/** Highlights the chip of the level being viewed and scrolls the strip (not the page) to it. */
function followLevels(): void {
  const strip = document.querySelector<HTMLElement>('.level-jump ol');
  const chips = new Map(
    [...document.querySelectorAll<HTMLElement>('.level-chip')].map((chip) => [`level-${chip.dataset.level}`, chip]),
  );
  const sections = [...document.querySelectorAll<HTMLElement>('section.level')];
  if (!strip || sections.length === 0) return;

  let current: HTMLElement | undefined;
  const select = (chip: HTMLElement | undefined) => {
    if (!chip || chip === current) return;
    current?.removeAttribute('aria-current');
    chip.setAttribute('aria-current', 'true');
    current = chip;
    const left = chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  };

  // The current level is the last one whose top has passed a line just below the sticky strip.
  let frame = 0;
  const update = () => {
    frame = 0;
    const line = strip.getBoundingClientRect().bottom + 24;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) active = section;
      else break;
    }
    select(chips.get(active.id));
  };
  addEventListener('scroll', () => (frame ||= requestAnimationFrame(update)), { passive: true });
  update();
}
