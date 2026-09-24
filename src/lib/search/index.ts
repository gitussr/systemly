/**
 * Search index definition, shared by the build (which creates and serialises the index)
 * and the browser (which loads it). Both sides must use the same options.
 */
import MiniSearch, { type Options, type SearchResult } from 'minisearch';

export interface SearchDocument {
  id: string; // slug
  title: string;
  chapter?: string;
  level: number;
  levelLabel: string;
  status: string;
  summary?: string;
  aliases: string;
  tags: string;
  topics: string;
  headings: string;
  /** Titles of connected chapters, so a search for one surfaces its neighbours. */
  connections: string;
  body: string;
  /** Slugs of connected chapters, used to expand results with related topics. */
  links: string[];
}

export type StoredFields = Pick<
  SearchDocument,
  'id' | 'title' | 'chapter' | 'levelLabel' | 'status' | 'summary' | 'links'
>;

export const SEARCH_FIELDS = [
  'title',
  'aliases',
  'tags',
  'topics',
  'headings',
  'summary',
  'connections',
  'body',
] as const;

export const searchOptions: Options<SearchDocument> = {
  fields: [...SEARCH_FIELDS],
  storeFields: ['id', 'title', 'chapter', 'levelLabel', 'status', 'summary', 'links'],
  searchOptions: {
    boost: {
      title: 6,
      aliases: 5,
      tags: 3,
      topics: 2.5,
      headings: 2,
      summary: 1.5,
      connections: 1,
      body: 1,
    },
    prefix: true,
    fuzzy: (term) => (term.length > 4 ? 0.2 : false),
    combineWith: 'AND',
  },
};

export function createIndex(documents: SearchDocument[]): MiniSearch<SearchDocument> {
  const index = new MiniSearch<SearchDocument>(searchOptions);
  index.addAll(documents);
  return index;
}

export function loadIndex(json: string): MiniSearch<SearchDocument> {
  return MiniSearch.loadJSON<SearchDocument>(json, searchOptions);
}

export type Hit = StoredFields & { score: number };

export interface SearchResults {
  hits: Hit[];
  /** Chapters connected to the strongest hits that did not match directly. */
  related: (StoredFields & { via: string })[];
}

/**
 * Direct matches, plus chapters linked to the top matches. A search is a question about a
 * problem, so neighbouring concepts are part of the answer.
 */
export function search(
  index: MiniSearch<SearchDocument>,
  query: string,
  { limit = 30, expandFrom = 3, relatedLimit = 8 } = {},
): SearchResults {
  const q = query.trim();
  if (!q) return { hits: [], related: [] };

  let raw: SearchResult[] = index.search(q);
  // If every word must match and nothing does, fall back to any word.
  if (raw.length === 0 && q.includes(' ')) raw = index.search(q, { combineWith: 'OR' });

  const hits = raw.slice(0, limit).map((r) => ({ ...(r as unknown as StoredFields), score: r.score }));
  const seen = new Set(hits.map((h) => h.id));
  const related: SearchResults['related'] = [];

  for (const hit of hits.slice(0, expandFrom)) {
    for (const slug of hit.links) {
      if (seen.has(slug) || related.length >= relatedLimit) continue;
      const doc = index.getStoredFields(slug) as StoredFields | undefined;
      if (!doc) continue;
      seen.add(slug);
      related.push({ ...doc, id: slug, via: hit.title });
    }
  }
  return { hits, related };
}
