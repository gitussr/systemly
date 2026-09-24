# Systemly

Think about systems systematically.

An educational PWA for developers learning system design, from first principles to distributed systems. The product specification is in [`MASTER-PROMPT.md`](./MASTER-PROMPT.md).

## Stack

- [Astro](https://astro.build) with static output: pages are HTML at build time, JavaScript only where a page needs interactivity.
- TypeScript (strict).
- Plain CSS with design tokens in `src/styles/tokens.css`.
- Self-hosted fonts: Lora (titles), Google Sans (body/UI), both SIL OFL 1.1.
- Deployed on Vercel as static files (no adapter).

## Development

Requires Node 22.12 or newer.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check, then build to dist/
npm run preview   # serve dist/
```

## Structure

```text
src/
├── assets/       # images processed at build time (logo)
├── components/   # Astro components
├── config/       # site metadata and navigation
├── layouts/      # page layouts
├── pages/        # routes
└── styles/       # tokens and global styles
scripts/          # one-off asset scripts
```

`src/assets/logo-dark.png` is derived from `logo.png` by `node scripts/make-dark-logo.mjs`.
