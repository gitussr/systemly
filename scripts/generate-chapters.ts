/**
 * Creates a placeholder file for every chapter in docs/curriculum-map.md that does not
 * exist yet under content/. Never modifies or overwrites existing files.
 *
 * Run: node scripts/generate-chapters.ts [--dry-run]
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assignSlugs,
  levelFolder,
  parseCurriculumMap,
  placeholderFile,
  slugify,
} from '../src/lib/content/curriculum-map.ts';

const MAP = 'docs/curriculum-map.md';
const CONTENT = 'content';
const dryRun = process.argv.includes('--dry-run');

const chapters = parseCurriculumMap(await readFile(MAP, 'utf8'));
const slugs = assignSlugs(chapters);
const existing = await existingChapterNumbers(CONTENT);

let created = 0;
for (const c of chapters) {
  if (existing.has(c.chapter)) continue;
  const slug = slugs.get(c.chapter)!;
  const file = path.join(CONTENT, levelFolder(c.level), `${c.chapter}-${slug}.md`);
  if (!dryRun) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, placeholderFile(c, slug), { flag: 'wx' });
  }
  created++;
  console.log(`${dryRun ? 'would create' : 'created'} ${file.replaceAll(path.sep, '/')}`);
}

const renamed = chapters.filter((c) => slugs.get(c.chapter) !== slugify(c.title));
console.log(`\n${chapters.length} chapters in map, ${existing.size} already present, ${created} ${dryRun ? 'to create' : 'created'}.`);
if (renamed.length > 0) console.log(`Disambiguated slugs: ${renamed.map((c) => `${c.chapter} → ${slugs.get(c.chapter)}`).join(', ')}`);


async function existingChapterNumbers(dir: string): Promise<Set<string>> {
  const numbers = new Set<string>();
  const items = await readdir(dir, { withFileTypes: true, recursive: true }).catch(() => []);
  for (const item of items) {
    if (!item.isFile() || !item.name.endsWith('.md')) continue;
    const text = await readFile(path.join(item.parentPath, item.name), 'utf8');
    const match = /^chapter:\s*["']?(\d{2}\.\d{2})["']?\s*$/m.exec(text);
    if (match) numbers.add(match[1]!);
  }
  return numbers;
}
