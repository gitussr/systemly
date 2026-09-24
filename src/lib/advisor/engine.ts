/**
 * The Advisor's rules engine. Deterministic and explainable:
 *
 * 1. A rule matches when, for every field in its `when`, the reader's answer is one of the
 *    listed values (for multi-choice fields: at least one selected value is listed).
 *    A rule with no conditions always matches.
 * 2. The architecture starts from client → application → database. Matching rules add
 *    components; a rule may also mark a component as unnecessary. When rules disagree,
 *    the higher priority wins; on a tie, adding wins (omitting is the riskier claim).
 * 3. Section items are collected from all matching rules, in priority order, with
 *    identical items merged. Every item and component records which rules produced it
 *    and which answers triggered them.
 */
import { BASE_COMPONENTS, COMPONENTS, IMPLIES, type ComponentId } from './components';
import { fieldById, optionLabel, type Inputs } from './inputs';
import { SECTIONS, type Rule, type RuleItem, type SectionId } from './schema';

export interface Trigger {
  field: string;
  fieldLabel: string;
  values: string[];
  valueLabels: string[];
}

export interface Reason {
  ruleId: string;
  ruleTitle: string;
  triggers: Trigger[];
}

export interface ExplainedItem extends RuleItem {
  reasons: Reason[];
}

export interface PlacedComponent {
  id: ComponentId;
  /** Why it is included; empty for the base components. */
  reasons: Reason[];
  /** Added because another component needs it. */
  impliedBy?: ComponentId;
}

export interface Recommendation {
  components: PlacedComponent[];
  /** Components a matching rule wanted to omit and no stronger rule added. */
  omitted: { id: ComponentId; reasons: Reason[] }[];
  sections: Record<SectionId, ExplainedItem[]>;
  applied: Reason[];
}

export function matches(rule: Pick<Rule, 'when'>, inputs: Inputs): boolean {
  return Object.entries(rule.when).every(([field, allowed]) => {
    if (!allowed) return true;
    const answer = inputs[field as keyof Inputs] ?? [];
    return answer.some((value) => allowed.includes(value));
  });
}

export function triggersOf(rule: Pick<Rule, 'when'>, inputs: Inputs): Trigger[] {
  return Object.entries(rule.when)
    .filter(([, allowed]) => allowed && allowed.length > 0)
    .map(([field, allowed]) => {
      const values = (inputs[field as keyof Inputs] ?? []).filter((v) => allowed!.includes(v));
      return {
        field,
        fieldLabel: fieldById(field)?.label ?? field,
        values,
        valueLabels: values.map((v) => optionLabel(field, v)),
      };
    });
}

export function recommend(rules: Rule[], inputs: Inputs): Recommendation {
  const matched = rules
    .filter((rule) => matches(rule, inputs))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const reasonOf = (rule: Rule): Reason => ({
    ruleId: rule.id,
    ruleTitle: rule.title,
    triggers: triggersOf(rule, inputs),
  });

  // Architecture: strongest opinion per component wins; ties favour adding.
  const decisions = new Map<ComponentId, { add: boolean; priority: number; reasons: Reason[] }>();
  for (const rule of matched) {
    const votes: [ComponentId, boolean][] = [
      ...rule.architecture.add.map((id) => [id, true] as [ComponentId, boolean]),
      ...rule.architecture.omit.map((id) => [id, false] as [ComponentId, boolean]),
    ];
    for (const [id, add] of votes) {
      const current = decisions.get(id);
      if (!current || rule.priority > current.priority || (rule.priority === current.priority && add && !current.add)) {
        decisions.set(id, { add, priority: rule.priority, reasons: [reasonOf(rule)] });
      } else if (rule.priority === current.priority && add === current.add) {
        current.reasons.push(reasonOf(rule));
      }
    }
  }

  const placed = new Map<ComponentId, PlacedComponent>();
  for (const id of BASE_COMPONENTS) placed.set(id, { id, reasons: decisions.get(id)?.add ? decisions.get(id)!.reasons : [] });
  for (const [id, decision] of decisions) {
    if (decision.add) placed.set(id, { id, reasons: decision.reasons });
  }
  for (const component of [...placed.values()]) {
    for (const partner of IMPLIES[component.id] ?? []) {
      if (!placed.has(partner)) placed.set(partner, { id: partner, reasons: [], impliedBy: component.id });
    }
  }

  const order = COMPONENTS.map((c) => c.id as ComponentId);
  const components = [...placed.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const omitted = [...decisions]
    .filter(([id, d]) => !d.add && !placed.has(id))
    .map(([id, d]) => ({ id, reasons: d.reasons }));

  // Sections: merged by identical text, in rule priority order.
  const sections = Object.fromEntries(SECTIONS.map((s) => [s.id, [] as ExplainedItem[]])) as Record<
    SectionId,
    ExplainedItem[]
  >;
  for (const rule of matched) {
    for (const section of SECTIONS) {
      const items = (rule.sections as Record<string, RuleItem[] | undefined>)[section.id] ?? [];
      for (const item of items) {
        const existing = sections[section.id].find((e) => e.text === item.text);
        if (existing) {
          existing.reasons.push(reasonOf(rule));
          existing.chapters = [...new Set([...existing.chapters, ...item.chapters])];
        } else {
          sections[section.id].push({ ...item, chapters: [...item.chapters], reasons: [reasonOf(rule)] });
        }
      }
    }
  }

  return { components, omitted, sections, applied: matched.map(reasonOf) };
}
