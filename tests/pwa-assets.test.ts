import { describe, expect, it } from 'vitest';
import { cssLatinFonts, htmlAssetRefs, jsStaticImports } from '../src/lib/pwa/assets';

describe('htmlAssetRefs', () => {
  it('collects same-origin files and ignores page links and external URLs', () => {
    const html = [
      '<link rel="stylesheet" href="/_astro/index.abc.css">',
      '<script type="module" src="/_astro/page.def.js"></script>',
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
      '<link rel="manifest" href="/manifest.webmanifest">',
      '<a href="/roadmap">Roadmap</a>',
      '<a href="/learn/http#top">HTTP</a>',
      '<a href="https://example.com/x.js">x</a>',
    ].join('');
    expect(htmlAssetRefs(html).sort()).toEqual([
      '/_astro/index.abc.css',
      '/_astro/page.def.js',
      '/favicon.svg',
      '/manifest.webmanifest',
    ]);
  });
});

describe('cssLatinFonts', () => {
  it('keeps only the basic Latin subset', () => {
    const css = [
      '@font-face{src:url(/_astro/google-sans-latin-wght-normal.a1.woff2) format("woff2-variations")}',
      '@font-face{src:url("/_astro/google-sans-latin-ext-wght-normal.b2.woff2")}',
      "@font-face{src:url('/_astro/lora-latin-wght-italic.c3.woff2')}",
      '@font-face{src:url(/_astro/lora-cyrillic-wght-italic.d4.woff2)}',
    ].join('');
    expect(cssLatinFonts(css)).toEqual([
      '/_astro/google-sans-latin-wght-normal.a1.woff2',
      '/_astro/lora-latin-wght-italic.c3.woff2',
    ]);
  });
});

describe('jsStaticImports', () => {
  it('resolves static imports and skips dynamic ones', () => {
    const js =
      'import{a as b}from"./shared.1.js";import"./side-effect.2.js";' +
      'const m=()=>import("./mermaid.3.js");export{b};';
    expect(jsStaticImports(js, '/_astro/page.js').sort()).toEqual([
      '/_astro/shared.1.js',
      '/_astro/side-effect.2.js',
    ]);
  });
});
