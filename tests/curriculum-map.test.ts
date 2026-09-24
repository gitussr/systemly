import { describe, expect, it } from 'vitest';
import {
  assignSlugs,
  levelFolder,
  parseCurriculumMap,
  placeholderFile,
  slugify,
} from '../src/lib/content/curriculum-map';
import { chapterSchema } from '../src/lib/content/schema';
import { parseFrontmatter } from '@astrojs/markdown-remark';

const MAP = `# Map

## LEVEL 0 — Foundations

### 00.01 — What Is a System?

* Components
* State

### 00.02 — Computer Fundamentals

---

# LEVEL 2 — Scaling the Application

### 02.11 — Retries

# LEVEL 5 — Asynchronous Systems

### 05.12 — Retries

# CROSS-CURRICULUM SYSTEMLY FEATURES

### 99.99 — Not a chapter
`;

describe('parseCurriculumMap', () => {
  const chapters = parseCurriculumMap(MAP);

  it('reads levels, chapters and topic bullets, with # or ## level headings', () => {
    expect(chapters.map((c) => c.chapter)).toEqual(['00.01', '00.02', '02.11', '05.12']);
    expect(chapters[0]).toEqual({
      chapter: '00.01',
      level: 0,
      order: 1,
      title: 'What Is a System?',
      topics: ['Components', 'State'],
    });
    expect(chapters[1]!.topics).toEqual([]);
  });

  it('stops at the cross-curriculum section', () => {
    expect(chapters.some((c) => c.chapter === '99.99')).toBe(false);
  });

  it('rejects a chapter filed under the wrong level', () => {
    expect(() => parseCurriculumMap('# LEVEL 1 — Web\n\n### 02.01 — Wrong')).toThrow(/not under LEVEL 2/);
  });

  it('rejects duplicate chapter numbers', () => {
    expect(() => parseCurriculumMap('# LEVEL 1 — Web\n### 01.01 — A\n### 01.01 — B')).toThrow(/appears twice/);
  });
});

describe('slugs', () => {
  it('slugifies titles with punctuation and dashes', () => {
    expect(slugify('What Is a System?')).toBe('what-is-a-system');
    expect(slugify('Client–Server Architecture')).toBe('client-server-architecture');
    expect(slugify('HTTPS & TLS')).toBe('https-tls');
    expect(slugify('p50 / p95 / p99')).toBe('p50-p95-p99');
  });

  it('keeps the first occurrence and suffixes later repeats with the level key', () => {
    const slugs = assignSlugs(parseCurriculumMap(MAP));
    expect(slugs.get('02.11')).toBe('retries');
    expect(slugs.get('05.12')).toBe('retries-async');
  });
});

describe('placeholder files', () => {
  it('produce frontmatter that passes the chapter schema', () => {
    const [chapter] = parseCurriculumMap(MAP);
    const { frontmatter } = parseFrontmatter(placeholderFile(chapter!, 'what-is-a-system'));
    const data = chapterSchema.parse(frontmatter);
    expect(data).toMatchObject({
      title: 'What Is a System?',
      chapter: '00.01',
      level: 0,
      order: 1,
      status: 'placeholder',
      topics: ['Components', 'State'],
    });
  });

  it('go into numbered level folders', () => {
    expect(levelFolder(0)).toBe('00-foundations');
    expect(levelFolder(12)).toBe('12-case-studies');
  });
});
