/**
 * Build-time content check:
 * - fails the build on duplicate chapter slugs
 * - fails the build on `related` links to unknown slugs or to the chapter itself
 * - prints `CONTENT REQUIRED: …` for every placeholder chapter
 * - lists drafts, which production builds do not publish
 *
 * Frontmatter errors are reported by Astro's content collection itself.
 */
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { readContentFiles } from './content-files';
import { findRelatedIssues, formatRelatedIssue } from '../lib/content/graph';
import {
  assertUniqueSlugs,
  buildContentReport,
  formatContentReport,
} from '../lib/content/rules';

export function contentReport(): AstroIntegration {
  let root = process.cwd();

  return {
    name: 'systemly:content-report',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:build:start': async ({ logger }) => {
        const entries = await readContentFiles(root);
        assertUniqueSlugs(entries.map((e) => ({ slug: e.data.slug, source: e.source })));

        const issues = findRelatedIssues(
          entries.map((e) => ({ slug: e.data.slug, related: e.data.related, source: e.source })),
        );
        for (const issue of issues.filter((i) => i.kind === 'duplicate')) {
          logger.warn(formatRelatedIssue(issue));
        }
        const errors = issues.filter((i) => i.kind !== 'duplicate');
        if (errors.length > 0) {
          const detail = errors.map((i) => `  ${formatRelatedIssue(i)}`).join('\n');
          throw new Error(`Broken related links:\n${detail}`);
        }

        for (const line of formatContentReport(buildContentReport(entries))) logger.info(line);
      },
    },
  };
}

