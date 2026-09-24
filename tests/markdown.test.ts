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

  it('highlights code but leaves mermaid as source for the diagram phase', async () => {
    const ts = await html('```ts\nconst a = 1;\n```');
    expect(ts).toContain('astro-code');

    const mermaid = await html('```mermaid\nflowchart LR\n  A --> B\n```');
    expect(mermaid).not.toContain('astro-code');
    expect(mermaid).toContain('class="language-mermaid"');
    expect(mermaid).toMatch(/A --(?:>|&gt;|&#x3E;) B/);
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
