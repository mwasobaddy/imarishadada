import { HexagonField } from "@/components/sections/hexagon-field";
import {
  BLOB_PATH,
  BLOB_VIEWBOX,
  type HeroPortrait,
} from "@/lib/data/hero-portrait";

/**
 * Asymmetric editorial split — text left on a solid warm field, blob-masked portrait right.
 *
 * Deliberately NOT the centred <h1> over a gradient. See
 * .opencode/rules/frontend-design.md, "Break the AI monoculture".
 *
 * No GSAP here on purpose. Lighthouse identified this component's subtitle as
 * the LCP element and the entrance tween was adding ~870 ms of render delay to
 * it. frontend-design.md says never animate the LCP element; the honest fix is
 * to not animate it at all. Decorative elements use a CSS animation, which
 * starts at first paint instead of waiting for hydration.
 *
 * That also makes this a Server Component — no hero JS on the critical path.
 */
function Eyebrow() {
  return (
    <p className="hero-enter mb-5 flex items-center gap-2 text-sm font-medium tracking-wide text-accent uppercase">
      <span aria-hidden="true" className="h-px w-8 bg-accent" />
      Kibera, Nairobi
    </p>
  );
}

export function Hero({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  portrait,
  impactLine,
}: {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  portrait: HeroPortrait;
  impactLine: string;
}) {
  return (
    <section
      data-hex-root
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-surface-warm pt-16 pb-16 sm:pt-20 lg:pt-24 lg:pb-24"
    >
      {/* Text scrim. Protects headline contrast over the hexagon field: an opaque
          warm wash that fades out to the right.

          Order matters — this sits BEHIND the hexagon field, not in front of
          it. Painted on top it would hide the field precisely where donors
          hover (the CTAs on the left), silently killing the interaction. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,var(--color-surface-warm)_0%,var(--color-surface-warm)_42%,color-mix(in_oklab,var(--color-surface-warm)_55%,transparent)_72%,transparent_100%)] lg:bg-[linear-gradient(100deg,var(--color-surface-warm)_0%,var(--color-surface-warm)_46%,color-mix(in_oklab,var(--color-surface-warm)_50%,transparent)_80%,transparent_100%)]"
      />

      <HexagonField />

      {/* Warm wash — CSS only, no shader, no canvas. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 size-[34rem] rounded-full bg-surface-sand opacity-70 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <Eyebrow />

          {/* h1 and subtitle are NOT animated — they are LCP candidates. */}
          <h1 id="hero-title" className="text-display text-brand-900">
            {title}
          </h1>

          <p className="measure mt-6 text-lede text-ink-muted">{subtitle}</p>

          <div className="hero-enter hero-enter-delay mt-9 flex flex-wrap items-center gap-4" data-hex-focus>
            <a
              href={primaryCta.href}
              className="inline-flex min-h-12 items-center rounded-lg bg-accent px-7 text-base font-semibold text-white transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              {primaryCta.label}
            </a>
            <a
              href={secondaryCta.href}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-lg px-2 text-base font-medium text-brand-800 underline decoration-brand-800/30 underline-offset-4 transition-colors hover:decoration-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            >
              {secondaryCta.label}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>

          <p className="mt-10 border-t border-brand-900/10 pt-6 text-sm text-ink-muted">
            {impactLine}
          </p>
        </div>

        {/* Portrait. Tailwind mask, not a clip-path hack: the image dissolves
            into the page on its inner edge so it reads as one field rather than
            a pasted rectangle. */}
        {/* Blob-masked portrait.

            Reproduces the Tailwind `mask-type` docs example: an SVG <mask>
            carrying `mask-type-alpha`, with the blob <path> as the mask shape
            and the photo drawn as an <image> inside it.

            The SVG <image> element is used rather than next/image, so the file
            is served unoptimised — hence the pre-compressed WebP in
            lib/data/hero-portrait.ts. `preserveAspectRatio="none"` stretches
            the blob to fill the portrait box instead of letterboxing it;
            on an abstract organic shape the stretch is invisible. */}
        <figure className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-4 bg-accent/20 blur-3xl"
          />

          <svg
            viewBox={BLOB_VIEWBOX}
            preserveAspectRatio="none"
            role="img"
            aria-label={portrait.alt}
            className="relative aspect-4/5 w-full overflow-visible"
          >
            <defs>
              <mask id="hero-blob-mask" className="mask-type-alpha">
                <path d={BLOB_PATH} fill="white" />
              </mask>
            </defs>

            <image
              href={portrait.src}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              mask="url(#hero-blob-mask)"
            />
          </svg>

          <figcaption className="mt-5 max-w-xs text-xs leading-relaxed text-ink-muted">
            {portrait.credit}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}