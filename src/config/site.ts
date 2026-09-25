export interface NavItem {
  label: string;
  href: string;
}

export const site = {
  name: 'Systemly',
  tagline: 'Think about systems systematically.',
  description: 'Learn how systems work, grow, and evolve.',
  lang: 'en',
  // Sections are added here as each phase ships, so the header never links to a missing page.
  nav: [
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Library', href: '/learn' },
    { label: 'Advisor', href: '/advisor' },
    { label: 'Evolution', href: '/evolution' },
    { label: 'Playground', href: '/playground' },
    { label: 'Decisions', href: '/decisions' },
  ] as NavItem[],
};
