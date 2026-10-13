/**
 * The search dialog (src/components/SearchDialog.astro): opens from the header's search icon,
 * "/" and Ctrl/⌘+K; searches as the reader types (src/scripts/search.ts); closes with
 * Escape, the close button, a tap outside the panel, or on following a result.
 * On the /search page the shortcuts focus that page's own field instead.
 */
import { initSearch, preloadIndex } from './search';

/** The full placeholder is cut off on phones; narrow screens get a shorter one. */
export function shortPlaceholder(input: HTMLInputElement): void {
  const full = input.placeholder;
  const short = input.dataset.placeholderShort ?? full;
  const wide = window.matchMedia('(min-width: 48rem)');
  const apply = () => (input.placeholder = wide.matches ? full : short);
  apply();
  wide.addEventListener('change', apply);
}

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

export function initSearchDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
  const input = dialog?.querySelector<HTMLInputElement>('#dialog-search-input');
  const status = dialog?.querySelector<HTMLElement>('#dialog-search-status');
  const results = dialog?.querySelector<HTMLElement>('#dialog-search-results');
  if (!dialog || !input || !status || !results || typeof dialog.showModal !== 'function') return;

  initSearch({ input, status, results });
  shortPlaceholder(input);

  const pageField = () => document.querySelector<HTMLInputElement>('#search-input');

  const open = () => {
    const field = pageField();
    if (field) return field.focus(); // already on /search
    if (!dialog.open) dialog.showModal();
    preloadIndex();
    input.focus();
    input.select(); // a previous query stays, ready to be typed over
  };

  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-search-open]')) {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // new tab: let it go to /search
      event.preventDefault();
      open();
    });
  }

  document.addEventListener('keydown', (event) => {
    const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !typing(event.target);
    const commandK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey;
    if (!slash && !commandK) return;
    event.preventDefault();
    open();
  });

  dialog.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());

  // A tap on the backdrop (outside the panel) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Following a result: close, so the dialog is not open when the reader comes back.
  results.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) dialog.close();
  });
  addEventListener('pagehide', () => dialog.open && dialog.close());
}
