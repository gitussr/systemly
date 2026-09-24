/**
 * The single Markdown pipeline configuration, shared by astro.config.mjs and the tests,
 * so what the tests render is exactly what the site renders.
 */
import { unified } from '@astrojs/markdown-remark';
import type { AstroMarkdownOptions } from '@astrojs/markdown-remark';
import { remarkCallouts } from './callouts';
import { rehypeTableScroll } from './tables';
import { rehypeTaskListLabels } from './task-lists';

export const sharedMarkdownOptions = {
  syntaxHighlight: {
    type: 'shiki',
    // Mermaid is rendered as a diagram in Phase 5; until then it stays as readable source.
    excludeLangs: ['mermaid'],
  },
  shikiConfig: {
    // High-contrast light theme: github-light's orange tokens are 3.6:1 on white (below WCAG AA).
    themes: { light: 'github-light-high-contrast', dark: 'github-dark-default' },
    wrap: false,
  },
} satisfies AstroMarkdownOptions;

export const markdownProcessor = unified({
  // Content is authored deliberately: do not rewrite quotes, dashes or ellipses.
  smartypants: false,
  remarkPlugins: [
    [
      remarkCallouts,
      {
        onUnknown: (marker: string) =>
          console.warn(`[systemly] Unknown callout "[!${marker}]" left as a blockquote.`),
      },
    ],
  ],
  rehypePlugins: [rehypeTableScroll, rehypeTaskListLabels],
});

export const markdownConfig = {
  ...sharedMarkdownOptions,
  processor: markdownProcessor,
};
