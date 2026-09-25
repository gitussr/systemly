import { describe, expect, it } from 'vitest';
import {
  comparisonsByChapter,
  findChapterIssues,
  missingExplanations,
  sortComparisons,
  whyNotHref,
} from '../src/lib/why-not/compare';
import { comparisonSchema, type Comparison } from '../src/lib/why-not/schema';
import { toComparisonSearchDocument } from '../src/lib/search/documents';

const solutions = [
  { name: 'Add index', chapter: 'database-indexes' },
  { name: 'Read replica', chapter: 'read-replicas' },
];

const comparison = (id: string, data: Record<string, unknown> = {}): Comparison => ({
  ...comparisonSchema.parse({ need: id, status: 'placeholder', solutions, ...data }),
  id,
});

describe('comparison schema', () => {
  it('lets a placeholder list solutions without explanations', () => {
    expect(comparisonSchema.parse({ need: 'Reduce read load', status: 'placeholder', solutions }).solutions).toHaveLength(2);
  });

  it('defaults to draft', () => {
    expect(comparisonSchema.parse({ need: 'x', solutions }).status).toBe('draft');
  });

  it('requires why and whyNot for every solution once approved', () => {
    const result = comparisonSchema.safeParse({
      need: 'x',
      status: 'approved',
      solutions: [{ name: 'A', why: 'a', whyNot: 'b' }, { name: 'B', why: 'c' }],
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.path.join('.'))).toEqual(['solutions.1.whyNot']);
  });

  it('needs at least two solutions, each named once', () => {
    expect(comparisonSchema.safeParse({ need: 'x', solutions: [{ name: 'A' }] }).success).toBe(false);
    expect(comparisonSchema.safeParse({ need: 'x', solutions: [{ name: 'Redis' }, { name: 'redis ' }] }).success).toBe(false);
  });

  it('rejects unknown fields, so a typo is not silently ignored', () => {
    expect(comparisonSchema.safeParse({ need: 'x', solutions: [{ name: 'A', whynot: 'b' }, { name: 'B' }] }).success).toBe(false);
  });
});

describe('helpers', () => {
  it('builds /why-not/<id>', () => {
    expect(whyNotHref('reduce-database-read-load')).toBe('/why-not/reduce-database-read-load');
  });

  it('sorts by order, then need', () => {
    const list = [comparison('b', { order: 2 }), comparison('c', { order: 1 }), comparison('a', { order: 2 })];
    expect(sortComparisons(list).map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });

  it('reports links to missing chapters', () => {
    expect(findChapterIssues([comparison('x')], new Set(['database-indexes']))).toEqual([
      'why-not/x: "Read replica" links to chapter "read-replicas", but no chapter has that slug',
    ]);
  });

  it('lists solutions that still need explanations', () => {
    expect(missingExplanations({ solutions: [{ name: 'A', why: 'a', whyNot: 'b' }, { name: 'B', why: ' ' }] })).toEqual(['B']);
  });

  it('maps each chapter to the comparisons it takes part in', () => {
    const map = comparisonsByChapter([comparison('reads'), comparison('latency', { solutions: [solutions[0], { name: 'Cache' }] })]);
    expect(map.get('database-indexes')!.map((e) => [e.comparison.id, e.solution])).toEqual([
      ['latency', 'Add index'],
      ['reads', 'Add index'],
    ]);
    expect(map.get('read-replicas')!.map((e) => e.comparison.id)).toEqual(['reads']);
  });
});

describe('toComparisonSearchDocument', () => {
  it('is found by its solutions and links to their chapters', () => {
    const doc = toComparisonSearchDocument(comparison('reduce-database-read-load', { need: 'Reduce database read load' }));
    expect(doc).toMatchObject({
      id: 'why-not:reduce-database-read-load',
      href: '/why-not/reduce-database-read-load',
      title: 'Reduce database read load',
      topics: 'Add index · Read replica',
      body: '',
      links: ['database-indexes', 'read-replicas'],
    });
  });
});
