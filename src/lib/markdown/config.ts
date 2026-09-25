/**
 * The single Markdown pipeline configuration, shared by astro.config.mjs and the tests,
 * so what the tests render is exactly what the site renders.
 */
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { AstroMarkdownOptions } from '@astrojs/markdown-remark';
import { remarkCallouts } from './callouts';
import { remarkUnsupportedComponents } from './components';
import { remarkNormalizeHeadings } from './headings';
import { rehypeMermaid } from './mermaid';
import { rehypeTableScroll } from './tables';
import { rehypeTaskListLabels } from './task-lists';

export const sharedMarkdownOptions = {
  syntaxHighlight: {
    type: 'shiki',
    // Mermaid blocks are turned into diagrams by rehypeMermaid and rendered in the browser.
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
      remarkUnsupportedComponents,
      {
        onRemove: (name: string, file: { path?: string }) =>
          console.warn(`[systemly] <${name}> is not supported in Markdown and was not rendered${file.path ? ` (${file.path})` : ''}.`),
      },
    ],
    remarkNormalizeHeadings,
    // $inline$ and $$display$$ math. Rendered at build time as MathML, which browsers draw
    // natively: no math JavaScript, stylesheet or fonts are sent.
    remarkMath,
    [
      remarkCallouts,
      {
        onUnknown: (marker: string) =>
          console.warn(`[systemly] Unknown callout "[!${marker}]" left as a blockquote.`),
      },
    ],
  ],
  rehypePlugins: [
    [rehypeKatex, { output: 'mathml', throwOnError: false }],
    rehypeMermaid,
    rehypeTableScroll,
    rehypeTaskListLabels,
  ],
});

export const markdownConfig = {
  ...sharedMarkdownOptions,
  processor: markdownProcessor,
};
