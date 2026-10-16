# Architecture & Project Structure

Applies to every task. Read before creating any file.

## Stack (pinned)

- Next.js **16.4.1** App Router, React **19.3**, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/turbopack`)
- Turbopack is the default bundler. **No custom `webpack` key** — it will break `next build`.
- `cacheComponents: true` and `partialPrefetching: true` are already on in `next.config.ts`.
- Supabase (remote MCP, project ref `cxwrvstojafdjqvelbno`) is the only backend.

## Commands

```sh
npm run dev       # next dev  (Turbopack)
npm run build     # next build — MUST pass before claiming a task is done
npm run lint      # eslint
npm run typecheck # tsc --noEmit
npm test          # vitest run
npm run test:e2e  # playwright (builds + serves production first)
npm run verify    # lint + build + test — the one command to run before reporting done
```

## Directory layout

```
app/
  layout.tsx          # root layout, fonts, <html lang>
  page.tsx            # /
  (marketing)/       # route groups for landing pages — no URL segment added
    about/page.tsx
  sitemap.ts          # default export MetadataRoute.Sitemap
  robots.ts           # default export MetadataRoute.Robots
  manifest.ts         # default export MetadataRoute.Manifest
  opengraph-image.tsx # ImageResponse from 'next/og'
  api/                # route handlers, typed with RouteContext<'/path'>
components/
  ui/                 # shadcn primitives (base-nova; `cn` comes from the `cn` package)
  sections/           # page-level sections (hero, stats, testimonials)
  gsap/               # animation wrappers (see frontend-design.md)
lib/
  supabase/           # server + browser clients, queries
  seo.ts              # metadata builders, JSON-LD helpers
  utils.ts            # re-exports `cn` from the `cn` package — do not hand-roll clsx+twMerge
tests/
  setup.ts            # jsdom shims (matchMedia, ResizeObserver, IntersectionObserver)
  unit/               # vitest
  integration/        # vitest + test Supabase
  e2e/                # playwright
vitest.config.ts
playwright.config.ts
components.json       # shadcn config
supabase/
  migrations/         # SQL migrations, applied via supabase_apply_migration
```

Rules:
- Route groups `(folder)` organise without affecting URL.
- `components/` never imports from `app/`. `app/` composes.
- Server Components by default. Add `'use client'` only for interactivity, hooks, or browser APIs.
- No barrel `index.ts` re-exports in `components/` — import the file directly.

## Next 16 breaking changes — never write the old way

| Do NOT | Do instead |
|---|---|
| `middleware.ts` / `export function middleware` | `proxy.ts` / `export function proxy` (nodejs runtime only) |
| `revalidateTag('posts')` | `revalidateTag('posts', 'max')` — 2nd arg required |
| `unstable_cacheLife` / `unstable_cacheTag` | `cacheLife` / `cacheTag` from `next/cache` |
| `metadata.themeColor` / `metadata.viewport` | separate `export const viewport: Viewport` |
| `<Image priority>` | `<Image preload>` |
| `experimental.useCache` / `experimental.dynamicIO` | `cacheComponents: true` |
| sync `cookies()`, `headers()`, `params`, `searchParams` | always `await` — they are Promises |
| `next lint` | `eslint` directly |
| `<Image>` with no `images.qualities` | `images.qualities` is **required** in `next.config.ts` |

`images.remotePatterns` must specify `protocol`, `port`, `pathname`, `search` explicitly. Omitting them implies `**` and is a security hole.

## Type helpers (global, do not import)

`PageProps<'/route'>`, `LayoutProps<'/route'>`, `RouteContext<'/api/x/[id]'>`. Run `npx next typegen` after adding routes.

## Testing config

- `vitest.config.ts` uses esbuild's automatic JSX runtime, **not** `@vitejs/plugin-react`. Next 16 bundles with Turbopack; adding the plugin pulls in a second Vite major and breaks type resolution. Do not re-add it.
- `lib/utils.ts` re-exports `cn` from the `cn` package (shadcn base-nova style), not a hand-rolled `clsx` + `tailwind-merge`.
- The `@` alias is configured in both `tsconfig.json` and `vitest.config.ts`. New tooling must honour it.

## Skills to load for structure questions

- `nextjs-app-router-patterns` — file conventions, streaming, parallel/intercepting routes
- `next-dev-loop` — official Vercel dev/verify workflow
- `nextjs16-skills` — version-specific API deltas

**Before writing Next.js code, read the matching file in `node_modules/next/dist/docs/`.** Do not rely on memory.
