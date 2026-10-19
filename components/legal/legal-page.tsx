import type { ReactNode } from "react";

import { Container } from "@/components/site/container";

/**
 * Shared layout for the legal pages.
 *
 * These pages are long, plain, and reference-heavy, so they get a deliberately
 * restrained treatment: a single readable measure, a table of contents, and no
 * decorative motion. Motion on a policy page is both a distraction and a
 * liability — a reader scanning for "who do I report a concern to" should not
 * have to wait for an animation.
 */

export type LegalSection = {
  id: string;
  heading: string;
  body: ReactNode;
};

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  /** ISO date of last review. Rendered honestly; never omitted. */
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <main id="main">
        <section className="bg-surface-lilac py-section">
          <Container>
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              Legal
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-ink-muted">
              Last reviewed:{" "}
              <time dateTime={updated}>
                {new Date(updated).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </p>
          </Container>
        </section>

        <Container className="py-section">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            {/* Table of contents. Sticky on desktop, a plain list on mobile. */}
            <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold tracking-wide text-ink uppercase">
                On this page
              </p>
              <ol className="mt-4 space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-sm text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="min-w-0 max-w-2xl">
              <div className="text-lg leading-relaxed text-ink">{intro}</div>

              {sections.map((section) => (
                <section key={section.id} id={section.id} className="mt-12 scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight text-brand-600">
                    {section.heading}
                  </h2>
                  <div className="prose-imarisha mt-4 space-y-4 leading-relaxed text-ink-muted">
                    {section.body}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}

/**
 * A field that must be supplied by a human before publication.
 *
 * Deliberately loud. These are the parts of a legal page where a confident-looking
 * placeholder is worse than an obvious gap: a named safeguarding officer and a
 * statutory reporting duty are things a donor, a regulator, or a worried parent
 * will actually rely on.
 */
export function NeedsSignOff({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-brand-600/40 bg-brand-50 p-5">
      <p className="text-sm font-semibold text-brand-600">
        Awaiting sign-off, not yet published
      </p>
      <div className="mt-2 text-sm text-ink-muted">{children}</div>
    </div>
  );
}
