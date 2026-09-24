/**
 * Turns a Playground graph into Mermaid flowchart source.
 * Names are free text typed by the reader, so they are escaped: only the quoted label
 * syntax is used, and characters Mermaid treats specially become entity codes.
 */
import { displayName, type Finding } from './checks';
import { nodeType, type Graph } from './model';

export function escapeLabel(text: string): string {
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/#/g, '#35;')
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;')
    .replace(/[`|{}[\]()]/g, (c) => `#${c.charCodeAt(0)};`)
    .trim();
}

export function toMermaid(graph: Graph, findings: Finding[] = []): string {
  if (graph.nodes.length === 0) return '';
  const flagged = new Set(findings.flatMap((f) => f.nodes));
  const lines = ['flowchart TB', '  accTitle: Your architecture'];
  lines.push(
    `  accDescr: ${graph.nodes.length} components and ${graph.edges.length} connections. The same design is listed as text on this page.`,
  );
  for (const node of graph.nodes) {
    const [open, close] = nodeType(node.type)?.shape ?? ['["', '"]'];
    lines.push(`  ${node.id}${open}${escapeLabel(displayName(node))}${close}`);
  }
  for (const [from, to] of graph.edges) lines.push(`  ${from} --> ${to}`);
  if (flagged.size > 0) {
    lines.push('  classDef warning stroke:#c9a227,stroke-width:3px,stroke-dasharray:6 3');
    lines.push(`  class ${[...flagged].join(',')} warning`);
  }
  return lines.join('\n');
}
