import { describe, expect, it } from 'vitest';
import {
  firstAvailable,
  groupAlphabetically,
  groupByLevel,
  neighbours,
  sortChapters,
  type ChapterMeta,
} from '../src/lib/content/catalog';

const ch = (
  chapter: string,
  title: string,
  status: ChapterMeta['status'] = 'placeholder',
): ChapterMeta => ({
  chapter,
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  level: Number(chapter.slice(0, 2)),
  order: Number(chapter.slice(3)),
  status,
  topics: [],
});

const chapters = [
  ch('02.06', 'Load Balancer'),
  ch('00.02', 'Computer Fundamentals'),
  ch('00.01', 'What Is a System?', 'approved'),
  ch('02.01', 'Why Systems Need to Scale'),
  ch('10.09', 'p50 / p95 / p99'),
];

describe('catalog', () => {
  it('sorts by level, then order', () => {
    expect(sortChapters(chapters).map((c) => c.chapter)).toEqual(['00.01', '00.02', '02.01', '02.06', '10.09']);
  });

  it('lists every roadmap level, including empty ones, with availability counts', () => {
    const levels = groupByLevel(chapters);
    expect(levels.map((l) => l.level)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(levels[0]).toMatchObject({ name: 'Foundations', available: 1 });
    expect(levels[0]!.chapters).toHaveLength(2);
    expect(levels[1]!.chapters).toHaveLength(0);
  });

  it('groups A–Z case-insensitively, non-letters first under #', () => {
    const groups = groupAlphabetically(chapters);
    expect(groups.map((g) => g.letter)).toEqual(['C', 'L', 'P', 'W']);
    expect(groups.find((g) => g.letter === 'W')!.chapters.map((c) => c.title)).toEqual([
      'What Is a System?',
      'Why Systems Need to Scale',
    ]);
    expect(groupAlphabetically([ch('00.01', '3-tier')])[0]!.letter).toBe('#');
  });

  it('links previous and next across level boundaries', () => {
    const { previous, next } = neighbours(chapters, 'computer-fundamentals');
    expect(previous?.chapter).toBe('00.01');
    expect(next?.chapter).toBe('02.01');
    expect(neighbours(chapters, 'what-is-a-system-').previous).toBeUndefined();
    expect(neighbours(chapters, 'missing')).toEqual({});
  });

  it('starts beginners at the first available chapter', () => {
    expect(firstAvailable(chapters)?.title).toBe('What Is a System?');
    expect(firstAvailable([ch('00.02', 'X')])).toBeUndefined();
  });
});
