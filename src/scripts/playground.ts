/**
 * Architecture Playground page. The design lives in the URL fragment (#d=…), so it can be
 * shared and the Back button restores the previous design after loading a preset.
 * All markup is built with DOM APIs and textContent.
 */
import {
  DEFAULT_PRESET,
  MAX_NAME_LENGTH,
  MAX_NODES,
  NODE_TYPES,
  PRESETS,
  addNode,
  connect,
  decodeGraph,
  disconnect,
  encodeGraph,
  nodeType,
  removeNode,
  type Graph,
  type GraphNode,
  type NodeTypeId,
} from '../lib/playground/model';
import { displayName, runChecks, type Finding } from '../lib/playground/checks';
import { toMermaid } from '../lib/playground/mermaid';

interface CheckText {
  title: string;
  why?: string;
  fix?: string;
  chapters: string[];
}

interface PageData {
  checks: Record<string, CheckText>;
  chapters: Record<string, string>;
}

const DIAGRAM_DELAY_MS = 250;

export function initPlayground(): void {
  const list = document.querySelector<HTMLOListElement>('#pg-nodes');
  const checksBox = document.querySelector<HTMLElement>('#pg-checks');
  const status = document.querySelector<HTMLElement>('#pg-status');
  const figure = document.querySelector<HTMLElement>('#pg-figure');
  const flows = document.querySelector<HTMLUListElement>('#pg-flows');
  const addForm = document.querySelector<HTMLFormElement>('#pg-add');
  const presetForm = document.querySelector<HTMLFormElement>('#pg-preset');
  const share = document.querySelector<HTMLButtonElement>('#pg-share');
  const dataElement = document.querySelector('#pg-data');
  if (!list || !checksBox || !status || !figure || !flows || !addForm || !presetForm || !share || !dataElement) return;

  const data = JSON.parse(dataElement.textContent ?? '{}') as PageData;
  let graph = fromHash() ?? preset(DEFAULT_PRESET);
  let diagramTimer: number | undefined;

  /** Re-renders everything; `structure` = the component list itself changed. */
  const update = (options: { structure?: boolean; push?: boolean } = {}) => {
    const hash = `#d=${encodeGraph(graph)}`;
    if (options.push) history.pushState(null, '', hash);
    else history.replaceState(null, '', hash);

    const findings = runChecks(graph);
    if (options.structure !== false) renderNodes(findings);
    else markWarnings(findings);
    renderChecks(findings);
    renderFlows();

    status.textContent =
      findings.length === 0 ? 'No warnings.' : `${findings.length} ${findings.length === 1 ? 'warning' : 'warnings'}.`;

    window.clearTimeout(diagramTimer);
    diagramTimer = window.setTimeout(() => {
      figure.dataset.source = toMermaid(graph, findings);
      if (!figure.dataset.source) {
        figure.replaceChildren();
        return;
      }
      void import('./diagrams').then(({ renderFigure }) => renderFigure(figure));
    }, DIAGRAM_DELAY_MS);
  };

  // ----- component list -----

  const renderNodes = (findings: Finding[]) => {
    const focusKey = (document.activeElement as HTMLElement | null)?.dataset?.key;
    const flagged = new Set(findings.flatMap((f) => f.nodes));

    if (graph.nodes.length === 0) {
      list.replaceChildren(el('li', 'pg-muted', 'No components yet. Add one, or start from a preset.'));
      return;
    }

    list.replaceChildren(...graph.nodes.map((node) => nodeCard(node, flagged.has(node.id))));
    if (focusKey) list.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  };

  const markWarnings = (findings: Finding[]) => {
    const flagged = new Set(findings.flatMap((f) => f.nodes));
    for (const card of list.querySelectorAll<HTMLElement>('.pg-node')) {
      card.classList.toggle('has-warning', flagged.has(card.dataset.node ?? ''));
    }
  };

  const nodeCard = (node: GraphNode, warning: boolean): HTMLLIElement => {
    const type = nodeType(node.type)!;
    const card = el('li', warning ? 'pg-node has-warning' : 'pg-node');
    card.dataset.node = node.id;

    const head = el('div', 'pg-node__head');
    head.append(el('span', 'pg-node__type', type.label));
    const remove = button(`Remove`, 'icon-button', `remove-${node.id}`);
    remove.setAttribute('aria-label', `Remove ${node.name || type.label}`);
    remove.addEventListener('click', () => {
      graph = removeNode(graph, node.id);
      update();
      list.querySelector<HTMLElement>('.pg-node input')?.focus();
    });
    head.append(remove);
    card.append(head);

    // Name: updates the diagram without rebuilding the list, so typing keeps focus.
    const nameField = el('label', 'pg-field');
    nameField.append(el('span', '', 'Name'));
    const name = document.createElement('input');
    name.type = 'text';
    name.value = node.name;
    name.maxLength = MAX_NAME_LENGTH;
    name.dataset.key = `name-${node.id}`;
    name.addEventListener('input', () => {
      const value = name.value.slice(0, MAX_NAME_LENGTH);
      graph = { ...graph, nodes: graph.nodes.map((n) => (n.id === node.id ? { ...n, name: value } : n)) };
      remove.setAttribute('aria-label', `Remove ${name.value || type.label}`);
      update({ structure: false });
    });
    nameField.append(name);
    card.append(nameField);

    for (const prop of type.properties ?? []) {
      const field = el('label', 'pg-field');
      field.append(el('span', '', prop.label));
      const select = document.createElement('select');
      select.dataset.key = `${prop.id}-${node.id}`;
      for (const option of prop.options) {
        const o = new Option(option.label, option.value, false, node.props[prop.id] === option.value);
        select.append(o);
      }
      select.addEventListener('change', () => {
        graph = {
          ...graph,
          nodes: graph.nodes.map((n) => (n.id === node.id ? { ...n, props: { ...n.props, [prop.id]: select.value } } : n)),
        };
        update();
      });
      field.append(select);
      card.append(field);
    }

    // Outgoing connections.
    const targets = graph.edges.filter(([from]) => from === node.id).map(([, to]) => to);
    const connections = el('div', 'pg-field');
    connections.append(el('span', '', 'Sends requests or messages to'));
    if (targets.length > 0) {
      const edges = el('ul', 'pg-edges');
      for (const to of targets) {
        const target = graph.nodes.find((n) => n.id === to)!;
        const item = el('li', 'pg-edge');
        item.append(document.createTextNode(displayName(target)));
        const x = button('×', 'icon-button', `disconnect-${node.id}-${to}`);
        x.setAttribute('aria-label', `Disconnect ${displayName(node)} from ${displayName(target)}`);
        x.addEventListener('click', () => {
          graph = disconnect(graph, node.id, to);
          update();
        });
        item.append(x);
        edges.append(item);
      }
      connections.append(edges);
    }

    const candidates = graph.nodes.filter((n) => n.id !== node.id && !targets.includes(n.id));
    if (candidates.length > 0) {
      const row = el('div', 'pg-connect');
      const select = document.createElement('select');
      select.dataset.key = `connect-${node.id}`;
      select.setAttribute('aria-label', `Connect ${displayName(node)} to`);
      select.append(new Option('Connect to…', ''));
      for (const c of candidates) select.append(new Option(displayName(c), c.id));
      const add = button('Connect', 'button', `connect-button-${node.id}`);
      add.addEventListener('click', () => {
        if (!select.value) return;
        graph = connect(graph, node.id, select.value);
        update();
      });
      row.append(select, add);
      connections.append(row);
    }
    card.append(connections);
    return card;
  };

  // ----- checks and text version -----

  const renderChecks = (findings: Finding[]) => {
    if (graph.nodes.length === 0) {
      checksBox.replaceChildren(el('p', 'pg-muted', 'Add components to see checks.'));
      return;
    }
    if (findings.length === 0) {
      checksBox.replaceChildren(
        el('p', 'pg-ok', 'No warnings. The checks look for common mistakes only; a design without warnings is not automatically right for your requirements.'),
      );
      return;
    }
    const ul = el('ul');
    for (const finding of findings) {
      const text = data.checks[finding.check];
      const li = el('li', 'pg-finding');
      li.append(el('p', 'pg-finding__title', `⚠ ${text?.title ?? finding.check}`));
      const names = finding.nodes.map((id) => graph.nodes.find((n) => n.id === id)).filter(Boolean) as GraphNode[];
      li.append(el('p', 'pg-muted', `Affects: ${names.map(displayName).join(', ')}`));
      if (text?.why) li.append(el('p', '', text.why));
      if (text?.fix) li.append(el('p', '', `What to do: ${text.fix}`));
      if (text?.chapters.length) {
        const read = el('p', 'pg-muted');
        read.append(document.createTextNode('Read: '));
        text.chapters.forEach((slug, i) => {
          if (i > 0) read.append(document.createTextNode(' · '));
          const a = el('a', '', data.chapters[slug] ?? slug) as HTMLAnchorElement;
          a.href = `/learn/${slug}`;
          read.append(a);
        });
        li.append(read);
      }
      ul.append(li);
    }
    checksBox.replaceChildren(ul);
  };

  const renderFlows = () => {
    const name = (id: string) => displayName(graph.nodes.find((n) => n.id === id)!);
    flows.replaceChildren(
      ...(graph.edges.length === 0
        ? [el('li', '', 'No connections yet.')]
        : graph.edges.map(([from, to]) => el('li', '', `${name(from)} → ${name(to)}`))),
    );
  };

  // ----- toolbar -----

  addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (graph.nodes.length >= MAX_NODES) {
      status.textContent = `A design can have up to ${MAX_NODES} components.`;
      return;
    }
    const type = new FormData(addForm).get('type') as NodeTypeId;
    if (!NODE_TYPES.some((t) => t.id === type)) return;
    graph = addNode(graph, type);
    update();
    const last = graph.nodes.at(-1)!;
    list.querySelector<HTMLInputElement>(`[data-key="name-${last.id}"]`)?.focus();
  });

  presetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = String(new FormData(presetForm).get('preset'));
    // pushState: the Back button returns to the design being replaced.
    graph = preset(id);
    update({ push: true });
  });

  share.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      status.textContent = 'Link copied. It contains the whole design.';
    } catch {
      status.textContent = 'Copy the address from the browser bar to share this design.';
    }
    share.textContent = 'Link copied';
    window.setTimeout(() => (share.textContent = 'Copy link to this design'), 2000);
  });

  window.addEventListener('popstate', () => {
    graph = fromHash() ?? preset(DEFAULT_PRESET);
    update();
  });

  update();
}

function preset(id: string): Graph {
  return (PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === DEFAULT_PRESET)!).graph();
}

function fromHash(): Graph | undefined {
  const match = /^#d=([A-Za-z0-9_-]+)$/.exec(location.hash);
  return match ? decodeGraph(match[1]!) : undefined;
}

function button(text: string, className: string, key: string): HTMLButtonElement {
  const b = el('button', className, text) as HTMLButtonElement;
  b.type = 'button';
  b.dataset.key = key;
  return b;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
