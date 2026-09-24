/**
 * Renders Mermaid diagrams in chapter pages.
 *
 * - Mermaid (large) is imported only when the page contains a diagram.
 * - Colours come from Systemly's design tokens and follow the light/dark theme.
 * - The diagram source stays available under "Diagram as text" for screen readers,
 *   copying and readers who prefer text. If rendering fails, the text fallback remains.
 */
import type { Mermaid, MermaidConfig } from 'mermaid';

const SELECTOR = 'figure[data-diagram="mermaid"]';
/** Smallest scale a diagram is drawn at before it scrolls (≈10px labels at the 15px base). */
const MIN_SCALE = 0.65;
let renderCount = 0;

export async function renderDiagrams(): Promise<void> {
  const figures = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  if (figures.length === 0) return;

  // Keep each diagram's source before the fallback is replaced.
  for (const figure of figures) {
    figure.dataset.source ??= figure.querySelector('pre')?.textContent ?? '';
  }

  const { default: mermaid } = await import('mermaid');
  await renderAll(mermaid, figures);

  // Redraw with the other palette when the reader switches theme.
  new MutationObserver(() => void renderAll(mermaid, figures)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

async function renderAll(mermaid: Mermaid, figures: HTMLElement[]): Promise<void> {
  mermaid.initialize(config());
  for (const figure of figures) {
    const source = figure.dataset.source ?? '';
    if (!source.trim()) continue;
    const id = `diagram-${++renderCount}`;
    try {
      // Validate first: on a syntax error Mermaid would otherwise render an error graphic.
      if (!(await mermaid.parse(source, { suppressErrors: true }))) {
        throw new Error('Invalid Mermaid syntax');
      }
      const { svg } = await mermaid.render(id, source);
      figure.replaceChildren(canvas(svg), textAlternative(source));
      figure.classList.add('is-rendered');
    } catch (error) {
      // Leave the readable source in place, and remove Mermaid's temporary container.
      document.getElementById(`d${id}`)?.remove();
      console.warn('[systemly] Diagram could not be rendered; showing its source instead.', error);
    }
  }
}

function canvas(svg: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'diagram__canvas';
  // Wide diagrams scroll inside their own box; make that region keyboard-reachable.
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'group');
  wrapper.setAttribute('aria-label', 'Diagram. A text version follows.');
  // Mermaid's output is sanitised (securityLevel "strict").
  wrapper.innerHTML = svg;

  // Fit the available width, but never shrink below MIN_SCALE of the natural size, so labels
  // stay readable on phones; beyond that the diagram scrolls inside its box.
  // Mermaid records the natural width as max-width.
  const element = wrapper.querySelector('svg');
  const natural = element ? parseFloat(element.style.maxWidth) : NaN;
  if (element && Number.isFinite(natural)) {
    element.style.width = `max(100%, ${Math.round(natural * MIN_SCALE)}px)`;
    element.style.maxWidth = `${natural}px`;
  }
  return wrapper;
}

function textAlternative(source: string): HTMLElement {
  const details = document.createElement('details');
  details.className = 'diagram__source';
  const summary = document.createElement('summary');
  summary.textContent = 'Diagram as text';
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = source;
  pre.append(code);
  details.append(summary, pre);
  return details;
}

function config(): MermaidConfig {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  const dark = document.documentElement.dataset.theme === 'dark';
  const font = token('--font-sans');

  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: font,
    themeVariables: {
      darkMode: dark,
      fontFamily: font,
      fontSize: '15px',
      background: token('--color-surface'),
      primaryColor: token('--color-bg'),
      primaryTextColor: token('--color-text'),
      primaryBorderColor: token('--color-text-muted'),
      secondaryColor: token('--color-code-bg'),
      tertiaryColor: token('--color-surface'),
      mainBkg: token('--color-bg'),
      nodeBorder: token('--color-text-muted'),
      clusterBkg: token('--color-code-bg'),
      clusterBorder: token('--color-border'),
      titleColor: token('--color-text'),
      textColor: token('--color-text'),
      // Connections carry the brand accent, as in the design guidelines.
      lineColor: token('--color-accent-ink'),
      edgeLabelBackground: token('--color-surface'),
      noteBkgColor: token('--color-code-bg'),
      noteTextColor: token('--color-text'),
      noteBorderColor: token('--color-border'),
      actorBkg: token('--color-bg'),
      actorBorder: token('--color-text-muted'),
      actorTextColor: token('--color-text'),
      signalColor: token('--color-text'),
      signalTextColor: token('--color-text'),
    },
  };
}
