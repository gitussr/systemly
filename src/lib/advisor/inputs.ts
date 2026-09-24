/**
 * The Advisor's inputs (MASTER-PROMPT §10). Every input is a choice from a fixed list, so
 * rule conditions are exact and every recommendation can say which answer triggered it.
 * Labels here are UI text; the teaching content lives in the rules.
 */

export interface Option {
  value: string;
  label: string;
}

export interface InputField {
  id: string;
  label: string;
  group: 'application' | 'data' | 'quality' | 'team';
  multiple?: boolean;
  options: Option[];
}

export const INPUT_GROUPS = [
  { id: 'application', title: 'Application' },
  { id: 'data', title: 'Data' },
  { id: 'quality', title: 'Latency, availability and reach' },
  { id: 'team', title: 'Team, budget and cloud' },
] as const;

export const INPUT_FIELDS = [
  {
    id: 'appType',
    label: 'Application type',
    group: 'application',
    options: [
      { value: 'crud-web-app', label: 'Web application (forms, dashboards, CRUD)' },
      { value: 'content-site', label: 'Content site (mostly reading)' },
      { value: 'saas', label: 'Multi-tenant SaaS' },
      { value: 'e-commerce', label: 'E-commerce' },
      { value: 'social', label: 'Social / feeds' },
      { value: 'realtime', label: 'Real-time (chat, collaboration)' },
      { value: 'api-platform', label: 'Public API' },
      { value: 'analytics', label: 'Analytics / reporting' },
      { value: 'internal-tool', label: 'Internal tool' },
    ],
  },
  {
    id: 'users',
    label: 'Expected users (monthly active)',
    group: 'application',
    options: [
      { value: 'under-1k', label: 'Under 1,000' },
      { value: '1k-10k', label: '1,000 – 10,000' },
      { value: '10k-100k', label: '10,000 – 100,000' },
      { value: '100k-1m', label: '100,000 – 1 million' },
      { value: 'over-1m', label: 'Over 1 million' },
    ],
  },
  {
    id: 'traffic',
    label: 'Peak requests per second',
    group: 'application',
    options: [
      { value: 'under-10', label: 'Under 10' },
      { value: '10-100', label: '10 – 100' },
      { value: '100-1k', label: '100 – 1,000' },
      { value: '1k-10k', label: '1,000 – 10,000' },
      { value: 'over-10k', label: 'Over 10,000' },
    ],
  },
  {
    id: 'readWrite',
    label: 'Read / write ratio',
    group: 'application',
    options: [
      { value: 'read-heavy', label: 'Read-heavy (most requests read)' },
      { value: 'balanced', label: 'Balanced' },
      { value: 'write-heavy', label: 'Write-heavy (ingest, events)' },
    ],
  },
  {
    id: 'growth',
    label: 'Expected growth',
    group: 'application',
    options: [
      { value: 'stable', label: 'Stable' },
      { value: 'steady', label: 'Steady' },
      { value: 'rapid', label: 'Rapid / unpredictable' },
    ],
  },
  {
    id: 'dataVolume',
    label: 'Data volume',
    group: 'data',
    options: [
      { value: 'under-10gb', label: 'Under 10 GB' },
      { value: '10-100gb', label: '10 – 100 GB' },
      { value: '100gb-1tb', label: '100 GB – 1 TB' },
      { value: '1-10tb', label: '1 – 10 TB' },
      { value: 'over-10tb', label: 'Over 10 TB' },
    ],
  },
  {
    id: 'dataTypes',
    label: 'Kinds of data',
    group: 'data',
    multiple: true,
    options: [
      { value: 'relational', label: 'Structured records with relationships' },
      { value: 'documents', label: 'Flexible documents' },
      { value: 'files', label: 'Files and media' },
      { value: 'events', label: 'Events and logs' },
      { value: 'search', label: 'Full-text search' },
      { value: 'time-series', label: 'Time series / metrics' },
    ],
  },
  {
    id: 'consistency',
    label: 'Consistency requirement',
    group: 'data',
    options: [
      { value: 'strong', label: 'Strong (reads always see the latest write)' },
      { value: 'mostly-strong', label: 'Strong for some data (e.g. payments), relaxed elsewhere' },
      { value: 'eventual', label: 'Eventual is acceptable' },
    ],
  },
  {
    id: 'latency',
    label: 'Latency requirement',
    group: 'quality',
    options: [
      { value: 'relaxed', label: 'Relaxed (seconds are fine)' },
      { value: 'standard', label: 'Standard (under ~500 ms)' },
      { value: 'strict', label: 'Strict (under ~100 ms)' },
    ],
  },
  {
    id: 'availability',
    label: 'Availability requirement',
    group: 'quality',
    options: [
      { value: 'best-effort', label: 'Best effort' },
      { value: 'business', label: 'Business hours matter' },
      { value: 'high', label: 'High (about 99.9%)' },
      { value: 'critical', label: 'Critical (about 99.99%)' },
    ],
  },
  {
    id: 'geography',
    label: 'Where your users are',
    group: 'quality',
    options: [
      { value: 'single-region', label: 'Mostly one region' },
      { value: 'multi-region', label: 'Several regions' },
      { value: 'global', label: 'Global, latency-sensitive' },
    ],
  },
  {
    id: 'teamSize',
    label: 'Team size',
    group: 'team',
    options: [
      { value: 'solo', label: 'Solo' },
      { value: 'small', label: '2 – 5 engineers' },
      { value: 'medium', label: '6 – 20 engineers' },
      { value: 'large', label: 'More than 20 engineers' },
    ],
  },
  {
    id: 'experience',
    label: 'Team experience with production systems',
    group: 'team',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'experienced', label: 'Experienced' },
    ],
  },
  {
    id: 'budget',
    label: 'Infrastructure budget',
    group: 'team',
    options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'flexible', label: 'Flexible' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud preference',
    group: 'team',
    options: [
      { value: 'portable', label: 'Stay portable' },
      { value: 'aws', label: 'AWS' },
      { value: 'gcp', label: 'Google Cloud' },
      { value: 'azure', label: 'Azure' },
      { value: 'self-hosted', label: 'Self-hosted / on-premises' },
    ],
  },
] as const satisfies readonly InputField[];

export type FieldId = (typeof INPUT_FIELDS)[number]['id'];
export type Inputs = Record<FieldId, string[]>;

/** A modest starting point: the form shows a useful answer before anything is changed. */
export const DEFAULT_INPUTS: Inputs = {
  appType: ['crud-web-app'],
  users: ['1k-10k'],
  traffic: ['10-100'],
  readWrite: ['read-heavy'],
  growth: ['steady'],
  dataVolume: ['under-10gb'],
  dataTypes: ['relational'],
  consistency: ['strong'],
  latency: ['standard'],
  availability: ['business'],
  geography: ['single-region'],
  teamSize: ['small'],
  experience: ['intermediate'],
  budget: ['moderate'],
  cloud: ['portable'],
};

const FIELDS = new Map<string, InputField>(INPUT_FIELDS.map((f) => [f.id, f]));

export function fieldById(id: string): InputField | undefined {
  return FIELDS.get(id);
}

export function optionLabel(fieldId: string, value: string): string {
  return FIELDS.get(fieldId)?.options.find((o) => o.value === value)?.label ?? value;
}

/** Reads inputs from a URL query, ignoring unknown fields and values. Missing fields use defaults. */
export function inputsFromQuery(params: URLSearchParams): Inputs {
  const inputs = structuredClone(DEFAULT_INPUTS);
  for (const field of INPUT_FIELDS) {
    const raw = params.get(field.id);
    if (raw === null) continue;
    const allowed = new Set<string>(field.options.map((o) => o.value));
    const values = raw.split(',').filter((v) => allowed.has(v));
    if ('multiple' in field && field.multiple) inputs[field.id] = values;
    else if (values[0]) inputs[field.id] = [values[0]];
  }
  return inputs;
}

/** Only non-default answers go into the URL, so shared links stay short. */
export function inputsToQuery(inputs: Inputs): URLSearchParams {
  const params = new URLSearchParams();
  for (const field of INPUT_FIELDS) {
    const value = inputs[field.id].join(',');
    if (value !== DEFAULT_INPUTS[field.id].join(',')) params.set(field.id, value);
  }
  return params;
}
