/**
 * Build-time content check:
 * - fails the build on duplicate chapter slugs
 * - prints `CONTENT REQUIRED: …` for every placeholder chapter
 * - lists drafts, which production builds do not publish
 *
 * Frontmatter errors are reported by Astro's content collection itself.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { chapterSchema } from '../lib/content/schema';
import {
  assertUniqueSlugs,
  buildContentReport,
  formatContentReport,
  isDevOnlyPath,
  type ReportEntry,
} from '../lib/content/rules';

const CONTENT_DIR = 'content';

export function contentReport(): AstroIntegration {
  let root = process.cwd();

  return {
    name: 'systemly:content-report',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:build:start': async ({ logger }) => {
        const entries = await readEntries(path.join(root, CONTENT_DIR), root);
        assertUniqueSlugs(entries.map((e) => ({ slug: e.data.slug, source: e.source })));
        for (const line of formatContentReport(buildContentReport(entries))) logger.info(line);
      },
    },
  };
}

async function readEntries(dir: string, root: string): Promise<ReportEntry[]> {
  const files = await listMarkdown(dir);
  const entries: ReportEntry[] = [];
  for (const file of files) {
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
