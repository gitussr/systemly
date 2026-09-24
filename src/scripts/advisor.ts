/**
 * Architecture Advisor page: form ⇄ URL ⇄ engine ⇄ rendered explanation.
 * Everything is built with DOM APIs and textContent, never HTML strings.
 */
import { componentById, TIERS, type ComponentId } from '../lib/advisor/components';
import { recommend, type ExplainedItem, type Reason, type Recommendation } from '../lib/advisor/engine';
import {
  DEFAULT_INPUTS,
  INPUT_FIELDS,
  inputsFromQuery,
  inputsToQuery,
  type Inputs,
} from '../lib/advisor/inputs';
import { SECTIONS, type Rule } from '../lib/advisor/schema';

interface ChapterRef {
  title: string;
  chapter?: string;
  status: string;
}

interface AdvisorData {
  rules: Rule[];
  chapters: Record<string, ChapterRef>;
}

export function initAdvisor(): void {
  const form = document.querySelector<HTMLFormElement>('#advisor-form');
  const output = document.querySelector<HTMLElement>('#advisor-results');
  const status = document.querySelector<HTMLElement>('#advisor-status');
  const dataElement = document.querySelector('#advisor-data');
  if (!form || !output || !status || !dataElement) return;

  const data = JSON.parse(dataElement.textContent ?? '{}') as AdvisorData;

  const update = () => {
    const inputs = readForm(form);
    const query = inputsToQuery(inputs).toString();
    history.replaceState(null, '', `${query ? `?${query}` : location.pathname}${location.hash}`);
    const result = recommend(data.rules, inputs);
    output.replaceChildren(...render(result, data));
    status.textContent = `Recommendation updated: ${result.components.length} components, ${result.applied.length} rules applied.`;
  };

  writeForm(form, inputsFromQuery(new URLSearchParams(location.search)));
  form.addEventListener('change', update);
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    writeForm(form, DEFAULT_INPUTS);
    update();
  });
  update();
}

function readForm(form: HTMLFormElement): Inputs {
  const formData = new FormData(form);
  const inputs = structuredClone(DEFAULT_INPUTS);
  for (const field of INPUT_FIELDS) {
    inputs[field.id] = formData.getAll(field.id).map(String);
  }
  return inputs;
}

function writeForm(form: HTMLFormElement, inputs: Inputs): void {
  for (const field of INPUT_FIELDS) {
    const values = new Set(inputs[field.id]);
    for (const element of form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${field.id}"]`)) {
      if (element instanceof HTMLSelectElement) element.value = inputs[field.id][0] ?? '';
      else element.checked = values.has(element.value);
    }
  }
}

// ---------- rendering ----------

function render(result: Recommendation, data: AdvisorData): HTMLElement[] {
  const blocks: HTMLElement[] = [];

  if (data.rules.length === 0) {
    blocks.push(
      el('p', 'advice-notice', 'The Advisor’s rules are being written and reviewed. Explained recommendations will appear here once they are approved.'),
    );
  }

  blocks.push(architecture(result, data));

  for (const section of SECTIONS) {
    const items = result.sections[section.id];
    const block = el('section', 'advice-section');
    block.append(el('h3', '', section.title));
    if (items.length === 0) {
      block.append(el('p', 'advice-empty', 'Nothing specific for these answers.'));
    } else {
      const list = el('ul', 'advice-items');
      for (const item of items) list.append(itemElement(item, data));
      block.append(list);
    }
    blocks.push(block);
  }

  blocks.push(appliedRules(result));
  return blocks;
}

function architecture(result: Recommendation, data: AdvisorData): HTMLElement {
  const block = el('section', 'advice-section advice-architecture');
  block.append(el('h3', '', 'Recommended starting architecture'));

  const flow = el('ol', 'flow');
  flow.setAttribute('aria-label', 'Components, from the client down to storage');
  for (const tier of TIERS) {
    const here = result.components.filter((c) => componentById(c.id)?.tier === tier.id);
    if (here.length === 0) continue;
    const row = el('li', 'flow__tier');
    row.append(el('span', 'flow__label', tier.label));
    const cards = el('ul', 'flow__components');
    for (const placed of here) {
      const component = componentById(placed.id)!;
      const card = el('li', placed.reasons.length || placed.impliedBy ? 'flow__component is-added' : 'flow__component');
      card.append(chapterLink(component.label, 'chapter' in component ? component.chapter : undefined, data, 'flow__name'));
      const why = placed.impliedBy
        ? `Needed by: ${componentById(placed.impliedBy)?.label ?? placed.impliedBy}`
        : placed.reasons.length > 0
          ? `Because: ${describeReasons(placed.reasons)}`
          : 'Every system starts here';
      card.append(el('span', 'flow__why', why));
      cards.append(card);
    }
    row.append(cards);
    flow.append(row);
  }
  block.append(flow);

  if (result.omitted.length > 0) {
    const names = result.omitted.map((o) => componentById(o.id as ComponentId)?.label ?? o.id).join(', ');
    block.append(el('p', 'advice-omitted', `Not included yet: ${names}.`));
  }
  return block;
}

function itemElement(item: ExplainedItem, data: AdvisorData): HTMLLIElement {
  const li = el('li', 'advice-item');
  li.append(el('p', 'advice-item__text', item.text));
  if (item.chapters.length > 0) {
    const read = el('p', 'advice-item__read');
    read.append(document.createTextNode('Read: '));
    item.chapters.forEach((slug, i) => {
      if (i > 0) read.append(document.createTextNode(' · '));
      read.append(chapterLink(data.chapters[slug]?.title ?? slug, slug, data));
    });
    li.append(read);
  }
  li.append(el('p', 'advice-item__why', `Because: ${describeReasons(item.reasons)}`));
  return li;
}

function appliedRules(result: Recommendation): HTMLElement {
  const details = el('details', 'advice-applied');
  details.append(el('summary', '', `Rules applied (${result.applied.length})`));
  const list = el('ul');
  for (const reason of result.applied) {
    const li = el('li');
    li.append(el('strong', '', reason.ruleTitle));
    li.append(document.createTextNode(` — ${describeTriggers(reason) || 'applies to every system'}`));
    list.append(li);
  }
  details.append(list);
  return details;
}

function describeReasons(reasons: Reason[]): string {
  const parts = reasons.map((r) => describeTriggers(r) || 'applies to every system');
  return [...new Set(parts)].join(' | ');
}

function describeTriggers(reason: Reason): string {
  return reason.triggers.map((t) => `${t.fieldLabel}: ${t.valueLabels.join(' or ')}`).join('; ');
}

function chapterLink(text: string, slug: string | undefined, data: AdvisorData, className = ''): HTMLElement {
  if (!slug || !data.chapters[slug]) return el('span', className, text);
  const a = el('a', className, text) as HTMLAnchorElement;
  a.href = `/learn/${slug}`;
  if (data.chapters[slug].status === 'placeholder') a.title = 'Chapter in preparation';
  return a;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
