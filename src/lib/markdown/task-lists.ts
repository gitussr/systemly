/**
 * GFM renders task-list items as unlabeled, disabled checkboxes.
 * Give each one an accessible name so screen readers announce its state.
 */
import type { Element, Root } from 'hast';

export function rehypeTaskListLabels() {
  return (tree: Root) => {
    visitElements(tree, (node) => {
      if (node.tagName === 'input' && node.properties.type === 'checkbox') {
        node.properties.ariaLabel = node.properties.checked ? 'Completed' : 'Not completed';
      }
    });
  };
}

function visitElements(node: Root | Element, visit: (node: Element) => void) {
  for (const child of node.children) {
    if (child.type === 'element') {
      visit(child);
      visitElements(child, visit);
    }
  }
}
