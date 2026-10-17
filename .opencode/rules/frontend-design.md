# Frontend Design & Animation

Applies to any UI, page section, or motion work.

## Skills to load

| Task | Skills |
|---|---|
| Any new UI | `web-design-guidelines`, `vercel-react-best-practices`, `nextjs-app-router-patterns` |
| Animation in React/Next | `gsap-react`, `gsap-core` |
| Scroll / parallax / pinning | `gsap-scrolltrigger`, `gsap-performance` |
| Sequencing / choreography | `gsap-timeline`, `gsap-utils` |
| Any GSAP plugin (Flip, Draggable, SplitText, ScrollSmoother) | `gsap-plugins` |
| Other frameworks | `gsap-frameworks` |
| Design system / tokens | `ui-ux-pro-max` |
| Components | shadcn via MCP (`components.json` is initialised, style `base-nova`) |

## Animation policy — hybrid GSAP + Motion (decided 2026-10-15)

Two runtimes, deliberately. **Do not use them interchangeably.**

| Runtime | Owns | Do NOT use for |
|---|---|---|
| **GSAP** (`gsap` + `ScrollTrigger`, via `useGSAP`) | Scroll-linked motion: parallax, pinning, scrubbed reveals, horizontal scroll, page transitions | Small component-internal state changes |
| **Motion** (`motion/react`) | Component-internal animation: hover, tap, layout shifts, enter/exit, presence | Anything driven by scroll position |

Rationale: GSAP is better at scroll-linked choreography and scrub; Motion is better at declarative React state animation and is what every registry component ships with. Rewriting registry components into GSAP costs more than it saves.

Both are allowed. The rule is: **if it moves in response to scroll, it is GSAP. If it moves in response to a state change, it is Motion.**

### Component sources

- `@aceternity/*` — shadcn registry, 113 components, **free**, no auth needed
- `@magicui/*` — shadcn registry, free
- `@react-bits/*` — shadcn registry, free. 218 components, 4 variants each.
  Magic UI has its own MCP (`magicui`) for discovery. Aceternity needs no MCP — the `shadcn` MCP reaches it.
- Aceternity **blocks** (181 of them) are Pro and return `401`. Do not plan around them without a paid licence.

```sh
npx shadcn@latest add @aceternity/spotlight @magicui/marquee @react-bits/SplitText-TS-TW
```

All three are wired in `components.json` under `registries`. Install React Bits with
the **`-<JS|TS>-<TW|CSS>` suffix** — the bare component name will not resolve, because
each component ships as four separate registry items:

| Suffix | Result |
|---|---|
| `-TS-TW` | TypeScript + Tailwind classes — **use this one** |
| `-TS-CSS` | TypeScript + plain CSS modules |
| `-JS-TW` / `-JS-CSS` | JavaScript variants. Do not add; the project is `strict` TypeScript |

```sh
# correct
npx shadcn@latest add @react-bits/CountUp-TS-TW
# wrong — no such item
npx shadcn@latest add @react-bits/CountUp
```

### React Bits caveats

Dependency picture across the 218 `-TS-TW` items:

| Dependency | Items | Project has | Effect of installing |
|---|---|---|---|
| `motion@^12.23.12` | **28** | `^14.3.0` | **Conflict — see below** |
| `gsap@^3.13.0` | 18 | `^3.15.0` | none, already satisfied |
| `three` / `ogl` / `@react-three/*` | 16 | not installed | very large, and WebGL on mobile |
| `react-dom@^19` | 5 | React 19 | none |
| `matter-js`, `vgpu` | 2 each | not installed | heavy, physics / GPU |

- **The `motion` pin is the sharp edge.** 28 components request `motion@^12.23.12`
  while the project is on `^14.3.0`. `shadcn add` will happily install v12 beside
  v14, giving two copies of the same library and doubling it in the bundle. Install
  those with `--no-deps` and rely on the existing `^14`:
  ```sh
  npx shadcn@latest add @react-bits/CountUp-TS-TW --no-deps
  ```
  If a component genuinely needs v12 APIs it will fail typecheck — pick a different
  component rather than downgrading a shared dependency.

- **16 items mount WebGL** (pull `three` / `ogl` / `@react-three/fiber`):
  `BlobCursor`, `ColorBends`, `CrystalizedBall`, `DitherVeil`, `ElectricLogo`,
  `EvilEye`, `FlexCarousel`, `Hyperspeed`, `Lanyard`, `MicroSlats`, `ModelViewer`,
  `MorphSlider`, `PaperCrumple`, `PatternWaves`, `RippleDistortion`, `WarpText`.
  These are **forbidden on mobile** — see the hard performance ceiling below. Guard
  with `gsap.matchMedia()` or render desktop-only, and expect the first-load JS
  budget to be blown by an order of magnitude.

- Prefer items that are pure CSS/SVG/transform over canvas items even on desktop —
  the About page masthead uses Magic UI `WarpBackground` for exactly this reason.

Installed components are vendored into `components/ui/`. They are yours to edit. Fix `'use client'` boundaries, hydration errors, and accessibility on arrival — the registry does not check those.

## Brand palette — analogous purple base with gold accent

**Primary brand: `#5B2A86` (purple).** Header, buttons, primary fills. **Pink: `#C71F6E`.**
Links and icons. **Gold: `#F5B82E`.** Donate button only — keep it rare so it stands out.
Dark mode swaps to `#7B45B5`, `#F06BA8`, and the same gold with `#2A1445` text.

Every ratio below is **computed** with WCAG relative luminance. Recompute before changing
any token; do not eyeball.

### Light mode — against page background `#FFFAF7`

| Colour | Hex | Ratio | Verdict |
|---|---|---|---|
| Main text | `#2A1445` | ~20:1 | AAA, all sizes |
| Muted text | `#4A4458` | ~8:1 | AAA, all sizes |
| Primary brand fill | `#5B2A86` | ~5.5:1 | AA, all sizes (as bg with white text) |
| Purple headings/accents | `#5B2A86` | ~5.5:1 | AA, all sizes |
| Pink links/icons | `#C71F6E` | ~3.6:1 | large/UI only |
| Gold Donate bg | `#F5B82E` | gold with `#2A1445` text | very high contrast |

### Dark mode — against page background `#170B26`

| Colour | Hex | Ratio | Verdict |
|---|---|---|---|
| Main text | `#F5EEFA` | ~17:1 | AAA, all sizes |
| Muted text | `#BFB3CC` | ~5:1 | AA, all sizes |
| Primary brand fill | `#7B45B5` | ~6:1 | AA, all sizes (as bg with white text) |
| Purple headings/accents | `#C9A7F0` | large text only | UI only |
| Pink links/icons | `#F06BA8` | ~6.5:1 | AA, all sizes |
| Gold Donate bg | `#F5B82E` | gold with `#2A1445` text | very high contrast |

### Surface pairings

| Role | Light | Dark |
|---|---|---|
| Page background | `#FFFAF7` | `#170B26` |
| Surface (cards) | `#FFFFFF` | `#241238` |
| Elevated surface | `#FFFFFF` + shadow | `#2F1A48` |
| Border | `#E4D9EE` | `#4A3366` |
| Soft pink section bg | `#FBE4EF` | `#3B1A3A` |
| Lilac section bg | `#EFE6F7` | `#2A1A45` |

### The rules that matter

**1. Don't put text in `#F06BA8` on dark backgrounds — it's too light.** Use `#BFB3CC`
for muted dark text instead.

**2. Keep the gold rare.** If the Donate button is the only gold element, it becomes the
most visible thing on every page — that's the intent.

**3. Contrast pairs must run through WebAIM or Figma before sign-off.** The values above
are approximate measured ratios, not guarantees.

**4. No color-alone meaning.** Pair color with icons, underlines, or text labels.

### 60/30/10

- **60%** — ground: page background `#FFFAF7` (light) / `#170B26` (dark), white cards
- **30%** — brand `#5B2A86` (light) / `#7B45B5` (dark): header, buttons, primary fills
- **10%** — accent `#C71F6E` (light) / `#F06BA8` (dark) for links and icons; gold `#F5B82E`
  for Donate only

If a page reads as all-purple, the 30% share has crept. Check the band sizes.

## Break the AI monoculture

Do not emit the default Tailwind hero — centred `<h1>`, `bg-gradient-to-b from-slate-50`, three identical cards, `rounded-xl shadow-lg`. Every section must be justified by the content.

- Establish a real design token set in `app/globals.css` under `@theme` — colour, type scale, spacing, radii, easing. Use the tokens; never hardcode hex values in components.
- Vary rhythm: not every section is a centred stack. Use asymmetry, editorial two-column splits, offset grids, full-bleed imagery with overlay text.
- One deliberate type pairing. Scale contrast (e.g. 3.75rem display vs 1rem body), not uniform sizes.
- Kenyan context: use real photography of Kenyan communities via `next/image`, warm natural palette, texture not gradients-everywhere.

## GSAP rules (the cleanup problem)

**Always use `gsap.context()` scoped inside `useGSAP()` from `@gsap/react`.** This is the only accepted pattern:

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8 })
        .from("[data-hero-sub]", { y: 24, opacity: 0, duration: 0.6 }, "-=0.5");

      gsap.to("[data-hero-img]", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: container.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: container, dependencies: [], revertOnUpdate: true },
  );

  return <section ref={container}>…</section>;
}
```

Mandatory:
- `useGSAP` (not bare `useEffect`). It auto-reverts timelines and cleans up on unmount.
- Every animated target is **inside** the scoped container and addressed by `data-*` selector, never by a global class.
- Never create ScrollTriggers outside the scope; register plugins once at module level.
- No `gsap.to(window, { scrollTo: … })` without `ScrollToPlugin` registered.

Performance:
- Animate `transform` and `opacity` only. Never `top/left/width/height/margin` — layout thrashing.
- Set `will-change` before, clear it in `onComplete`.
- `scrub: true` for scroll-linked; plain tween for everything else.
- Batch selectors; use `gsap.utils.toArray()` for repeated elements.

### Hard performance ceiling (decided 2026-10-15)

Kenyan traffic is largely mobile on metered data. **No WebGL on mobile.**

- Forbid: `dither-shader`, `cloud-shader`, `contact-section-with-shader`, and any `three.js`/`react-three-fiber` canvas scene on mobile viewports.
- Allowed: CSS animations, SVG, GSAP transform work, and lightweight `motion/react` layout animation.
- A shader/WebGL background may render **on desktop only**, guarded by `gsap.matchMedia()` or a CSS media query, degrading to a static image or CSS gradient below `lg`. The mobile path must never mount the canvas.
- Budget per page: **≤ 200 KB of first-load JS**. Hero image ≤ 200 KB AVIF/WebP. No autoplay video.
- Target Lighthouse mobile ≥ 90. Check it before calling a page done.

Accessibility:
- Wrap all animation in `gsap.matchMedia()` and disable under `prefers-reduced-motion: reduce`.
- Animations must never be the only way information is conveyed.
- No entrance animation on anything above the LCP image — it delays LCP. Hero text fades max 400 ms, and never `opacity: 0` on the LCP element at all.

## Quality bar (web-design-guidelines)

- Focus-visible rings on every interactive element. Never `outline: none` without a replacement.
- Hit targets ≥ 44×44 px.
- Colour contrast ≥ 4.5:1 for text.
- `<button>` for actions, `<a>` for navigation. Always `type="button"` unless submitting.
- Labels tied to inputs; errors announced via `aria-live`, not colour alone.
- Text must survive 200% zoom and 320 px width.
- No layout shift: reserve space for images, embeds, and async content.
