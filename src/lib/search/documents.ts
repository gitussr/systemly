import type { ChapterMeta } from '../content/catalog';
import type { Connections } from '../content/graph';
import { levelLabel } from '../content/levels';
import { chapterHref } from '../content/rules';
import type { ChapterData } from '../content/schema';
import { adrLabel, decisionHref } from '../decisions/records';
import type { DecisionData } from '../decisions/schema';
import { whyNotHref } from '../why-not/compare';
import type { Comparison } from '../why-not/schema';
import type { SearchDocument } from './index';
import { extractSearchText } from './text';

export function toSearchDocument(
  data: ChapterData,
  markdown: string,
  connections: Connections<ChapterMeta> = { related: [], referencedBy: [] },
): SearchDocument {
  // Placeholders have no approved text yet; only their metadata is searchable.
  const { headings, body } =
    data.status === 'placeholder' ? { headings: [], body: '' } : extractSearchText(markdown);
  const linked = [...connections.related, ...connections.referencedBy];
  return {
    id: data.slug,
    href: chapterHref(data.slug),
    title: data.title,
    chapter: data.chapter,
    levelLabel: levelLabel(data.level),
    status: data.status,
    summary: data.summary,
    aliases: data.aliases.join(' · '),
    tags: data.tags.join(' · '),
    topics: data.topics.join(' · '),
    headings: headings.join(' · '),
    connections: linked.map((c) => c.title).join(' · '),
    body,
    links: linked.map((c) => c.slug),
  };
}

export function decisionSearchId(slug: string): string {
  return `decision:${slug}`;
}

/**
 * A decision record, searchable by its title, summary, sections and text. It links to the
 * chapters it relies on, so those appear as related results.
 */
export function toDecisionSearchDocument(
  data: DecisionData,
  markdown: string,
  chapterTitles: Map<string, string>,
): SearchDocument {
  const { headings, body } =
    data.status === 'placeholder' ? { headings: [], body: '' } : extractSearchText(markdown);
  return {
    id: decisionSearchId(data.slug),
    href: decisionHref(data.slug),
    title: data.title,
    chapter: adrLabel(data.number),
    levelLabel: 'Decision record',
    status: data.status,
    summary: data.summary,
    aliases: [adrLabel(data.number), 'ADR', 'architecture decision record'].join(' · '),
    tags: data.tags.join(' · '),
    topics: '',
    headings: headings.join(' · '),
    connections: data.chapters.map((slug) => chapterTitles.get(slug) ?? '').filter(Boolean).join(' · '),
    body,
    links: data.chapters,
  };
}

/**
 * A "Why not?" comparison, searchable by its need and by every solution's name and text.
 * It links to the solutions' chapters, so a search for one solution surfaces its alternatives.
 */
export function toComparisonSearchDocument(c: Comparison): SearchDocument {
  const chapters = c.solutions.flatMap((s) => (s.chapter ? [s.chapter] : []));
  const written = c.status !== 'placeholder';
  return {
    id: `why-not:${c.id}`,
    href: whyNotHref(c.id),
    title: c.need,
    levelLabel: 'Why not?',
    status: c.status,
    summary: c.summary,
    aliases: 'why not · alternatives · comparison',
    tags: '',
    topics: c.solutions.map((s) => s.name).join(' · '),
    headings: '',
    connections: '',
    body: written ? c.solutions.flatMap((s) => [s.why ?? '', s.whyNot ?? '']).filter(Boolean).join(' ') : '',
    links: [...new Set(chapters)],
  };
}
