import type { IconName } from './icons';
import { tools } from './tools';

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** A short line under the label where there is room (the "More" sheet): the question a tool answers. */
  hint?: string;
}

// Sections are added here as each phase ships, so navigation never links to a missing page.
const sections: NavItem[] = [
  { label: 'Roadmap', href: '/roadmap', icon: 'route' },
  { label: 'Library', href: '/learn', icon: 'library-big' },
  // The tools, in the order they are used on one design (src/config/tools.ts).
  ...tools.map(({ label, href, icon, question }) => ({ label, href, icon, hint: question })),
];

const search: NavItem = { label: 'Search', href: '/search', icon: 'search' };

/** The bottom bar holds at most five tabs (Material 3): four destinations and "More". */
const BAR_HREFS = ['/roadmap', '/learn', '/search', '/advisor'];

export const site = {
  name: 'Systemly',
  tagline: 'Think about systems systematically.',
  description: 'Learn how systems work, grow, and evolve.',
  lang: 'en',
  /** Header links on wide screens. Search is the header's icon button. */
  nav: sections,
  /** Phones and tablets: the bottom navigation bar, and the rest in its "More" sheet. */
  bar: BAR_HREFS.map((href) => [...sections, search].find((item) => item.href === href)!),
  more: sections.filter((item) => !BAR_HREFS.includes(item.href)),
};

/** True when `pathname` is `href` or a page below it. */
export function isCurrent(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  return path === href || path.startsWith(`${href}/`);
}
