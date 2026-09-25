import { describe, expect, it } from 'vitest';
import {
  adrLabel,
  buildDecisionLinks,
  checkSections,
  decisionHref,
  decisionsByChapter,
  findIdentityIssues,
  findLinkIssues,
} from '../src/lib/decisions/records';
import { ADR_SECTIONS, decisionSchema, type DecisionData } from '../src/lib/decisions/schema';
import { isDecisionPath } from '../src/lib/content/rules';
import { toDecisionSearchDocument } from '../src/lib/search/documents';

const record = (data: Partial<DecisionData> & Pick<DecisionData, 'number' | 'slug'>): DecisionData =>
  decisionSchema.parse({ title: data.slug, status: 'approved', ...data });

describe('labels and URLs', () => {
  it('pads the number to three digits', () => {
    expect(adrLabel(4)).toBe('ADR-004');
    expect(adrLabel(1234)).toBe('ADR-1234');
  });

  it('links to /decisions/<slug>', () => {
    expect(decisionHref('introduce-redis')).toBe('/decisions/introduce-redis');
  });
});

describe('decision schema', () => {
  it('defaults to an unpublished, accepted record', () => {
    const r = decisionSchema.parse({ number: 1, title: 'Use one database', slug: 'use-one-database' });
    expect(r.status).toBe('draft');
    expect(r.outcome).toBe('accepted');
    expect(r.supersedes).toEqual([]);
  });

  it('rejects "superseded" as an authored outcome: it is computed', () => {
    expect(() =>
      decisionSchema.parse({ number: 1, title: 'x', slug: 'x', outcome: 'superseded' }),
    ).toThrow();
  });
});

describe('checkSections', () => {
  it('accepts the standard sections, with extra headings anywhere', () => {
    expect(checkSections(['Context', 'Problem', 'Diagram', ...ADR_SECTIONS.slice(2)])).toEqual({
      missing: [],
      outOfOrder: false,
    });
  });

  it('matches headings regardless of case', () => {
    expect(checkSections(ADR_SECTIONS.map((s) => s.toUpperCase())).missing).toEqual([]);
  });

  it('lists missing sections and detects order', () => {
    const result = checkSections(['Decision', 'Context']);
    expect(result.missing).toEqual(['Problem', 'Options', 'Reasoning', 'Consequences', 'Failure Considerations', 'Reversal Plan']);
    expect(result.outOfOrder).toBe(true);
  });
});

describe('validation', () => {
  it('finds reused numbers and slugs', () => {
    const issues = findIdentityIssues([
      { number: 1, slug: 'a', supersedes: [], chapters: [], source: 'a.md' },
      { number: 1, slug: 'b', supersedes: [], chapters: [], source: 'b.md' },
      { number: 2, slug: 'b', supersedes: [], chapters: [], source: 'c.md' },
    ]);
    expect(issues).toEqual([
      'ADR-001 is used by 2 records: a.md, b.md',
      'Slug "b" is used by 2 records: b.md, c.md',
    ]);
  });

  it('finds broken supersedes and chapter links', () => {
    const issues = findLinkIssues(
      [
        { number: 1, slug: 'a', supersedes: [1], chapters: ['caching'] },
        { number: 2, slug: 'b', supersedes: [3, 9], chapters: ['nope'] },
        { number: 3, slug: 'c', supersedes: [1], chapters: [] },
      ],
      new Set(['caching']),
    );
    expect(issues).toEqual([
      'ADR-001 supersedes itself',
      'ADR-002 supersedes the later ADR-003; a record can only replace an earlier one',
      'ADR-002 supersedes the later ADR-009; a record can only replace an earlier one',
      'ADR-002 links to chapter "nope", but no chapter has that slug',
    ]);
  });

  it('reports a link to an earlier record that is not published', () => {
    expect(findLinkIssues([{ number: 5, slug: 'e', supersedes: [2], chapters: [] }], new Set())).toEqual([
      'ADR-005 supersedes ADR-002, which is not published',
    ]);
  });
});

describe('buildDecisionLinks', () => {
  it('marks a record superseded only when an accepted record replaces it', () => {
    const links = buildDecisionLinks([
      record({ number: 1, slug: 'one' }),
      record({ number: 2, slug: 'two', supersedes: [1] }),
      record({ number: 3, slug: 'three' }),
      record({ number: 4, slug: 'four', supersedes: [3], outcome: 'proposed' }),
    ]);
    expect(links.get('one')!.outcome).toBe('superseded');
    expect(links.get('one')!.supersededBy.map((r) => r.slug)).toEqual(['two']);
    expect(links.get('two')!.supersedes.map((r) => r.slug)).toEqual(['one']);
    expect(links.get('three')!.outcome).toBe('accepted');
    expect(links.get('three')!.supersededBy.map((r) => r.slug)).toEqual(['four']);
  });

  it('keeps the authored outcome otherwise', () => {
    const links = buildDecisionLinks([record({ number: 1, slug: 'r', outcome: 'rejected' })]);
    expect(links.get('r')!.outcome).toBe('rejected');
  });
});

describe('decisionsByChapter', () => {
  it('groups records under each chapter they link to, in number order', () => {
    const map = decisionsByChapter([
      record({ number: 7, slug: 'seven', chapters: ['caching', 'redis'] }),
      record({ number: 2, slug: 'two', chapters: ['caching', 'caching'] }),
    ]);
    expect(map.get('caching')!.map((r) => r.number)).toEqual([2, 7]);
    expect(map.get('redis')!.map((r) => r.number)).toEqual([7]);
  });
});

describe('decision records in content/', () => {
  it('are recognised by their folder', () => {
    expect(isDecisionPath('decisions/introduce-redis.md')).toBe(true);
    expect(isDecisionPath('decisions\\_samples\\x.md')).toBe(true);
    expect(isDecisionPath('03-performance/decisions.md')).toBe(false);
  });
});

describe('toDecisionSearchDocument', () => {
  it('links to the record page and to its chapters', () => {
    const doc = toDecisionSearchDocument(
      record({ number: 4, slug: 'introduce-redis', title: 'Introduce Redis', chapters: ['redis'] }),
      '## Context\n\nReads dominate.',
      new Map([['redis', 'Redis']]),
    );
    expect(doc).toMatchObject({
      id: 'decision:introduce-redis',
      href: '/decisions/introduce-redis',
      chapter: 'ADR-004',
      levelLabel: 'Decision record',
      connections: 'Redis',
      links: ['redis'],
    });
    expect(doc.headings).toContain('Context');
    expect(doc.body).toContain('Reads dominate.');
  });

  it('indexes only the metadata of a placeholder', () => {
    const doc = toDecisionSearchDocument(
      record({ number: 4, slug: 'x', status: 'placeholder' }),
      '## Context\n\nText.',
      new Map(),
    );
    expect(doc.body).toBe('');
    expect(doc.headings).toBe('');
  });
});
