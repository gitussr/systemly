import { describe, expect, it } from 'vitest';
import { activeSection, readingMinutes, readingProgress, timeLeftLabel } from '../src/lib/reading/progress';
import { chapterState, currentGroupIndex, groupSummary, loadLog, parseLog, recordProgress } from '../src/lib/reading/store';

describe('readingProgress', () => {
  it('runs from the article top at the viewport top to its bottom at the viewport bottom', () => {
    // 3000px article in an 800px viewport: 2200px of scrolling.
    expect(readingProgress(120, 3000, 800)).toBe(0);
    expect(readingProgress(0, 3000, 800)).toBe(0);
    expect(readingProgress(-1100, 3000, 800)).toBe(0.5);
    expect(readingProgress(-2200, 3000, 800)).toBe(1);
    expect(readingProgress(-5000, 3000, 800)).toBe(1);
  });

  it('counts a short article as read once all of it is on screen', () => {
    expect(readingProgress(100, 500, 800)).toBe(1);
    expect(readingProgress(400, 500, 800)).toBe(0);
  });
});

describe('readingMinutes', () => {
  it('rounds to whole minutes, with at least one for any text', () => {
    expect(readingMinutes(0)).toBe(0);
    expect(readingMinutes(50)).toBe(1);
    expect(readingMinutes(2900)).toBe(15);
  });
});

describe('timeLeftLabel', () => {
  it('counts down and finishes', () => {
    expect(timeLeftLabel(12, 0)).toBe('12 min left');
    expect(timeLeftLabel(12, 0.5)).toBe('6 min left');
    expect(timeLeftLabel(12, 0.95)).toBe('Under a minute left');
    expect(timeLeftLabel(12, 1)).toBe('Finished');
    expect(timeLeftLabel(0, 0.3)).toBe('');
  });
});

describe('activeSection', () => {
  it('picks the last heading above the line', () => {
    expect(activeSection([200, 900, 1600], 100)).toBe(-1);
    expect(activeSection([50, 900, 1600], 100)).toBe(0);
    expect(activeSection([-800, -100, 100], 100)).toBe(2);
    expect(activeSection([], 100)).toBe(-1);
  });
});

describe('reading log', () => {
  const memory = (): Storage => {
    const data = new Map<string, string>();
    return {
      get length() {
        return data.size;
      },
      clear: () => data.clear(),
      getItem: (k) => data.get(k) ?? null,
      key: (i) => [...data.keys()][i] ?? null,
      removeItem: (k) => void data.delete(k),
      setItem: (k, v) => void data.set(k, String(v)),
    };
  };

  it('keeps the furthest point reached per chapter', () => {
    const store = memory();
    expect(recordProgress('dns', 0.4, store)).toBe(0.4);
    expect(recordProgress('dns', 0.2, store)).toBe(0.4);
    expect(recordProgress('dns', 1.2, store)).toBe(1);
    expect(loadLog(store)).toEqual({ dns: 1 });
  });

  it('ignores malformed saved data', () => {
    expect(parseLog('not json')).toEqual({});
    expect(parseLog('[1,2]')).toEqual({});
    expect(parseLog('{"a":0.5,"b":"x","c":-1}')).toEqual({ a: 0.5 });
  });

  it('summarises a level', () => {
    expect(chapterState(undefined)).toBe('unread');
    expect(chapterState(0.3)).toBe('started');
    expect(chapterState(0.96)).toBe('read');
    expect(groupSummary(['a', 'b', 'c', 'd'], { a: 1, b: 0.5, c: 0.97 })).toEqual({ read: 2, total: 4, percent: 50 });
    expect(groupSummary([], {})).toEqual({ read: 0, total: 0, percent: 0 });
  });

  it('finds the level the reader is working through', () => {
    const levels = [['a', 'b'], [], ['c'], ['d']];
    expect(currentGroupIndex(levels, {})).toBe(0);
    expect(currentGroupIndex(levels, { a: 1, b: 0.5 })).toBe(0);
    // Level 1 has no available chapters, so it is skipped.
    expect(currentGroupIndex(levels, { a: 1, b: 1 })).toBe(2);
    expect(currentGroupIndex(levels, { a: 1, b: 1, c: 1, d: 1 })).toBe(3);
    expect(currentGroupIndex([[], []], {})).toBe(0);
  });
});
