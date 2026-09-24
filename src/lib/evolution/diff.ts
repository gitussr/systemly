/**
 * What changed between two versions of an architecture, so each stage can show
 * exactly what was added (and, rarely, removed) — the "one change" of MASTER-PROMPT §7.
 */
import { COMPONENTS, type ComponentId } from '../advisor/components';

export interface StageDiff {
  added: ComponentId[];
  removed: ComponentId[];
  kept: ComponentId[];
}

const ORDER = COMPONENTS.map((c) => c.id as ComponentId);
const byPath = (a: ComponentId, b: ComponentId) => ORDER.indexOf(a) - ORDER.indexOf(b);

export function diffStages(previous: readonly ComponentId[] | undefined, current: readonly ComponentId[]): StageDiff {
  const before = new Set(previous ?? []);
  const after = new Set(current);
  return {
    added: previous ? [...after].filter((id) => !before.has(id)).sort(byPath) : [],
    removed: [...before].filter((id) => !after.has(id)).sort(byPath),
    kept: [...after].filter((id) => !previous || before.has(id)).sort(byPath),
  };
}

/** Advisor URL for a stage's answers (only the fields the stage sets). */
export function advisorHref(answers: Record<string, string | undefined> | undefined): string | undefined {
  if (!answers) return undefined;
  const params = new URLSearchParams();
  for (const [field, value] of Object.entries(answers)) if (value) params.set(field, value);
  const query = params.toString();
  return query ? `/advisor?${query}` : undefined;
}
