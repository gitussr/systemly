/**
 * Turns chapter Markdown into plain text for the search index.
 * Code blocks and diagrams are dropped: they are noisy to match and large to ship.
 * Headings are also returned separately so they can be weighted higher.
 */

export interface ExtractedText {
  headings: string[];
  body: string;
}

const FENCE = /^\s*(```|~~~)/;

export function extractSearchText(markdown: string): ExtractedText {
  const headings: string[] = [];
  const lines: string[] = [];
  let inFence = false;

  for (const raw of markdown.split(/\r?\n/)) {
    if (FENCE.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(raw);
    if (heading) {
      const text = inline(heading[1]!);
      if (text) headings.push(text);
      continue;
    }

    const line = inline(
      raw
        .replace(/^\s{0,3}>\s?/, '') // blockquote marker
        .replace(/^\s*\[![A-Za-z_-]+\]\s*/, '') // callout marker
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, '') // list / task markers
        .replace(/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-*:?\s*$/, '') // table separator rows
        .replace(/\|/g, ' ') // table cell borders
        .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/, ''), // horizontal rules
    );
    if (line) lines.push(line);
  }

  return { headings, body: lines.join(' ').replace(/\s+/g, ' ').trim() };
}

/** Strips inline Markdown/HTML syntax, keeping the readable text. */
function inline(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ') // HTML tags
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/`([^`]*)`/g, '$1') // inline code
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .replace(/[─│┌┐└┘├┤┬┴┼▲▼◄►→←↑↓⇄⇒]+/g, ' ') // box-drawing and arrows
    .replace(/\s+/g, ' ')
    .trim();
}
