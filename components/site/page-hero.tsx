import type { ReactNode } from "react";

import { KenyaMap } from "@/components/site/kenya-map";
import { Container } from "@/components/site/container";

/**
 * Shared masthead for interior pages. Pairs the dotted map background with a
 * plain surface so the map never competes with body copy for contrast.
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
    <section className="relative isolate overflow-hidden bg-surface-sand">
      <KenyaMap />

      <Container className="relative flex min-h-[380px] flex-col justify-center py-16 sm:min-h-[440px] sm:py-24">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-sm font-medium tracking-wide text-secondary uppercase">
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
