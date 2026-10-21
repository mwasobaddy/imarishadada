import Link from "next/link";

import { fillTemplate } from "@/lib/stories/copy";
import type { SiteSection } from "@/lib/data/types";
import type { ConsentTier } from "@/lib/data/types";

/**
 * The consent banner on a story.
 *
 * ## What it is for
 *
 * The roadmap's framing is the whole argument: *"Without this banner, a
 * published name is a claim we cannot evidence. With it, it is a documented
 * decision."*
 *
 * Rendered for `named_full` and `named_no_face`, where a name appears. For
 * `anonymised` it is replaced by an explanation of what was withheld and why,
 * which is the same statement from the other side — the reader is told the
 * omission is deliberate rather than an oversight.
 *
 * ## Placed before the image, in the DOM
 *
 * So a screen reader reaches it first, and so it is above the fold. The image is
 * the most affecting thing on the page; the sentence that says she agreed to it
 * belongs before, not after.
 *
 * ## The name comes from the attribution
 *
 * `stories` has no separate display-name column, and adding one would create a
 * second place a name can live — which is exactly the drift the consent tier
 * exists to prevent. The banner takes the part of `attribution` before the first
 * comma: `"Amina, 19 · Kibera"` becomes `"Amina"`.
 */
export function ConsentBanner({
  tier,
  attribution,
  section,
}: {
  tier: ConsentTier;
  attribution: string | null;
  section: SiteSection;
}) {
  // Anonymised gets its own section, not this one.
  if (tier === "anonymised") return null;

  const firstName = (attribution ?? "").split(",")[0]?.trim() || "She";

  return (
    <aside
      aria-labelledby="story-consent-heading"
      className="mt-8 flex items-start gap-3 rounded-xl border border-border border-l-4 border-l-brand-600 bg-brand-50 p-5"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mt-0.5 size-5 shrink-0 text-brand-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>

      <div>
        <h2 id="story-consent-heading" className="sr-only">
          {section.heading}
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-ink-muted">
          {fillTemplate(section.body ?? "", { name: firstName })}
        </p>
      </div>
    </aside>
  );
}

/**
 * Why there is no name here.
 *
 * The `anonymised` counterpart to the banner above. A story with no name and no
 * photograph, with no explanation, reads as an incomplete page. With one, it
 * reads as a promise kept.
 */
export function AnonymisedNotice({ section }: { section: SiteSection }) {
  return (
    <aside
      aria-labelledby="story-anonymised-heading"
      className="mt-8 rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-5"
    >
      <h2
        id="story-anonymised-heading"
        className="text-sm font-semibold text-brand-600"
      >
        {section.heading}
      </h2>
      {section.body ? (
        <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
          {section.body}
        </p>
      ) : null}
      {section.ctaLabel && section.ctaHref ? (
        <Link
          href={section.ctaHref}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
        >
          {section.ctaLabel}
        </Link>
      ) : null}
    </aside>
  );
}
