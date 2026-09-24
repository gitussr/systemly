import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { MarkdownRenderer } from '@astrojs/markdown-remark';
import { markdownProcessor, sharedMarkdownOptions } from '../src/lib/markdown/config';
import { resolveCalloutType } from '../src/lib/markdown/callouts';

let renderer: MarkdownRenderer;

beforeAll(async () => {
  renderer = await markdownProcessor.createRenderer(sharedMarkdownOptions);
});

const html = async (markdown: string) => (await renderer.render(markdown)).code;

describe('callouts', () => {
  it('renders a Systemly callout with its default title', async () => {
    const out = await html('> [!TRADE-OFF]\n> Replicas add read capacity.');
    expect(out).toContain('class="callout callout--trade-off"');
    expect(out).toContain('role="note"');
    expect(out).toContain('<p class="callout__title">Trade-off</p>');
    expect(out).toContain('<p>Replicas add read capacity.</p>');
    expect(out).not.toContain('[!TRADE-OFF]');
    expect(out).not.toContain('<blockquote');
  });

  it('uses text after the marker as a custom title', async () => {
    const out = await html('> [!FAILURE] When the cache is cold\n> Requests hit the database.');
    expect(out).toContain('<p class="callout__title">When the cache is cold</p>');
    expect(out).toContain('<p>Requests hit the database.</p>');
  });

  it('keeps multiple paragraphs and inline formatting', async () => {
    const out = await html('> [!NOTE]\n> First **bold**.\n>\n> Second `code`.');
    expect(out).toContain('<p>First <strong>bold</strong>.</p>');
    expect(out).toContain('<p>Second <code>code</code>.</p>');
  });

  it('accepts common spelling variants', () => {
    expect(resolveCalloutType('tradeoff')?.id).toBe('trade-off');
    expect(resolveCalloutType('LOCKIN')?.id).toBe('lock-in');
    expect(resolveCalloutType('mental-model')?.label).toBe('Mental model');
  });

  it('leaves unknown markers and plain blockquotes untouched', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = await html('> [!BANANA]\n> text');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('[!BANANA]');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[!BANANA]'));
    warn.mockRestore();

    expect(await html('> Just a quote.')).toContain('<blockquote>');
  });
});

describe('content preservation', () => {
  it('does not rewrite quotes, dashes or ellipses', async () => {
    const out = await html('Say "hi" -- then wait...');
    expect(out).toContain('"hi" -- then wait...');
  });

  it('highlights code and turns mermaid into a diagram figure with its source as fallback', async () => {
    const ts = await html('```ts\nconst a = 1;\n```');
    expect(ts).toContain('astro-code');

    const mermaid = await html('```mermaid\nflowchart LR\n  A --> B\n```');
    expect(mermaid).not.toContain('astro-code');
    expect(mermaid).toMatch(
      /^<figure class="diagram" data-diagram="mermaid"><pre class="diagram__fallback"><code>flowchart LR/,
    );
    expect(mermaid).toMatch(/A --(?:>|&gt;|&#x3E;) B/);
  });

  it('only turns mermaid blocks into diagrams', async () => {
    const out = await html('```text\nflowchart LR\n```');
    expect(out).not.toContain('data-diagram');
  });
});

describe('tables', () => {
  it('wraps tables in a focusable scroll region', async () => {
    const out = await html('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(out).toMatch(/<div class="table-scroll" tabindex="0" role="region" aria-label="Table">\s*<table>/);
  });
});

describe('task lists', () => {
  it('labels checkboxes with their state', async () => {
    const out = await html('- [x] done\n- [ ] open');
    expect(out).toContain('aria-label="Completed"');
    expect(out).toContain('aria-label="Not completed"');
  });
});

describe('heading normalisation', () => {
  const render = async (markdown: string, title?: string) =>
    (await renderer.render(markdown, { frontmatter: title ? { title } : {} })).code;

  it('drops a leading H1 that repeats the title and demotes # sections', async () => {
    const out = await render('# What Is a System?\n\nIntro.\n\n# 1. Components\n\n## Detail\n\n### Key idea', 'What Is a System?');
    expect(out).not.toContain('What Is a System?</h');
    expect(out).toContain('<h2 id="1-components">1. Components</h2>');
    expect(out).toContain('<h3 id="detail">Detail</h3>');
    expect(out).toContain('<h4 id="key-idea">Key idea</h4>');
    expect(out).not.toContain('<h1');
  });

  it('keeps a leading H1 that differs from the title, demoted', async () => {
    const out = await render('# Something else\n\nText.', 'Title');
    expect(out).toContain('<h2 id="something-else">Something else</h2>');
  });

  it('lifts headings written before the first # section so no level is skipped', async () => {
    const out = await render(
      [
        '# Title',
        '## Learning Objective',
        '### Detail',
        '## In One Sentence',
        '# 1. First',
        '## Sub',
      ].join('\n\n'),
      'Title',
    );
    expect(out).toContain('<h2 id="learning-objective">Learning Objective</h2>');
    expect(out).toContain('<h3 id="detail">Detail</h3>');
    expect(out).toContain('<h2 id="in-one-sentence">In One Sentence</h2>');
    expect(out).toContain('<h2 id="1-first">1. First</h2>');
    expect(out).toContain('<h3 id="sub">Sub</h3>');
  });

  it('closes skipped levels without flattening the outline', async () => {
    const out = await render(['# 1. Section', '### Important', '#### Detail', '# 2. Next'].join('\n\n'), 'T');
    expect(out).toContain('<h2 id="1-section">1. Section</h2>');
    expect(out).toContain('<h3 id="important">Important</h3>');
    expect(out).toContain('<h4 id="detail">Detail</h4>');
    expect(out).toContain('<h2 id="2-next">2. Next</h2>');
  });

  it('leaves documents that already start at ## unchanged', async () => {
    const out = await render('## Section\n\n### Sub', 'Title');
    expect(out).toContain('<h2 id="section">Section</h2>');
    expect(out).toContain('<h3 id="sub">Sub</h3>');
  });
});
