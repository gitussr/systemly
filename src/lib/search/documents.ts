import type { ChapterMeta } from '../content/catalog';
import type { Connections } from '../content/graph';
import { levelLabel } from '../content/levels';
import type { ChapterData } from '../content/schema';
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
    title: data.title,
    chapter: data.chapter,
    level: data.level,
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
