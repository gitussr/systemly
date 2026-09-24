import { describe, expect, it } from 'vitest';
import { advisorHref, diffStages } from '../src/lib/evolution/diff';
import { scenarioSchema } from '../src/lib/evolution/schema';

describe('diffStages', () => {
  it('treats the first stage as the starting point, with nothing "added"', () => {
    expect(diffStages(undefined, ['database', 'client', 'app'])).toEqual({
      added: [],
      removed: [],
      kept: ['client', 'app', 'database'],
    });
  });

  it('lists added and removed components in request-path order', () => {
    const d = diffStages(['client', 'app', 'database'], ['client', 'load-balancer', 'multiple-app-instances', 'app', 'database', 'cache']);
    expect(d.added).toEqual(['load-balancer', 'multiple-app-instances', 'cache']);
    expect(d.kept).toEqual(['client', 'app', 'database']);
    expect(diffStages(['client', 'cache'], ['client']).removed).toEqual(['cache']);
  });
});

describe('advisorHref', () => {
  it('builds an Advisor link from a stage’s answers', () => {
    expect(advisorHref({ users: '10k-100k', traffic: '10-100' })).toBe('/advisor?users=10k-100k&traffic=10-100');
    expect(advisorHref(undefined)).toBeUndefined();
  });
});

describe('scenario schema', () => {
  const stage = { label: '1,000 users', title: 'V1', components: ['client', 'app', 'database'] };

  it('defaults to draft and needs at least two stages', () => {
    expect(scenarioSchema.parse({ title: 'T', stages: [stage, stage] }).status).toBe('draft');
    expect(scenarioSchema.safeParse({ title: 'T', stages: [stage] }).success).toBe(false);
  });

  it('rejects unknown components and Advisor answers', () => {
    const bad = (s: object) => scenarioSchema.safeParse({ title: 'T', stages: [stage, { ...stage, ...s }] }).success;
    expect(bad({ components: ['kubernetes'] })).toBe(false);
    expect(bad({ advisor: { users: 'a-billion' } })).toBe(false);
    expect(bad({ advisor: { colour: 'red' } })).toBe(false);
    expect(bad({ advisor: { users: 'over-1m' } })).toBe(true);
  });
});
