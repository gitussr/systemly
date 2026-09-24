/**
 * Wraps each <table> in a focusable, horizontally scrollable region so wide
 * tables stay readable on narrow screens without widening the page.
 */
import type { Element, ElementContent, Root, RootContent } from 'hast';

export function rehypeTableScroll() {
  return (tree: Root) => {
    wrapTables(tree);
  };
}

function wrapTables(parent: Root | Element) {
  parent.children = parent.children.map((child: RootContent | ElementContent) => {
    if (child.type !== 'element') return child;
    if (child.tagName === 'table') {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Table' },
        children: [child],
      } satisfies Element;
    }
    wrapTables(child);
    return child;
  }) as typeof parent.children;
}
