import type { ReactNode } from "react";

import { WarpBackground } from "@/components/ui/warp-background";
import { Container } from "@/components/site/container";

/**
 * Shared masthead for interior pages.
 *
 * Background is the Magic UI `WarpBackground` — a CSS 3D grid warp. It is
 * deliberately NOT a canvas/WebGL scene: the project rules forbid WebGL on
 * mobile, and this effect is pure CSS transforms plus `motion/react`, so it
 * stays within budget on metered connections.
 *
 * The effect is decorative and sits behind `aria-hidden` content separation
 * via `pointer-events-none`; all copy remains server-rendered text.
 */
export function PageHero({
  eyebrow,
  heading,
  body,
  children,
}: {
  eyebrow?: string | null;
  heading: string;
  body?: string | null;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-surface-lilac">
      <WarpBackground
        aria-hidden="true"
        perspective={900}
        beamsPerSide={3}
        beamSize={6}
        beamDelayMax={4}
        beamDelayMin={0}
        beamDuration={4}
        gridColor="var(--color-brand-600)"
        className="pointer-events-none absolute inset-0 rounded-none border-0 p-0 opacity-25"
      />

      <Container className="relative flex min-h-[380px] flex-col justify-center py-16 sm:min-h-[440px] sm:py-24">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-sm font-medium tracking-wide text-brand-600 uppercase">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
            {heading}
          </h1>

          {body ? <p className="measure mt-5 text-lg text-ink-muted">{body}</p> : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
