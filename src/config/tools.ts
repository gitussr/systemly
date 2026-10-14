import type { IconName } from './icons';

/**
 * The five interactive tools, in the order a reader would use them on one design:
 * start with a suggestion, try it, see it grow, compare a choice, record the decision.
 * The home page, the "More" sheet and each tool's "How the tools fit together" panel read from here.
 */
export interface Tool {
  label: string;
  href: string;
  icon: IconName;
  /** The step this tool covers in the path, one word. */
  step: string;
  /** The question a reader brings to this tool. */
  question: string;
  /** What the tool does, in one or two sentences. */
  summary: string;
  /** Why the next tool in the path follows from this one. */
  next?: string;
}

export const tools: Tool[] = [
  {
    label: 'Advisor',
    href: '/advisor',
    icon: 'compass',
    step: 'Start',
    question: 'What should I build first?',
    summary:
      'Describe your application (users, traffic, data, team) and get a starting architecture, with why each part is there and what it costs.',
    next: 'Build that suggestion yourself in the Playground and see which warnings it raises.',
  },
  {
    label: 'Playground',
    href: '/playground',
    icon: 'shapes',
    step: 'Try',
    question: 'Does my design hold up?',
    summary:
      'Place components, connect them in the direction requests flow, and read the warnings: each points out a common mistake and why it matters.',
    next: 'See how a design like yours has to change as users grow, in the Evolution simulator.',
  },
  {
    label: 'Evolution',
    href: '/evolution',
    icon: 'sprout',
    step: 'Grow',
    question: 'What changes as it grows?',
    summary:
      'Step through a system as it grows (a web application, a content site, an online store): the problem that appears, what is measured, the one change made, and its trade-off. Any stage opens in the Advisor.',
    next: 'Each change is a choice between options. Why not? compares them for one need.',
  },
  {
    label: 'Why not?',
    href: '/why-not',
    icon: 'git-compare',
    step: 'Compare',
    question: 'Which option fits this need?',
    summary:
      'Start from one need (for example, reducing database read load) and compare the solutions that could meet it: when each makes sense, and when it does not.',
    next: 'Once you choose, a decision record keeps why, at what cost, and how to undo it.',
  },
  {
    label: 'Decisions',
    href: '/decisions',
    icon: 'notebook-pen',
    step: 'Record',
    question: 'Why was this chosen?',
    summary:
      'Architecture Decision Records: the context, the options compared, what was decided and why, what it costs, how it can fail, and how to reverse it.',
  },
];

export const isTool = (href: string) => tools.some((tool) => tool.href === href);
export const toolFor = (href: string) => tools.find((tool) => tool.href === href);
