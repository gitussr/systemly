/**
 * Search page behaviour. The index is fetched once, on first use, and searched locally.
 * Results are built with DOM APIs and textContent, never HTML strings.
 */
import type MiniSearch from 'minisearch';
import { loadIndex, search, type SearchDocument, type StoredFields } from '../lib/search/index';

const INDEX_URL = '/search-index.json';
const DEBOUNCE_MS = 120;

let indexPromise: Promise<MiniSearch<SearchDocument>> | undefined;

function getIndex(): Promise<MiniSearch<SearchDocument>> {
  indexPromise ??= fetch(INDEX_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Index request failed: ${response.status}`);
      return response.text();
    })
    .then(loadIndex)
    .catch((error: unknown) => {
      indexPromise = undefined; // allow a retry, e.g. after reconnecting
      throw error;
    });
  return indexPromise;
}

export function initSearch(): void {
  const input = document.querySelector<HTMLInputElement>('#search-input');
  const status = document.querySelector<HTMLElement>('#search-status');
  const results = document.querySelector<HTMLElement>('#search-results');
  if (!input || !status || !results) return;

  let timer: number | undefined;
  let latest = 0;

  const run = async (query: string) => {
    const id = ++latest;
    syncUrl(query);
    if (!query.trim()) {
      status.textContent = '';
      results.replaceChildren();
      return;
    }

    let index: MiniSearch<SearchDocument>;
    try {
      if (!indexPromise) status.textContent = 'Loading search…';
      index = await getIndex();
    } catch {
      if (id === latest) {
        status.textContent = navigator.onLine
          ? 'Search could not load. Please try again.'
          : 'You are offline, and search has not been loaded on this device yet.';
      }
      return;
    }
    if (id !== latest) return; // a newer query has started

    const { hits, related } = search(index, query);
    status.textContent =
      hits.length === 0
        ? `Nothing matches “${query.trim()}”. Try a broader term, or browse the roadmap.`
        : `${hits.length} ${hits.length === 1 ? 'result' : 'results'} for “${query.trim()}”`;

    const sections: HTMLElement[] = [];
    if (hits.length > 0) sections.push(list(hits.map((h) => resultItem(h))));
    if (related.length > 0) {
      const heading = document.createElement('h2');
      heading.textContent = 'Related topics';
      sections.push(heading, list(related.map((r) => resultItem(r, r.via))));
    }
    results.replaceChildren(...sections);
  };

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => run(input.value), DEBOUNCE_MS);
  });

  // Start downloading the index as soon as the reader shows intent.
  input.addEventListener('focus', () => void getIndex().catch(() => {}), { once: true });

  input.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    window.clearTimeout(timer);
    void run(input.value);
    results.querySelector<HTMLAnchorElement>('a')?.focus();
  });

  // Arrow keys move between the field and the results.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const links = [...results.querySelectorAll<HTMLAnchorElement>('a.result')];
    if (links.length === 0) return;
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (document.activeElement === input && event.key === 'ArrowDown') {
      event.preventDefault();
      links[0]!.focus();
    } else if (current !== -1) {
      event.preventDefault();
      const next = current + (event.key === 'ArrowDown' ? 1 : -1);
      if (next < 0) input.focus();
      else links[Math.min(next, links.length - 1)]!.focus();
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) {
      input.value = '';
      void run('');
    }
  });

  const initial = new URLSearchParams(location.search).get('q') ?? '';
  if (initial) {
    input.value = initial;
    void run(initial);
  }
  input.focus();
}

function syncUrl(query: string): void {
  const url = new URL(location.href);
  if (query.trim()) url.searchParams.set('q', query.trim());
  else url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

function list(items: HTMLElement[]): HTMLOListElement {
  const ol = document.createElement('ol');
  for (const item of items) {
    const li = document.createElement('li');
    li.append(item);
    ol.append(li);
  }
  return ol;
}

function resultItem(doc: StoredFields, via?: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'result';
  a.href = doc.href;

  const meta = document.createElement('span');
  meta.className = 'result__meta';
  if (doc.chapter) meta.append(span('result__number', doc.chapter));
  meta.append(span('', doc.levelLabel));
  if (via) meta.append(span('', `Related to ${via}`));

  const title = document.createElement('span');
  title.className = doc.status === 'placeholder' ? 'result__title is-muted' : 'result__title';
  title.textContent = doc.title;
  if (doc.status === 'placeholder') title.append(span('result__tag', 'In preparation'));

  a.append(meta, title);
  if (doc.summary) {
    const summary = document.createElement('p');
    summary.className = 'result__summary';
    summary.textContent = doc.summary;
    a.append(summary);
  }
  return a;
}

function span(className: string, text: string): HTMLSpanElement {
  const el = document.createElement('span');
  if (className) el.className = className;
  el.textContent = text;
  return el;
}
