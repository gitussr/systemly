/**
 * Chapters written in other tools can contain their UI components, e.g.
 * `<AsyncImageGroup query={[…]} />` (an image carousel built from search queries).
 * Plain Markdown cannot render them, and passed through they become empty unknown
 * HTML elements. They are removed at render time, so the file stays as supplied,
 * and each one is reported so the content owner can decide what should replace it.
 */
import type { Html, Root } from 'mdast';
import type { VFile } from 'vfile';

/** A self-closing PascalCase tag: a component, never a standard HTML element. */
const COMPONENT = /^<([A-Z][A-Za-z0-9]*)\b[\s\S]*\/>\s*$/;
const COMPONENT_TAGS = /<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g;

/**
 * A layout wrapper holding only components, e.g.
 * `<row gap={3}><AsyncImage … /><AsyncImage … /></row>`. Returns the component names.
 */
function wrappedComponents(source: string): string[] | null {
  const wrapper = /^<([a-z][a-z0-9-]*)\b[^>]*>([\s\S]*)<\/\1>$/.exec(source);
  if (!wrapper) return null;
  const inner = wrapper[2]!;
  const names = [...inner.matchAll(COMPONENT_TAGS)].map((m) => m[1]!);
  return names.length > 0 && inner.replace(COMPONENT_TAGS, '').trim() === '' ? names : null;
}

export interface UnsupportedComponentOptions {
  onRemove?: (name: string, file: VFile) => void;
}

export function remarkUnsupportedComponents({ onRemove }: UnsupportedComponentOptions = {}) {
  return (tree: Root, file: VFile) => {
    const visit = (parent: { children: unknown[] }) => {
      parent.children = parent.children.filter((node) => {
        const n = node as { type: string; value?: string; children?: unknown[] };
        // JSX-style attributes (`query={[…]}`) are not valid HTML, so Markdown usually
        // parses the tag as a paragraph of text rather than as an HTML block.
        const source =
          n.type === 'html'
            ? (n as Html).value
            : n.type === 'paragraph' && (n.children as { value?: unknown }[]).every((c) => typeof c.value === 'string')
              ? (n.children as { value: string }[]).map((c) => c.value).join('')
              : undefined;
        const match = source === undefined ? null : COMPONENT.exec(source.trim());
        if (match) {
          onRemove?.(match[1]!, file);
          return false;
        }
        const wrapped = n.type === 'html' ? wrappedComponents(source!.trim()) : null;
        if (wrapped) {
          for (const name of new Set(wrapped)) onRemove?.(name, file);
          return false;
        }
        if (Array.isArray(n.children)) visit(n as { children: unknown[] });
        return true;
      });
    };
    visit(tree);
  };
}
