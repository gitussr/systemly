/**
 * The serialised search index, generated at build time. The search page downloads it
 * on first use, so no other page pays for search.
 */
import type { APIRoute } from 'astro';
import { getCurriculumEntries } from '../lib/content/chapters';
import { buildConnections } from '../lib/content/graph';
import { createIndex } from '../lib/search/index';
import { toComparisonSearchDocument, toDecisionSearchDocument, toSearchDocument } from '../lib/search/documents';
import { getComparisons } from '../lib/why-not/collection';
import { getDecisionCatalog } from '../lib/decisions/collection';
import { isDevOnlyPath } from '../lib/content/rules';

export const GET: APIRoute = async () => {
  const [entries, decisions, comparisons] = await Promise.all([
    getCurriculumEntries(),
    getDecisionCatalog(),
    getComparisons(),
  ]);
  const connections = buildConnections(entries.map((e) => e.data));
  const titles = new Map(entries.map((e) => [e.data.slug, e.data.title]));
  const documents = [
    ...entries.map((e) => toSearchDocument(e.data, e.body ?? '', connections.get(e.data.slug))),
    ...decisions.entries
      .filter((e) => !isDevOnlyPath(e.filePath ?? ''))
      .map((e) => toDecisionSearchDocument(e.data, e.body ?? '', titles)),
    ...comparisons.map(toComparisonSearchDocument),
  ];
  return new Response(JSON.stringify(createIndex(documents)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
