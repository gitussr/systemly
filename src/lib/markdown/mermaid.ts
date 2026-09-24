/**
 * Marks ```mermaid code blocks as diagrams:
 *
 *   <figure class="diagram" data-diagram="mermaid">
 *     <pre class="diagram__fallback"><code>…source…</code></pre>
 *   </figure>
 *
 * The source stays in the page, so without JavaScript (or if rendering fails) readers
 * still get the text version. src/scripts/diagrams.ts renders the SVG in the browser.
 */
import type { Element, ElementContent, Root, RootContent } from 'hast';

export function rehypeMermaid() {
  return (tree: Root) => {
    replaceMermaid(tree);
  };
}

function replaceMermaid(parent: Root | Element) {
  parent.children = parent.children.map((child: RootContent | ElementContent) => {
    if (child.type !== 'element') return child;
    const code = mermaidCode(child);
    if (code) {
      return {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['diagram'], dataDiagram: 'mermaid' },
        children: [
          {
            type: 'element',
            tagName: 'pre',
            properties: { className: ['diagram__fallback'] },
            children: [{ type: 'element', tagName: 'code', properties: {}, children: code.children }],
          },
        ],
      } satisfies Element;
    }
    replaceMermaid(child);
    return child;
  }) as typeof parent.children;
}

/** Returns the <code> element of a <pre><code class="language-mermaid"> block. */
function mermaidCode(node: Element): Element | undefined {
  if (node.tagName !== 'pre') return undefined;
  const code = node.children.find((c): c is Element => c.type === 'element' && c.tagName === 'code');
  const classes = code?.properties.className;
  const list = Array.isArray(classes) ? classes : [];
  return list.includes('language-mermaid') ? code : undefined;
}
