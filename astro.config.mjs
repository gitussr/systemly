// @ts-check
import { defineConfig } from 'astro/config';

// Static output: Vercel serves the built files directly, no adapter needed.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
});
