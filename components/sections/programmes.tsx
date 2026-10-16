import Link from "next/link";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import type { Programme } from "@/lib/data/types";

const ICONS: Record<string, React.ReactNode> = {
  book: (
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  ),
  sprout: (
    <path d="M7 20h10M12 20V9M12 9C12 9 8 9 6 12c0 0 4 1 6-3zM12 9s4 0 6 3c0 0-4 1-6-3z" />
  ),
  heart: (
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  ),
};

export function Programmes({ programmes }: { programmes: Programme[] }) {
  if (programmes.length === 0) return null;

  return (
    <section aria-labelledby="programmes-heading" className="py-section bg-surface-warm">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2
              id="programmes-heading"
              className="max-w-2xl text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              Three programmes, one aim: a girl in Kibera decides her own future
            </h2>
            <p className="measure mt-4 text-lg text-ink-muted">
              School re-entry, economic empowerment, and safe spaces designed with
              girls and community leaders, not delivered to them.
            </p>
          </div>

          <Link
            href="/programmes"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
          >
            All programmes
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
          </Link>
        </div>

        <BentoGrid className="mt-12">
          {programmes.map((programme) => (
            <BentoGridItem
              key={programme.slug}
              title={programme.title}
              description={programme.summary}
              icon={
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[programme.icon] ?? ICONS.heart}
                </svg>
              }
              data-hex-focus
              className="group rounded-card border border-brand/20 bg-white transition-colors hover:border-secondary/50"
              href={`/programmes/${programme.slug}`}
              stat={programme.stat ?? undefined}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}