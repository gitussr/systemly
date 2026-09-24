import { describe, expect, it } from 'vitest';
import { buildConnections, findRelatedIssues, formatRelatedIssue } from '../src/lib/content/graph';
import type { ChapterMeta } from '../src/lib/content/catalog';

const ch = (chapter: string, slug: string, related: string[] = []): ChapterMeta & { related: string[] } => ({
  chapter,
  slug,
  title: slug,
  level: Number(chapter.slice(0, 2)),
  order: Number(chapter.slice(3)),
  status: 'placeholder',
  topics: [],
  related,
});

describe('findRelatedIssues', () => {
  it('reports unknown slugs, self-links and repeats', () => {
    const issues = findRelatedIssues([
      { slug: 'a', related: ['b', 'nope', 'a', 'b'], source: 'a.md' },
      { slug: 'b', related: [] },
    ]);
    expect(issues.map((i) => i.kind)).toEqual(['missing', 'self', 'duplicate']);
    expect(formatRelatedIssue(issues[0]!)).toBe(
      '"a" lists related "nope", but no chapter has that slug (a.md)',
    );
  });

  it('passes a clean graph', () => {
    expect(findRelatedIssues([{ slug: 'a', related: ['b'] }, { slug: 'b', related: ['a'] }])).toEqual([]);
  });
});

describe('buildConnections', () => {
  const chapters = [
    ch('00.01', 'system', ['http', 'dns']),
    ch('00.05', 'dns'),
    ch('00.06', 'http', ['system']),
    ch('02.06', 'load-balancer', ['http']),
    ch('01.01', 'anatomy', ['http', 'http']),
  ];
  const graph = buildConnections(chapters);

  it('keeps the author order for outgoing links', () => {
    expect(graph.get('system')!.related.map((c) => c.slug)).toEqual(['http', 'dns']);
  });

  it('computes incoming links in curriculum order, once each', () => {
    expect(graph.get('http')!.referencedBy.map((c) => c.slug)).toEqual(['anatomy', 'load-balancer']);
    expect(graph.get('dns')!.referencedBy.map((c) => c.slug)).toEqual(['system']);
  });

  it('does not repeat a mutual link under "referenced by"', () => {
    // system ↔ http: http already lists system as related.
    expect(graph.get('http')!.related.map((c) => c.slug)).toEqual(['system']);
    expect(graph.get('http')!.referencedBy.some((c) => c.slug === 'system')).toBe(false);
  });

  it('ignores links to unknown chapters instead of failing at render time', () => {
    const g = buildConnections([ch('00.01', 'a', ['ghost'])]);
    expect(g.get('a')!.related).toEqual([]);
  });
});
