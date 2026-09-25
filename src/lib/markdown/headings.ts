/**
 * Fits a chapter's heading outline under the page title without editing the file:
 *
 * 1. A leading `# Title` that repeats the frontmatter title is dropped
 *    (the layout already renders the title as the page's <h1>), also when it is
 *    prefixed with the chapter number, e.g. `# 00.02 — Computer Fundamentals`.
 * 2. If the document still uses `#` headings, every heading moves down one level,
 *    so `#` sections become <h2>, `##` become <h3>, and so on (capped at <h6>).
 *
 * 3. Headings before the first top-level section are lifted so the outline never
 *    skips a level (no <h1> → <h3>).
 * 4. Any remaining skipped level (`#` then `###`) is closed: a heading is at most one
 *    level deeper than the heading before it.
 *
 * Documents that already start their sections at `##` are left unchanged.
 */
import type { Heading, Root, RootContent, PhrasingContent } from 'mdast';
import type { VFile } from 'vfile';

export function remarkNormalizeHeadings() {
  return (tree: Root, file: VFile) => {
    const frontmatter = file.data.astro?.frontmatter as { title?: unknown; chapter?: unknown } | undefined;
    const title = frontmatter?.title;
    const chapter = frontmatter?.chapter;

    const first = tree.children[0];
    if (first?.type === 'heading' && first.depth === 1 && typeof title === 'string') {
      const text = normalize(textOf(first));
      const withNumber =
        typeof chapter === 'string' &&
        text.startsWith(chapter) &&
        text.slice(chapter.length).replace(/^\s*[—–:.-]?\s*/, '') === normalize(title);
      if (text === normalize(title) || withNumber) tree.children.shift();
    }

    const headings = tree.children.flatMap(function collect(node: RootContent): Heading[] {
      if (node.type === 'heading') return [node];
      return 'children' in node ? (node.children as RootContent[]).flatMap(collect) : [];
    });

    if (headings.some((h) => h.depth === 1)) {
      for (const h of headings) h.depth = Math.min(h.depth + 1, 6) as Heading['depth'];
    }

    // Headings before the first top-level section (e.g. "## Learning Objective" written
    // under the title) would otherwise skip from <h1> to <h3>. Lift that leading group to <h2>.
    const firstSection = headings.findIndex((h) => h.depth === 2);
    const leading = firstSection === -1 ? headings : headings.slice(0, firstSection);
    if (leading.length > 0) {
      const lift = Math.min(...leading.map((h) => h.depth)) - 2;
      if (lift > 0) for (const h of leading) h.depth = (h.depth - lift) as Heading['depth'];
    }

    // Close gaps the author skipped (e.g. `#` followed directly by `###`): each heading is
    // at most one level deeper than the previous one. The page title is level 1.
    let previous = 1;
    for (const h of headings) {
      h.depth = Math.min(h.depth, previous + 1) as Heading['depth'];
      previous = h.depth;
    }
  };
}

function textOf(node: Heading | PhrasingContent): string {
  if ('value' in node) return node.value;
  if ('children' in node) return (node.children as PhrasingContent[]).map(textOf).join('');
  return '';
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}
