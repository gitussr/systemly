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
npm test          # unit tests (Vitest)
npm run build     # type-check, test, then build to dist/
npm run preview   # serve dist/
```

## Structure

```text
content/          # canonical Markdown chapters (source of truth)
└── _samples/     # dev-only rendering fixtures, never published
src/
├── assets/       # images processed at build time (logo)
├── components/   # Astro components
├── config/       # site metadata and navigation
├── integrations/ # build-time content report
├── layouts/      # page layouts
├── lib/
│   ├── content/  # frontmatter schema, publishing rules, levels
│   └── markdown/ # Markdown pipeline and plugins (callouts, tables, task lists)
├── pages/        # routes; chapters render at /learn/<slug>
└── styles/       # tokens, global styles, prose styles
scripts/          # one-off asset scripts
tests/            # Vitest unit tests
```

`src/assets/logo-dark.png` is derived from `logo.png` by `node scripts/make-dark-logo.mjs`.

## Writing content

Chapters are Markdown files anywhere under `content/`. The folder is for organisation only; the URL comes from `slug`, so moving a file never breaks a link.

```yaml
---
title: Load Balancer
slug: load-balancer          # required, kebab-case, unique → /learn/load-balancer
level: 2                     # required, 0–12 (roadmap level)
order: 4                     # position within the level
difficulty: intermediate     # beginner | intermediate | advanced
status: approved             # approved | draft (default) | placeholder
summary: One sentence.
tags: [scaling, networking]
aliases: [LB]
related: [reverse-proxy, health-checks]
---
```

| Status | Production build | `npm run dev` |
|---|---|---|
| `approved` | Published | Shown |
| `draft` | Not published | Shown, marked as draft |
| `placeholder` | Published as "In preparation"; build prints `CONTENT REQUIRED` | Same |

The build fails on duplicate slugs or invalid frontmatter.

### Callouts

GitHub alert syntax, so files still read correctly on GitHub:

```markdown
> [!TRADE-OFF]
> Replicas add read capacity but may serve stale data.

> [!FAILURE] When the cache is cold
> Text after the marker becomes a custom title.
```

Types: `MENTAL-MODEL`, `PROBLEM`, `TRADE-OFF`, `FAILURE`, `EVOLUTION`, `LOCK-IN`, and GitHub's `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`.

The renderer keeps text exactly as written: it does not convert quotes, `--` or `...` into typographic characters. `mermaid` code blocks show as source until diagram rendering is added.

To preview every supported format, run `npm run dev` and open `/learn/rendering-test`.
