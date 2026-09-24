/**
 * Systemly callouts, written as GitHub-style alerts so they degrade to a plain
 * blockquote in any other Markdown renderer:
 *
 *   > [!TRADE-OFF]
 *   > Replicas add read capacity but serve slightly stale data.
 *
 *   > [!FAILURE] When the cache is cold
 *   > Every request falls through to the database.
 *
 * Text after the marker on the same line becomes a custom title.
 * Unknown markers are left untouched and reported through `onUnknown`.
 */
import type { Blockquote, Paragraph, PhrasingContent, Root, RootContent, Text } from 'mdast';

export interface CalloutType {
  /** CSS modifier and data attribute value. */
  id: string;
  /** Default title shown to readers. */
  label: string;
}

/** Systemly's teaching vocabulary (MASTER-PROMPT §33) plus GitHub's standard alerts. */
export const CALLOUT_TYPES: Record<string, CalloutType> = {
  'MENTAL-MODEL': { id: 'mental-model', label: 'Mental model' },
  PROBLEM: { id: 'problem', label: 'Problem' },
  'TRADE-OFF': { id: 'trade-off', label: 'Trade-off' },
  FAILURE: { id: 'failure', label: 'Failure' },
  EVOLUTION: { id: 'evolution', label: 'Evolution' },
  'LOCK-IN': { id: 'lock-in', label: 'Lock-in' },
  NOTE: { id: 'note', label: 'Note' },
  TIP: { id: 'tip', label: 'Tip' },
  IMPORTANT: { id: 'important', label: 'Important' },
  WARNING: { id: 'warning', label: 'Warning' },
  CAUTION: { id: 'caution', label: 'Caution' },
};

/** Spellings authors are likely to use for the same callout. */
const ALIASES: Record<string, string> = {
  MENTALMODEL: 'MENTAL-MODEL',
  'MENTAL_MODEL': 'MENTAL-MODEL',
  TRADEOFF: 'TRADE-OFF',
  'TRADE_OFF': 'TRADE-OFF',
  LOCKIN: 'LOCK-IN',
  'LOCK_IN': 'LOCK-IN',
};

const MARKER = /^\[!([A-Za-z_-]+)\][ \t]*([^\n]*)(?:\n|$)/;

export function resolveCalloutType(marker: string): CalloutType | undefined {
  const key = marker.toUpperCase();
  return CALLOUT_TYPES[ALIASES[key] ?? key];
}

export interface RemarkCalloutsOptions {
  onUnknown?: (marker: string) => void;
}

export function remarkCallouts(options: RemarkCalloutsOptions = {}) {
  return (tree: Root) => {
    walk(tree, (node) => {
      if (node.type === 'blockquote') transformBlockquote(node, options);
    });
  };
}

function transformBlockquote(node: Blockquote, options: RemarkCalloutsOptions) {
  const first = node.children[0];
  if (first?.type !== 'paragraph') return;
  const head = first.children[0];
  if (head?.type !== 'text') return;

  const match = MARKER.exec(head.value);
  if (!match) return;

  const type = resolveCalloutType(match[1]!);
  if (!type) {
    options.onUnknown?.(match[1]!);
    return;
  }

  const title = match[2]!.trim() || type.label;

  // Strip the marker line; drop the paragraph if nothing else was on it.
  head.value = head.value.slice(match[0].length);
  if (head.value === '') first.children.shift();
  if (first.children[0]?.type === 'break') first.children.shift();
  if (first.children.length === 0) node.children.shift();

  const titleNode: Paragraph = {
    type: 'paragraph',
    children: [{ type: 'text', value: title } satisfies Text],
    data: { hProperties: { className: ['callout__title'] } },
  };

  node.children.unshift(titleNode);
  node.data = {
    ...node.data,
    hName: 'div',
    hProperties: {
      className: ['callout', `callout--${type.id}`],
      role: 'note',
      dataCallout: type.id,
    },
  };
}

type AnyNode = Root | RootContent | PhrasingContent;

function walk(node: AnyNode, visit: (node: AnyNode) => void) {
  visit(node);
  if ('children' in node) {
    for (const child of node.children as AnyNode[]) walk(child, visit);
  }
}
