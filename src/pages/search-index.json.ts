/**
 * The serialised search index, generated at build time. The search page downloads it
 * on first use, so no other page pays for search.
 */
import type { APIRoute } from 'astro';
import { getCurriculumEntries } from '../lib/content/chapters';
import { buildConnections } from '../lib/content/graph';
import { createIndex } from '../lib/search/index';
import { toSearchDocument } from '../lib/search/documents';

export const GET: APIRoute = async () => {
  const entries = await getCurriculumEntries();
  const connections = buildConnections(entries.map((e) => e.data));
  const documents = entries.map((e) =>
    toSearchDocument(e.data, e.body ?? '', connections.get(e.data.slug)),
  );
  return new Response(JSON.stringify(createIndex(documents)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
