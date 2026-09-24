// @ts-check
import { defineConfig } from 'astro/config';
import { markdownConfig } from './src/lib/markdown/config.ts';
import { contentReport } from './src/integrations/content-report.ts';
import { serviceWorker } from './src/integrations/service-worker.ts';

// Static output: Vercel serves the built files directly, no adapter needed.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  markdown: markdownConfig,
  integrations: [contentReport(), serviceWorker()],
});
