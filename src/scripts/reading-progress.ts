/**
 * Chapter reading progress:
 *
 * - a thin bar across the top of the viewport that fills as the reader moves through the
 *   chapter text (not the related topics and pager below it);
 * - "N min left" beside "On this page", counting down;
 * - in the table of contents, the section being read is highlighted (aria-current) and the
 *   sections before it are marked as read; on wide screens a rail beside it fills too;
 * - the furthest point reached is saved in this browser (the Roadmap shows it), and a reader
 *   who comes back to a chapter they had started is offered "Continue reading".
 *
 * Reads layout once per animation frame at most, and only while the reader scrolls or the
 * page resizes (diagrams render after load and change the chapter's height).
 */
import { activeSection, readingMinutes, readingProgress, timeLeftLabel } from '../lib/reading/progress';
import { loadLog, READ_AT, recordProgress } from '../lib/reading/store';

/** A section counts as being read once its heading passes this far down the viewport. */
const ACTIVE_LINE = 0.25;
/** Saved progress between these offers "Continue reading" (not for a chapter barely started or done). */
const RESUME_FROM = 0.05;

export function initReadingProgress(): void {
  const prose = document.querySelector<HTMLElement>('.chapter .prose');
  const root = document.querySelector<HTMLElement>('.reading-progress');
  const bar = root?.querySelector<HTMLElement>('.reading-progress__bar');
  if (!prose || !root || !bar) return;
  const slug = root.dataset.slug ?? '';
  let saved = loadLog()[slug] ?? 0;
  const resume = setupResume(prose, saved);

  const rail = document.querySelector<HTMLElement>('.toc__rail-fill');
  const labels = [...document.querySelectorAll<HTMLElement>('[data-reading-left]')];
  const minutes = readingMinutes(countWords(prose));

  // Table of contents links (inline and side), grouped by the heading they point to.
  const links = new Map<string, HTMLAnchorElement[]>();
  for (const link of document.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]')) {
    const id = decodeURIComponent(link.hash.slice(1));
    links.set(id, [...(links.get(id) ?? []), link]);
  }
  const headings = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  const sideNav = document.querySelector<HTMLElement>('.toc--side nav');

  let frame = 0;
  let lastLabel = '';
  let lastActive = -2;

  const update = () => {
    frame = 0;
    const viewport = window.innerHeight;
    const rect = prose.getBoundingClientRect();
    const progress = readingProgress(rect.top, rect.height, viewport);
    const active = activeSection(
      headings.map((h) => h.getBoundingClientRect().top),
      viewport * ACTIVE_LINE,
    );

    bar.style.transform = `scaleX(${progress})`;
    if (slug && (progress >= saved + 0.01 || (progress === 1 && saved < 1))) saved = recordProgress(slug, progress);
    if (progress > RESUME_FROM) resume?.hide();
    if (rail) rail.style.transform = `scaleY(${progress})`;

    const label = timeLeftLabel(minutes, progress);
    if (label !== lastLabel) {
      for (const el of labels) el.textContent = label;
      lastLabel = label;
    }

    if (active !== lastActive) {
      headings.forEach((heading, i) => {
        for (const link of links.get(heading.id) ?? []) {
          if (i === active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
          link.toggleAttribute('data-read', i < active);
        }
      });
      lastActive = active;
      keepInView(sideNav, active >= 0 ? links.get(headings[active].id) : undefined);
    }
  };

  const schedule = () => {
    frame ||= requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  new ResizeObserver(schedule).observe(prose);
  schedule();
}

/**
 * "Continue reading · 42%": shown when the reader returns to a chapter they had started and
 * is at its top. Scrolls back to where they were; hides once they scroll or dismiss it.
 */
function setupResume(prose: HTMLElement, saved: number): { hide: () => void } | undefined {
  const box = document.querySelector<HTMLElement>('.reading-resume');
  if (!box || saved <= RESUME_FROM || saved >= READ_AT || location.hash) return undefined;
  const go = box.querySelector<HTMLButtonElement>('[data-resume]');
  const close = box.querySelector<HTMLButtonElement>('[data-resume-close]');
  const percent = box.querySelector<HTMLElement>('[data-resume-percent]');
  if (percent) percent.textContent = `${Math.round(saved * 100)}%`;

  const hide = () => {
    box.hidden = true;
  };
  go?.addEventListener('click', () => {
    const rect = prose.getBoundingClientRect();
    const top = scrollY + rect.top + saved * Math.max(0, rect.height - innerHeight);
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    hide();
  });
  close?.addEventListener('click', hide);
  box.hidden = false;
  return { hide };
}

/** Words in the chapter text, leaving out diagrams (their text copy repeats the labels). */
function countWords(prose: HTMLElement): number {
  const copy = prose.cloneNode(true) as HTMLElement;
  for (const figure of copy.querySelectorAll('figure[data-diagram], figure[data-calculator]')) figure.remove();
  return (copy.textContent ?? '').split(/\s+/).filter(Boolean).length;
}

/** Scrolls the side table of contents (not the page) so the current section stays visible. */
function keepInView(nav: HTMLElement | null, links: HTMLAnchorElement[] | undefined): void {
  const link = links?.find((l) => nav?.contains(l));
  if (!nav || !link || nav.scrollHeight <= nav.clientHeight) return;
  const top = link.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop;
  const margin = nav.clientHeight / 3;
  if (top < nav.scrollTop + margin || top > nav.scrollTop + nav.clientHeight - margin) {
    nav.scrollTop = top - margin;
  }
}
