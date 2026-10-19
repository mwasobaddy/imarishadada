import Image from "next/image";
import Link from "next/link";

import type { StoryCard } from "@/lib/data/impact";

/**
 * Story grid with consent-tier branching.
 *
 * Built by hand — the spec is explicit that no registry component can do
 * consent branching. The tier has already been resolved server-side in the data
 * layer, so this component receives stories that simply have no image and no
 * attribution when the tier forbids them. There is no flag here that could be
 * used to bypass that.
 *
 * | Tier            | Rendered                                    |
 * |-----------------|---------------------------------------------|
 * | `named_full`    | Name and photograph                         |
 * | `named_no_face` | Name and outcome. **No image.**             |
 * | `anonymised`    | Quote only. **No name, no identifying data.** |
 */
export function StoryGrid({ stories }: { stories: StoryCard[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {stories.map((story) => {
        const mayShowImage = story.consentTier === "named_full" && story.imagePath;

        return (
          <li
            key={story.slug}
            className="flex flex-col rounded-card border border-border bg-card p-6 sm:p-8"
          >
            {story.programmeTitle ? (
              <p className="text-xs font-medium tracking-wide text-brand-600 uppercase">
                {story.programmeTitle}
              </p>
            ) : null}

            <blockquote className="measure mt-3 text-xl leading-relaxed text-ink">
              {story.quote}
            </blockquote>

            {/*
              `anonymised` gets no name, no role, and no initial. In a community
              this small, "A., 19, Kibera" identifies a person.
            */}
            <div className="mt-6 border-t border-border pt-5">
              {story.consentTier === "anonymised" ? (
                <p className="text-sm text-ink-muted">
                  — Name withheld at her request
                </p>
              ) : story.attribution ? (
                <p className="text-sm text-ink-muted">
                  — {story.attribution}
                  {story.consentTier === "named_no_face" ? (
                    <span className="mt-1 block text-xs">
                      Named with written consent. Photograph not published.
                    </span>
                  ) : null}
                </p>
              ) : (
                <p className="text-sm text-ink-muted">— Name withheld</p>
              )}
            </div>

            {mayShowImage ? (
              <Image
                src={story.imagePath!}
                alt=""
                width={640}
                height={420}
                sizes="(max-width: 640px) 92vw, 560px"
                className="mt-6 aspect-[3/2] w-full rounded-lg object-cover"
              />
            ) : story.consentTier === "named_no_face" ? (
              <p className="mt-6 rounded-lg bg-surface-lilac px-4 py-3 text-xs text-ink-muted">
                Photograph withheld — consent to publish her image was not given.
              </p>
            ) : null}

            {story.readingMinutes ? (
              <p className="mt-4 text-xs text-ink-muted tabular">
                {story.readingMinutes} min read
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Consent transparency note.
 *
 * The credibility argument the spec makes: an archive that says "six stories,
 * two anonymised" is more trustworthy than an archive of 40 portraits that
 * never explains why nobody is unnamed.
 */
export function ConsentNote({
  counts,
}: {
  counts: { named_full: number; named_no_face: number; anonymised: number };
}) {
  const total = counts.named_full + counts.named_no_face + counts.anonymised;

  return (
    <section aria-labelledby="consent-note-heading" className="bg-surface-lilac py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2
              id="consent-note-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              How we share these stories
            </h2>
            <p className="measure mt-4 text-lg text-ink-muted">
              No story is published without a recorded consent tier, and the tier
              decides what appears — not our judgement on the day.
            </p>
            <Link
              href="/legal/safeguarding#photography"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
            >
              Read the photography and consent policy
            </Link>
          </div>

          {total > 0 ? (
            <dl className="space-y-3">
              {[
                { term: "Named and photographed", count: counts.named_full },
                { term: "Named, not photographed", count: counts.named_no_face },
                { term: "Anonymised", count: counts.anonymised },
              ].map((row) => (
                <div
                  key={row.term}
                  className="flex items-baseline justify-between gap-4 border-b border-border pb-3"
                >
                  <dt className="text-ink">{row.term}</dt>
                  <dd className="tabular text-lg font-semibold text-brand-600">
                    {row.count}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="rounded-card border-2 border-dashed border-brand-600/30 bg-card p-6">
              <p className="text-sm font-semibold text-brand-600">
                No stories published yet
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                We publish a story only when consent is recorded. This breakdown
                appears here as soon as there is something to count.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
