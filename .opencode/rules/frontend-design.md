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
- Magic UI has its own MCP (`magicui`) for discovery. Aceternity needs no MCP — the `shadcn` MCP reaches it.
- Aceternity **blocks** (181 of them) are Pro and return `401`. Do not plan around them without a paid licence.

```sh
npx shadcn@latest add @aceternity/spotlight @magicui/marquee
```

Installed components are vendored into `components/ui/`. They are yours to edit. Fix `'use client'` boundaries, hydration errors, and accessibility on arrival — the registry does not check those.

## Brand palette — derived by measurement, not assumed (2026-10-15)

**#E30B5D is the brand colour and holds the dominant surface role** — announcement bar,
stats band, closing CTA band. **#004B49 is the accent.** The deep green #14342a that
previously held those surfaces is retired.

Every ratio below is **computed** with WCAG relative luminance. Recompute before changing
any token; do not eyeball.

### Against the page background `#F4F8F1` (`--color-surface-warm`)

| Colour | Ratio | Verdict |
|---|---|---|
| `--color-ink` `#1C1917` | 16.28:1 | AAA, all sizes |
| `--color-accent` `#004B49` | 9.29:1 | AAA, all sizes |
| `--color-brand-600` `#C00950` | 5.75:1 | AA, all sizes |
| `--color-ink-muted` `#57534E` | 7.10:1 | AAA |
| **`--color-brand` `#E30B5D`** | **4.37:1** | **LARGE TEXT / UI ONLY** |

### On the brand surface `#E30B5D`

| Foreground | Ratio | Verdict |
|---|---|---|
| pure white `#FFFFFF` | 4.70:1 | AA, all sizes |
| `#F4F8F1` (page bg) | 4.37:1 | large only — **do not use** |
| `--color-accent` `#004B49` | 2.13:1 | **FAIL — never** |

### The two rules that matter

**1. `#E30B5D` fails as small text on a light background. Use `--color-brand-600`
`#C00950` (5.75:1) instead** — same hue, dark enough for labels, links and eyebrows at
any size. This is why there are two brand tokens.

**2. On the brand surface, text must be 100% white — opacity variants fail.**

| White at | Ratio | Verdict |
|---|---|---|
| 100% | 4.70:1 | AA |
| 85% | 3.64:1 | large/UI only |
| 70% | 2.80:1 | **FAIL** |
| 60% | 2.33:1 | **FAIL** |

Never write `text-ink-inverse/70` on a brand band. If text needs to feel softer, use a
**larger size** rather than lower opacity. `--color-ink-inverse` is deliberately pure
white, not the page background, for this reason.

### Other measured facts

- White on `--color-brand-600` = 6.18:1 — so `#C00950` also works as a band surface if
  `4.70:1` on white ever feels tight. One token change.
- `--color-accent` is **2.13:1** on the brand surface — it must never appear there.
- `--color-pattern` `#7C8A86` = 3.35:1 on the page background: the neutral used for
  background hexagon fields so they never compete with copy.
- `#E30B5D` as a *button* background with a white label is **4.70:1 — legal**. The same
  hex as *text* on a light background is not. Same colour, opposite verdict.

### 60/30/10

- **60%** — ground: `--color-surface-warm` `#F4F8F1`, white cards
- **30%** — brand `#E30B5D`: announcement bar, stats band, closing CTA band
- **10%** — accent `#004B49` for Donate buttons and secondary actions; `--color-brand-600`
  for headings and links; `--color-pattern` for background fields

If a page reads as all-magenta, the 30% share has crept. Check the band sizes.

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
