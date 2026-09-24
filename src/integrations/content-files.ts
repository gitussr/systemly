/**
 * Reads chapter frontmatter straight from content/ for build-time integrations
 * (they run outside Astro's content collection API). Dev-only fixtures are skipped.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { chapterSchema, type ChapterData } from '../lib/content/schema';
import { isDevOnlyPath } from '../lib/content/rules';

export const CONTENT_DIR = 'content';

export interface ContentFile {
  /** Path relative to the project root, with forward slashes. */
  source: string;
  data: ChapterData;
}

/** Valid chapters under content/. Invalid frontmatter is reported by Astro itself. */
export async function readContentFiles(root: string): Promise<ContentFile[]> {
  const dir = path.join(root, CONTENT_DIR);
  const entries: ContentFile[] = [];
  for (const file of await listMarkdown(dir)) {
    if (isDevOnlyPath(path.relative(dir, file))) continue;
    const { frontmatter } = parseFrontmatter(await readFile(file, 'utf8'));
    const parsed = chapterSchema.safeParse(frontmatter);
    if (parsed.success) {
      entries.push({ source: path.relative(root, file).replaceAll('\\', '/'), data: parsed.data });
    }
  }
  return entries;
}

async function listMarkdown(dir: string): Promise<string[]> {
  let items;
  try {
    items = await readdir(dir, { withFileTypes: true, recursive: true });
  } catch {
    return [];
  }
  return items
    .filter((item) => item.isFile() && item.name.endsWith('.md'))
    .map((item) => path.join(item.parentPath, item.name))
    .sort();
}
