import type { ChapterData, ContentStatus } from './schema';

/** Drafts are visible while developing and never in a production build. */
export function isVisible(status: ContentStatus, isDev: boolean): boolean {
  return status !== 'draft' || isDev;
}

export function chapterHref(slug: string): string {
  return `/learn/${slug}`;
}

/** Throws with every duplicate listed, so one build run surfaces them all. */
export function assertUniqueSlugs(entries: { slug: string; source: string }[]): void {
  const seen = new Map<string, string[]>();
  for (const { slug, source } of entries) {
    seen.set(slug, [...(seen.get(slug) ?? []), source]);
  }
  const duplicates = [...seen].filter(([, sources]) => sources.length > 1);
  if (duplicates.length > 0) {
    const detail = duplicates.map(([slug, sources]) => `  "${slug}": ${sources.join(', ')}`).join('\n');
    throw new Error(`Duplicate chapter slugs:\n${detail}`);
  }
}

export interface ReportEntry {
  source: string;
  data: Pick<ChapterData, 'title' | 'slug' | 'level' | 'status'>;
}

export interface ContentReport {
  approved: number;
  drafts: ReportEntry[];
  placeholders: ReportEntry[];
}

export function buildContentReport(entries: ReportEntry[]): ContentReport {
  const byLevel = (a: ReportEntry, b: ReportEntry) =>
    a.data.level - b.data.level || a.data.title.localeCompare(b.data.title);
  return {
    approved: entries.filter((e) => e.data.status === 'approved').length,
    drafts: entries.filter((e) => e.data.status === 'draft').sort(byLevel),
    placeholders: entries.filter((e) => e.data.status === 'placeholder').sort(byLevel),
  };
}

export function formatContentReport(report: ContentReport): string[] {
  const lines = [
    `Content: ${report.approved} approved, ${report.placeholders.length} placeholder, ${report.drafts.length} draft`,
  ];
  for (const e of report.placeholders) {
    lines.push(`CONTENT REQUIRED: Level ${e.data.level} — ${e.data.title} (${e.source})`);
  }
  for (const e of report.drafts) {
    lines.push(`Draft, not published: Level ${e.data.level} — ${e.data.title} (${e.source})`);
  }
  return lines;
}

/** Folders starting with "_" (e.g. content/_samples) hold dev-only fixtures, never published. */
export const DEV_ONLY_GLOB = '!**/_*/**';

export function isDevOnlyPath(relativePath: string): boolean {
  return relativePath.replaceAll('\\', '/').split('/').slice(0, -1).some((part) => part.startsWith('_'));
}
