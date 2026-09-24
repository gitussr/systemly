import { describe, expect, it } from 'vitest';
import { extractSearchText } from '../src/lib/search/text';
import { toSearchDocument } from '../src/lib/search/documents';
import { createIndex, loadIndex, search } from '../src/lib/search/index';
import { chapterSchema, type ChapterData } from '../src/lib/content/schema';

describe('extractSearchText', () => {
  const md = [
    '# What Is a System?',
    '',
    'A **system** has `components` and [links](/x).',
    '',
    '```text',
    'Client ──► Server',
    '```',
    '',
    '> [!TRADE-OFF]',
    '> Caching trades freshness for speed.',
    '',
    '| Option | Cost |',
    '|---|---|',
    '| Cache | Low |',
    '',
    '- [x] Done item',
    '1. First step',
    '',
    '## Components',
  ].join('\n');

  it('keeps readable text and headings, drops code and syntax', () => {
    const { headings, body } = extractSearchText(md);
    expect(headings).toEqual(['What Is a System?', 'Components']);
    expect(body).toContain('A system has components and links.');
    expect(body).toContain('Caching trades freshness for speed.');
    expect(body).toContain('Option Cost');
    expect(body).toContain('Done item');
    expect(body).toContain('First step');
    expect(body).not.toMatch(/Client|──|\*\*|`|\[!|---/);
  });
});

const chapter = (data: Partial<ChapterData> & { title: string; slug: string }): ChapterData =>
  chapterSchema.parse({ level: 0, status: 'approved', ...data });

describe('search', () => {
  const redis = chapter({
    title: 'Redis',
    slug: 'redis',
    level: 3,
    chapter: '03.15',
    aliases: ['in-memory data store'],
    tags: ['caching'],
  });
  const caching = chapter({ title: 'Caching', slug: 'caching', level: 3, chapter: '03.04' });
  const rateLimiting = chapter({ title: 'Rate Limiting', slug: 'rate-limiting', level: 2, chapter: '02.14' });
  const locks = chapter({ title: 'Distributed Locks', slug: 'distributed-locks', level: 6, chapter: '06.09' });
  const system = chapter({
    title: 'What Is a System?',
    slug: 'what-is-a-system',
    chapter: '00.01',
    topics: ['Boundaries'],
  });

  const docs = [
    toSearchDocument(redis, '', { related: [caching, rateLimiting, locks], referencedBy: [] }),
    toSearchDocument(caching, 'Keep hot data close to the reader.'),
    toSearchDocument(rateLimiting, ''),
    toSearchDocument(locks, ''),
    toSearchDocument(system, '## State\n\nA system remembers things between requests.'),
  ];
  // Round-trip through JSON exactly like the browser does.
  const index = loadIndex(JSON.stringify(createIndex(docs)));

  it('ranks a title match first and expands to its related topics', () => {
    const { hits, related } = search(index, 'redis');
    expect(hits[0]!.id).toBe('redis');
    expect(related.map((r) => r.id)).toEqual(expect.arrayContaining(['rate-limiting', 'distributed-locks']));
    expect(related.every((r) => r.via === 'Redis')).toBe(true);
  });

  it('never lists a chapter both as a hit and as related', () => {
    const { hits, related } = search(index, 'redis');
    const hitIds = new Set(hits.map((h) => h.id));
    expect(related.some((r) => hitIds.has(r.id))).toBe(false);
  });

  it('matches aliases, topics, headings and body text', () => {
    expect(search(index, 'in-memory').hits[0]!.id).toBe('redis');
    expect(search(index, 'boundaries').hits[0]!.id).toBe('what-is-a-system');
    expect(search(index, 'remembers').hits[0]!.id).toBe('what-is-a-system');
    expect(search(index, 'hot data').hits[0]!.id).toBe('caching');
  });

  it('matches prefixes and small typos', () => {
    expect(search(index, 'distrib').hits[0]!.id).toBe('distributed-locks');
    expect(search(index, 'cacheing').hits.map((h) => h.id)).toContain('caching');
  });

  it('falls back to any word when no chapter matches every word', () => {
    expect(search(index, 'redis banana').hits.map((h) => h.id)).toContain('redis');
  });

  it('returns nothing for an empty query', () => {
    expect(search(index, '   ')).toEqual({ hits: [], related: [] });
  });

  it('does not index placeholder bodies', () => {
    const doc = toSearchDocument(
      chapter({ title: 'Kafka', slug: 'kafka', status: 'placeholder' }),
      'unapproved draft text',
    );
    expect(doc.body).toBe('');
  });
});
