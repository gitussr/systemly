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
npm run build     # type-check, test, then a full build to dist/
npm run preview   # serve dist/
```

## Structure

```text
content/          # canonical Markdown chapters (source of truth)
├── 00-foundations/ … 12-case-studies/   # one folder per roadmap level
└── _samples/     # dev-only rendering fixtures, never published
docs/
└── curriculum-map.md   # the approved curriculum map
src/
├── assets/       # images processed at build time (logo)
├── components/   # Astro components
├── config/       # site metadata and navigation
├── integrations/ # build-time content report
├── layouts/      # page layouts
├── lib/
│   ├── content/  # schema, publishing rules, catalog (ordering, grouping), curriculum-map parser
│   └── markdown/ # Markdown pipeline and plugins (headings, callouts, tables, task lists)
├── pages/        # /, /roadmap, /learn (A–Z library), /learn/<slug>
└── styles/       # tokens, global styles, prose styles
scripts/          # one-off asset scripts
tests/            # Vitest unit tests
```

`src/assets/logo-dark.png` is derived from `logo.png` by `node scripts/make-dark-logo.mjs`.

## Writing content

Chapters are Markdown files under `content/`, one folder per roadmap level. The folder is for organisation only; the URL comes from `slug`, so moving a file never breaks a link.

Every chapter in `docs/curriculum-map.md` already has a placeholder file. To write a chapter, fill in its file and change `status` to `approved`. When the map gains new chapters, run `node scripts/generate-chapters.ts` (add `--dry-run` to preview); it only creates missing files and never touches existing ones.

```yaml
---
title: Load Balancer
chapter: "02.06"             # curriculum number; must start with the level
slug: load-balancer          # required, kebab-case, unique → /learn/load-balancer
level: 2                     # required, 0–12 (roadmap level)
order: 4                     # position within the level
difficulty: intermediate     # beginner | intermediate | advanced
status: approved             # approved | draft (default) | placeholder
summary: One sentence.
tags: [scaling, networking]
aliases: [LB]
related: [reverse-proxy, health-checks]
topics: [L4 vs L7, Algorithms]   # outline shown on the roadmap and placeholder page
---
```

| Status | Production build | `npm run dev` |
|---|---|---|
| `approved` | Published | Shown |
| `draft` | Not published | Shown, marked as draft |
| `placeholder` | Published as "In preparation"; build prints `CONTENT REQUIRED` | Same |

The build fails on duplicate slugs or invalid frontmatter.

### Headings

Write chapters the way that reads best in the file; the renderer fits the outline under the page title:

- A leading `# Title` that repeats the frontmatter title is not rendered twice.
- If sections use `#`, every heading moves down one level.
- Skipped levels (e.g. `#` followed by `###`) are closed, so the page outline stays valid for screen readers.

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
