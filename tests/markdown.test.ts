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

describe('math', () => {
  it('renders display math as MathML, with no KaTeX HTML or stylesheet', async () => {
    const out = await html(String.raw`$$
\text{Memory} \approx a + (b \times c)
$$`);
    expect(out).toContain('<math');
    expect(out).toContain('display="block"');
    expect(out).toContain('<mtext>Memory</mtext>');
    expect(out).not.toContain('katex-html');
    expect(out).not.toContain('$$');
  });

  it('leaves a lone dollar sign in prose as text', async () => {
    expect(await html('It costs $5 a month.')).toContain('It costs $5 a month.');
  });
});

describe('unsupported components', () => {
  it('removes a self-closing component tag and reports it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = await html(`Before.

<AsyncImageGroup query={["a","b"]} aspectRatio="5:4" layout="carousel"/>

After.`);
    expect(out).not.toMatch(/asyncimagegroup/i);
    expect(out).toContain('<p>Before.</p>');
    expect(out).toContain('<p>After.</p>');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('<AsyncImageGroup> is not supported'));
    warn.mockRestore();
  });

  it('removes a layout wrapper holding only components and reports them', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = await html(`Before.

<row align="center" gap={3}>
  <AsyncImage query="a" aspectRatio="1:1" maxWidth="64px"/>
  <AsyncImage query="b" aspectRatio="1:1" maxWidth="64px"/>
</row>

After.`);
    expect(out).not.toMatch(/<row|asyncimage/i);
    expect(out).toContain('<p>Before.</p>');
    expect(out).toContain('<p>After.</p>');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('<AsyncImage> is not supported'));
    warn.mockRestore();
  });

  it('keeps a wrapper that also holds ordinary content', async () => {
    expect(await html('<div>\n  <p>Text</p>\n  <Widget/>\n</div>')).toContain('<p>Text</p>');
  });

  it('keeps ordinary HTML', async () => {
    expect(await html(`<details><summary>More</summary>

Text

</details>`)).toContain('<details>');
    expect(await html('Line<br/>break')).toContain('<br');
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

  it('drops a leading H1 that is the chapter number and the title', async () => {
    const render2 = async (markdown: string) =>
      (await renderer.render(markdown, { frontmatter: { title: 'Computer Fundamentals', chapter: '00.02' } })).code;
    for (const heading of ['00.02 — Computer Fundamentals', '00.02 - Computer Fundamentals', '00.02: Computer Fundamentals', '00.02 Computer Fundamentals']) {
      expect(await render2(`# ${heading}

## Learning Objective`)).not.toContain('Computer Fundamentals</h');
    }
    // A different chapter number is content, not a repeated title.
    expect(await render2(`# 00.03 — Computer Fundamentals

Text.`)).toContain('00.03 — Computer Fundamentals</h2>');
  });

  it('drops a leading H1 that is the title with an expansion in brackets', async () => {
    const render2 = async (markdown: string) =>
      (await renderer.render(markdown, { frontmatter: { title: 'DNS', chapter: '00.05' } })).code;
    for (const heading of ['00.05 — DNS (Domain Name System)', 'DNS (Domain Name System)']) {
      const out = await render2(`# ${heading}\n\n## Learning Objective`);
      expect(out).not.toContain('Domain Name System');
      expect(out).toContain('<h2 id="learning-objective">Learning Objective</h2>');
    }
    // Other words after the title are content, not a repeat.
    expect(await render2('# DNS Records (A, AAAA)\n\nText.')).toContain('DNS Records (A, AAAA)</h2>');
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
