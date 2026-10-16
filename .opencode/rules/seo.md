# SEO — Kenya / East Africa Organic Reach

Applies to every **public, indexable** page: landing pages, about, programmes, contact, blog, donation pages.

## Skills to load

Load the `seo` skill family before touching metadata. Minimum: `seo-audit`, `seo-technical`, `seo-schema`, `seo-sitemap`, `seo-images`, `seo-page`. Add `seo-local` for anything with a physical address, `seo-geo` for country targeting, `seo-content` for long-form copy.

## Kenya-specific targeting

- Primary locale: `en-KE`. Use `lang="en-KE"` on the root `<html>`.
- Reference language: `sw-KE` (Kiswahili) — add `alternates.languages` when translated pages exist.
- Target currency **KES** (`KSh`), phone format `+254…`, addresses in Nairobi/Kenya.
- Google Kenya ranks on local relevance + E-E-A-T. Nonprofits must show:
  - Registration / NGO number and legal entity name ("Imarisha Dada")
  - Named founders/board, physical address, verifiable contact
  - Impact numbers with the reporting period stated ("142 girls in 2025")
- Mobile-first and low-bandwidth: Kenyan users are largely on mobile + metered data. Target Lighthouse mobile ≥ 90. No autoplay video, cap hero images ≤ 200 KB AVIF/WebP.

## Per-page checklist

1. **Unique `title`** — 50–60 chars, brand or keyword at the front, no duplication across pages.
2. **Unique `description`** — 140–160 chars, contains one primary keyword, states a concrete benefit.
3. **`generateMetadata` or `metadata` export** (Server Components only — never `'use client'`).
   ```tsx
   import type { Metadata } from "next";

   export const metadata: Metadata = {
     title: "…",
     description: "…",
     alternates: { canonical: "/about" },
     openGraph: { title, description, url, locale: "en_KE", type: "website" },
     twitter: { card: "summary_large_image", title, description },
   };
   ```
4. **Canonical URL** on every page — `metadataBase` set once in `app/layout.tsx`.
5. **`viewport` is a separate export** — `themeColor`, `colorScheme`, `viewport` inside `metadata` are deprecated.
6. **One `<h1>` per page**, semantic order `h1 → h2 → h3`. No heading level skips.
7. **Semantic HTML** — `<header> <nav> <main> <section> <article> <footer>`, `<button>` for actions (not `<div onClick>`), `<a href>` for navigation.
8. **Alt text on every image** — describe purpose, not filename. Decorative → `alt=""`.
9. **JSON-LD** via `<script type="application/ld+json">` from `lib/seo.ts`. Required:
   - `Organization` (or `NGO`) — site-wide, in root layout
   - `WebSite` + `BreadcrumbList` per page
   - `Article` / `BlogPosting` for news and stories
   - `DonateAction` / `GiveAction` on donation pages
   - `FAQPage` where FAQs are visible on-page
10. **No client-side-only content** for anything indexable. Text must be in the server-rendered HTML.

## Site-wide files (verify they exist)

- `app/sitemap.ts` → `export default function sitemap(): MetadataRoute.Sitemap`, include every indexable route with `lastModified`, `changeFrequency`, `priority`. Split with `generateSitemaps` if > 50k URLs (note: `id` is a Promise in v16).
- `app/robots.ts` → `export default function robots(): MetadataRoute.Robots`, point at the sitemap.
- `app/manifest.ts` → `MetadataRoute.Manifest`.
- `app/opengraph-image.tsx` → `import { ImageResponse } from "next/og"`, 1200×630, flexbox only (no `display: grid`), under 8 MB.

## Performance signals that affect rank

- `next/image` with correct `width`/`height` — always. Use `preload` on the LCP hero only.
- `sizes` attribute on every non-hero image.
- Fonts via `next/font` (already using Geist) — never raw `<link>` to Google Fonts.
- Route-level `loading.tsx` for streamed Suspense boundaries; avoid CLS.
- Target INP < 200 ms — GSAP animations must respect `prefers-reduced-motion`.

## Verify before done

```sh
npm run build
npx next typegen
```

Then check the rendered `<head>`, confirm `/sitemap.xml` and `/robots.txt` resolve, and run `seo-audit` against the built output.
