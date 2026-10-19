import Image from "next/image";
import Link from "next/link";

import type { Programme } from "@/lib/data/types";

/**
 * Image-based programme card.
 *
 * Modelled on Aceternity's `content-card` block (blog-style card with content
 * overlaid on a background image, overlay darkening on hover). That block is
 * Pro-only — `registry/blocks.json` returns 401 — so this is a local
 * implementation of the same pattern.
 *
 * Icons were removed deliberately. A row of three identical line icons above
 * three identical cards is the strongest visual signal that a layout was
 * generated rather than designed.
 *
 * Imagery: no programme has a consented photograph yet, so `imagePath` is null
 * and the card renders a brand-tinted field. A stock photo of unrelated
 * children would misrepresent the work — see `.opencode/rules/frontend-design.md`.
 */
export function ProgrammeCard({ programme }: { programme: Programme }) {
  return (
    <Link
      href={`/programmes/${programme.slug}`}
      className="group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-card border border-brand/20 bg-brand p-6 transition-colors hover:border-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
    >
      {programme.imagePath ? (
        <Image
          src={programme.imagePath}
          alt={programme.imageAlt ?? ""}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(150deg,var(--surface-lilac)_0%,var(--surface-pink)_55%,var(--brand-tint)_100%)]"
        />
      )}

      {/* Scrim. Only as strong as it needs to be — the overlay carries the
          contrast, so full darkening would flatten the imagery. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(42,20,69,0.92)_0%,rgba(42,20,69,0.62)_42%,rgba(42,20,69,0.12)_72%,transparent_100%)]"
      />

      <div className="relative">
        {programme.statLabel ? (
          <p className="tabular mb-2 text-sm font-semibold tracking-wide text-brand-100 uppercase">
            {programme.statLabel}
          </p>
        ) : null}

        <h3 className="text-xl font-semibold tracking-tight text-ink-inverse">
          {programme.title}
        </h3>

        <p className="measure mt-2 text-sm leading-relaxed text-ink-inverse/80">
          {programme.summary}
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-inverse">
          Learn more
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 transition-transform duration-200 motion-reduce:transition-none group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}