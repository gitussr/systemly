import type { IconName } from './icons';
import { tools } from './tools';

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Other pages in this section, beyond `href` and the pages below it. */
  covers?: {
    /** These pages and the pages below them. */
    trees?: string[];
    /** These pages only. */
    pages?: string[];
    /** Only the pages below these (not the pages themselves). */
    below?: string[];
  };
}

/** The two sections: learning in order, and the tools and reference beside it. */
const sections: NavItem[] = [
  // Chapter pages (/learn/<slug>) are reached from the roadmap, so they belong to it.
  { label: 'Roadmap', href: '/roadmap', icon: 'route', covers: { below: ['/learn'] } },
  // The Library index (/learn exactly) and the five tools (src/config/tools.ts).
  { label: 'System Lab', href: '/lab', icon: 'flask-conical', covers: { pages: ['/learn'], trees: tools.map((tool) => tool.href) } },
];

export const site = {
  name: 'Systemly',
  tagline: 'Think about systems systematically.',
  description: 'Learn how systems work, grow, and evolve.',
  lang: 'en',
  /** Header links on wide screens, and the bottom navigation bar below 64rem. Search is the header's icon button. */
  nav: sections,
};

/** True when `pathname` is `href` or a page below it. */
export function isCurrent(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  return path === href || path.startsWith(`${href}/`);
}

/** True when `pathname` belongs to the section: its own page tree or one it covers. */
export function inSection(pathname: string, item: NavItem): boolean {
  const path = pathname.replace(/\/$/, '') || '/';
  const { trees = [], pages = [], below = [] } = item.covers ?? {};
  return (
    isCurrent(path, item.href) ||
    trees.some((tree) => isCurrent(path, tree)) ||
    pages.includes(path) ||
    below.some((parent) => path.startsWith(`${parent}/`))
  );
}
