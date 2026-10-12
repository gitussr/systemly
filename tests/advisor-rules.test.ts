import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { recommend } from '../src/lib/advisor/engine';
import { DEFAULT_INPUTS, INPUT_FIELDS, type Inputs } from '../src/lib/advisor/inputs';
import { ruleSchema, type Rule } from '../src/lib/advisor/schema';

// The published rule set, checked as readers will see it.
const DIR = join(__dirname, '../content/advisor/rules');
const rules: Rule[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ ...ruleSchema.parse(parse(readFileSync(join(DIR, f), 'utf8'))), id: f.replace(/\.yaml$/, '') }))
  .filter((r) => r.status === 'approved');

const inputs = (overrides: Partial<Inputs> = {}): Inputs => ({ ...structuredClone(DEFAULT_INPUTS), ...overrides });
const ids = (i: Inputs) => recommend(rules, i).components.map((c) => c.id);
const optionsOf = (id: string) => INPUT_FIELDS.find((f) => f.id === id)!.options.map((o) => o.value);

describe('published advisor rules', () => {
  it('give every application type its own explanation', () => {
    for (const appType of optionsOf('appType')) {
      const r = recommend(rules, inputs({ appType: [appType] }));
      const specific = r.applied.filter((a) => a.triggers.some((t) => t.field === 'appType'));
      expect(specific.length, appType).toBeGreaterThan(0);
    }
  });

  it('map every named cloud to concrete services', () => {
    for (const cloud of optionsOf('cloud')) {
      const r = recommend(rules, inputs({ cloud: [cloud] }));
      expect(r.sections.lockIn.length + r.sections.migration.length, cloud).toBeGreaterThan(0);
      expect(r.applied.some((a) => a.triggers.some((t) => t.field === 'cloud')), cloud).toBe(true);
    }
  });

  it('keep the default answers simple', () => {
    expect(ids(inputs())).toEqual(['client', 'app', 'database']);
    expect(recommend(rules, inputs()).sections.why.length).toBeGreaterThan(0);
  });

  it('add redundancy for high availability even at small scale', () => {
    expect(ids(inputs({ availability: ['high'] }))).toContain('multiple-app-instances');
    expect(ids(inputs({ availability: ['high'] }))).toContain('load-balancer');
  });

  it('scale a busy read-heavy system with instances, a cache and replicas', () => {
    const c = ids(inputs({ traffic: ['1k-10k'], users: ['100k-1m'], consistency: ['eventual'] }));
    expect(c).toEqual(expect.arrayContaining(['load-balancer', 'multiple-app-instances', 'cache', 'read-replicas']));
  });

  it('do not add replicas when every read must be current', () => {
    expect(ids(inputs({ traffic: ['1k-10k'], consistency: ['strong'] }))).not.toContain('read-replicas');
  });

  it('give an e-commerce store object storage and a CDN for product images', () => {
    expect(ids(inputs({ appType: ['e-commerce'] }))).toEqual(expect.arrayContaining(['object-storage', 'cdn']));
  });

  it('keep an internal tool lean unless another answer needs more', () => {
    expect(ids(inputs({ appType: ['internal-tool'] }))).toEqual(['client', 'app', 'database']);
    expect(ids(inputs({ appType: ['internal-tool'], geography: ['global'] }))).toContain('cdn');
  });
});
