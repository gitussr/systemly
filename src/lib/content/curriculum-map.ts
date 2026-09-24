/**
 * Parses docs/curriculum-map.md into chapter stubs. Used once per new map revision by
 * scripts/generate-chapters.ts; after that the chapter files are the source of truth.
 *
 * Recognised lines:
 *   # LEVEL 2 — Scaling the Application      (one or two #)
 *   ### 02.06 — Load Balancer
 *   * bullet                                  (topics of the current chapter)
 * Parsing stops at the "CROSS-CURRICULUM" section.
 */

export interface MapChapter {
  chapter: string;
  level: number;
  order: number;
  title: string;
  topics: string[];
}

const LEVEL_LINE = /^#{1,2}\s+LEVEL\s+(\d+)\s+[—–-]\s+(.+?)\s*$/i;
const CHAPTER_LINE = /^###\s+(\d{2})\.(\d{2})\s+[—–-]\s+(.+?)\s*$/;
const BULLET_LINE = /^[*-]\s+(.+?)\s*$/;
const END_LINE = /^#{1,2}\s+CROSS-CURRICULUM/i;

export function parseCurriculumMap(markdown: string): MapChapter[] {
  const chapters: MapChapter[] = [];
  let level: number | undefined;
  let current: MapChapter | undefined;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (END_LINE.test(line)) break;

    const levelMatch = LEVEL_LINE.exec(line);
    if (levelMatch) {
      level = Number(levelMatch[1]);
      current = undefined;
      continue;
    }

    const chapterMatch = CHAPTER_LINE.exec(line);
    if (chapterMatch) {
      const [, levelPart, orderPart, title] = chapterMatch as unknown as [string, string, string, string];
      if (level === undefined || Number(levelPart) !== level) {
        throw new Error(`Chapter ${levelPart}.${orderPart} "${title}" is not under LEVEL ${Number(levelPart)}.`);
      }
      current = { chapter: `${levelPart}.${orderPart}`, level, order: Number(orderPart), title, topics: [] };
      chapters.push(current);
      continue;
    }

    if (line.startsWith('#')) {
      current = undefined;
      continue;
    }

    const bullet = BULLET_LINE.exec(line);
    if (bullet && current) current.topics.push(bullet[1]!);
  }

  const seen = new Set<string>();
  for (const c of chapters) {
    if (seen.has(c.chapter)) throw new Error(`Chapter number ${c.chapter} appears twice in the map.`);
    seen.add(c.chapter);
  }
  return chapters;
}

export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Short, readable keys used for folders and to disambiguate repeated titles. */
export const LEVEL_KEYS: Record<number, string> = {
  0: 'foundations',
  1: 'web-application',
  2: 'scaling',
  3: 'performance',
  4: 'data',
  5: 'async',
  6: 'distributed-systems',
  7: 'service-architecture',
  8: 'cloud',
  9: 'reliability',
  10: 'observability',
  11: 'security',
  12: 'case-studies',
};

/**
 * Assigns unique slugs in curriculum order. A title that repeats in a later level
 * (e.g. "Retries" in Level 2 and Level 5) gets that level's key as a suffix.
 */
export function assignSlugs(chapters: MapChapter[]): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set<string>();
  const ordered = [...chapters].sort((a, b) => a.chapter.localeCompare(b.chapter));
  for (const c of ordered) {
    let slug = slugify(c.title);
    if (used.has(slug)) slug = `${slug}-${LEVEL_KEYS[c.level] ?? `level-${c.level}`}`;
    if (used.has(slug)) slug = `${slug}-${c.chapter.replace('.', '-')}`;
    used.add(slug);
    result.set(c.chapter, slug);
  }
  return result;
}

export function levelFolder(level: number): string {
  return `${String(level).padStart(2, '0')}-${LEVEL_KEYS[level] ?? 'level'}`;
}

export function placeholderFile(c: MapChapter, slug: string): string {
  const lines = [
    '---',
    `title: ${JSON.stringify(c.title)}`,
    `chapter: "${c.chapter}"`,
    `slug: ${slug}`,
    `level: ${c.level}`,
    `order: ${c.order}`,
    'status: placeholder',
  ];
  if (c.topics.length > 0) {
    lines.push('topics:', ...c.topics.map((t) => `  - ${JSON.stringify(t)}`));
  }
  lines.push('---', '');
  return lines.join('\n');
}
