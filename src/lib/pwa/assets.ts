/**
 * Finds the static files a built page depends on, so the service worker can save exactly
 * what is needed to read that page offline — and nothing that is loaded only on demand.
 */

/** Same-origin file references in HTML (src, href). Page links are excluded by extension. */
export function htmlAssetRefs(html: string): string[] {
  const refs = new Set<string>();
  for (const match of html.matchAll(/\s(?:src|href)="(\/[^"#?]+)"/g)) {
    const path = match[1]!;
    if (/\.(?:css|js|mjs|woff2|svg|png|webp|jpe?g|ico|webmanifest|json)$/.test(path)) refs.add(path);
  }
  return [...refs];
}

/**
 * Font files referenced by a stylesheet, limited to the basic Latin subset.
 * Browsers download other subsets only for text that needs them, so precaching
 * them would waste space.
 */
export function cssLatinFonts(css: string): string[] {
  const fonts = new Set<string>();
  for (const match of css.matchAll(/url\(\s*["']?(\/[^"')]+\.woff2)["']?\s*\)/g)) {
    const path = match[1]!;
    if (/-latin-(?!ext)/.test(path)) fonts.add(path);
  }
  return [...fonts];
}

/**
 * Static imports of a built module, resolved against its directory.
 * Dynamic `import("…")` is ignored on purpose: those chunks (e.g. Mermaid) load on demand
 * and are cached at runtime the first time they are used.
 */
export function jsStaticImports(js: string, fromPath: string): string[] {
  const dir = fromPath.slice(0, fromPath.lastIndexOf('/') + 1);
  const imports = new Set<string>();
  for (const match of js.matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.{1,2}\/[^"']+\.m?js)["']/g)) {
    imports.add(new URL(match[1]!, `https://x${dir}`).pathname);
  }
  return [...imports];
}
