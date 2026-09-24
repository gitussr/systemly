import { describe, expect, it } from 'vitest';
import { recommend, matches } from '../src/lib/advisor/engine';
import { DEFAULT_INPUTS, inputsFromQuery, inputsToQuery, type Inputs } from '../src/lib/advisor/inputs';
import { ruleSchema, type Rule } from '../src/lib/advisor/schema';
import { COMPONENTS } from '../src/lib/advisor/components';

const rule = (id: string, raw: unknown): Rule => ({ ...ruleSchema.parse(raw), id });
const inputs = (overrides: Partial<Inputs> = {}): Inputs => ({ ...structuredClone(DEFAULT_INPUTS), ...overrides });

describe('rule schema', () => {
  it('accepts plain-text and linked items and defaults to draft', () => {
    const r = ruleSchema.parse({
      title: 'T',
      sections: { why: ['Plain', { text: 'Linked', chapters: ['caching'] }] },
    });
    expect(r.status).toBe('draft');
    expect(r.sections.why).toEqual([
      { text: 'Plain', chapters: [] },
      { text: 'Linked', chapters: ['caching'] },
    ]);
  });

  it('rejects unknown fields, values, components and sections', () => {
    expect(ruleSchema.safeParse({ title: 'T', when: { colour: ['red'] } }).success).toBe(false);
    expect(ruleSchema.safeParse({ title: 'T', when: { availability: ['always'] } }).success).toBe(false);
    expect(ruleSchema.safeParse({ title: 'T', architecture: { add: ['kubernetes'] } }).success).toBe(false);
    expect(ruleSchema.safeParse({ title: 'T', sections: { opinions: ['x'] } }).success).toBe(false);
  });
});

describe('matching', () => {
  it('requires every listed field and accepts any listed value', () => {
    const r = rule('r', { title: 'T', when: { availability: ['high', 'critical'], teamSize: ['small'] } });
    expect(matches(r, inputs({ availability: ['critical'], teamSize: ['small'] }))).toBe(true);
    expect(matches(r, inputs({ availability: ['critical'], teamSize: ['large'] }))).toBe(false);
    expect(matches(r, inputs({ availability: ['business'] }))).toBe(false);
  });

  it('matches multi-choice fields on any overlap, and always matches without conditions', () => {
    const r = rule('r', { title: 'T', when: { dataTypes: ['files'] } });
    expect(matches(r, inputs({ dataTypes: ['relational', 'files'] }))).toBe(true);
    expect(matches(r, inputs({ dataTypes: ['relational'] }))).toBe(false);
    expect(matches(rule('always', { title: 'T' }), inputs())).toBe(true);
  });
});

describe('recommend', () => {
  const rules = [
    rule('baseline', {
      title: 'Start simple',
      architecture: { omit: ['cache', 'queue'] },
      sections: { why: ['Fewer moving parts.'], measure: ['p95 latency'] },
    }),
    rule('availability', {
      title: 'Redundancy',
      when: { availability: ['high', 'critical'] },
      architecture: { add: ['multiple-app-instances'] },
      sections: { why: [{ text: 'No single instance can take the site down.', chapters: ['redundancy'] }] },
    }),
    rule('hot-reads', {
      title: 'Cache hot reads',
      priority: 10,
      when: { traffic: ['1k-10k', 'over-10k'], readWrite: ['read-heavy'] },
      architecture: { add: ['cache'] },
      sections: { measure: ['p95 latency', 'Cache hit ratio'] },
    }),
  ];

  it('starts from client, application and database', () => {
    const r = recommend(rules, inputs());
    expect(r.components.map((c) => c.id)).toEqual(['client', 'app', 'database']);
    expect(r.omitted.map((o) => o.id).sort()).toEqual(['cache', 'queue']);
  });

  it('adds components with the answers that caused them, and their required partners', () => {
    const r = recommend(rules, inputs({ availability: ['critical'] }));
    const ids = r.components.map((c) => c.id);
    expect(ids).toEqual(['client', 'load-balancer', 'app', 'multiple-app-instances', 'database']);
    const instances = r.components.find((c) => c.id === 'multiple-app-instances')!;
    expect(instances.reasons[0]!.triggers).toEqual([
      {
        field: 'availability',
        fieldLabel: 'Availability requirement',
        values: ['critical'],
        valueLabels: ['Critical (about 99.99%)'],
      },
    ]);
    expect(r.components.find((c) => c.id === 'load-balancer')!.impliedBy).toBe('multiple-app-instances');
  });

  it('lets a higher-priority rule override an omission', () => {
    const r = recommend(rules, inputs({ traffic: ['over-10k'] }));
    expect(r.components.map((c) => c.id)).toContain('cache');
    expect(r.omitted.map((o) => o.id)).toEqual(['queue']);
  });

  it('merges identical items and keeps every reason', () => {
    const r = recommend(rules, inputs({ traffic: ['over-10k'] }));
    const p95 = r.sections.measure.filter((i) => i.text === 'p95 latency');
    expect(p95).toHaveLength(1);
    expect(p95[0]!.reasons.map((x) => x.ruleId)).toEqual(['hot-reads', 'baseline']);
  });

  it('lists applied rules in priority order and returns every section', () => {
    const r = recommend(rules, inputs({ traffic: ['over-10k'], availability: ['high'] }));
    expect(r.applied.map((a) => a.ruleId)).toEqual(['hot-reads', 'availability', 'baseline']);
    expect(Object.keys(r.sections)).toHaveLength(10);
  });
});

describe('shareable URLs', () => {
  it('round-trips non-default answers and ignores unknown values', () => {
    const custom = inputs({ availability: ['critical'], dataTypes: ['relational', 'files'] });
    const query = inputsToQuery(custom);
    expect(query.toString()).toBe('dataTypes=relational%2Cfiles&availability=critical');
    expect(inputsFromQuery(query)).toEqual(custom);
    expect(inputsFromQuery(new URLSearchParams('availability=forever&teamSize=solo'))).toEqual(
      inputs({ teamSize: ['solo'] }),
    );
  });
});

describe('components', () => {
  it('have unique ids', () => {
    const ids = COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
