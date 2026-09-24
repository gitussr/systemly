import { describe, expect, it } from 'vitest';
import { chapterSchema } from '../src/lib/content/schema';
import {
  assertUniqueSlugs,
  buildContentReport,
  formatContentReport,
  isDevOnlyPath,
  isVisible,
  type ReportEntry,
} from '../src/lib/content/rules';

describe('chapter schema', () => {
  it('defaults to draft so nothing is published by accident', () => {
    const data = chapterSchema.parse({ title: 'Load Balancer', slug: 'load-balancer', level: 2 });
    expect(data.status).toBe('draft');
    expect(data.related).toEqual([]);
  });

  it('rejects slugs that are not kebab-case', () => {
    expect(chapterSchema.safeParse({ title: 'X', slug: 'Load Balancer', level: 2 }).success).toBe(false);
  });

  it('rejects levels outside the roadmap', () => {
    expect(chapterSchema.safeParse({ title: 'X', slug: 'x', level: 13 }).success).toBe(false);
  });
});

describe('visibility', () => {
  it('shows drafts only in development', () => {
    expect(isVisible('draft', true)).toBe(true);
    expect(isVisible('draft', false)).toBe(false);
    expect(isVisible('placeholder', false)).toBe(true);
    expect(isVisible('approved', false)).toBe(true);
  });

  it('treats underscore folders as dev-only fixtures', () => {
    expect(isDevOnlyPath('_samples/rendering-test.md')).toBe(true);
    expect(isDevOnlyPath('scaling\\_wip\\x.md')).toBe(true);
    expect(isDevOnlyPath('scaling/load-balancer.md')).toBe(false);
    expect(isDevOnlyPath('_file-at-root.md')).toBe(false);
  });
});

describe('slug uniqueness', () => {
  it('lists every duplicate', () => {
    expect(() =>
      assertUniqueSlugs([
        { slug: 'cache', source: 'a.md' },
        { slug: 'cache', source: 'b.md' },
        { slug: 'queue', source: 'c.md' },
      ]),
    ).toThrow(/"cache": a\.md, b\.md/);
  });

  it('passes when slugs are unique', () => {
    expect(() => assertUniqueSlugs([{ slug: 'a', source: 'a.md' }])).not.toThrow();
  });
});

describe('content report', () => {
  const entry = (title: string, level: number, status: ReportEntry['data']['status']): ReportEntry => ({
    source: `content/${title}.md`,
    data: { title, slug: title.toLowerCase(), level, status },
  });

  it('reports placeholders as CONTENT REQUIRED, ordered by level', () => {
    const report = buildContentReport([
      entry('Sharding', 4, 'placeholder'),
      entry('TCP', 0, 'placeholder'),
      entry('DNS', 0, 'approved'),
      entry('Queues', 5, 'draft'),
      { source: 'content/lb.md', data: { title: 'Load Balancer', slug: 'load-balancer', level: 2, status: 'placeholder', chapter: '02.06' } },
    ]);
    expect(formatContentReport(report)).toEqual([
      'Content: 1 approved, 3 placeholder, 1 draft',
      'CONTENT REQUIRED: Level 0 — TCP (content/TCP.md)',
      'CONTENT REQUIRED: 02.06 Load Balancer (content/lb.md)',
      'CONTENT REQUIRED: Level 4 — Sharding (content/Sharding.md)',
      'Draft, not published: Level 5 — Queues (content/Queues.md)',
    ]);
  });
});
