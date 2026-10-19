import Image from "next/image";

import { Container } from "@/components/site/container";
import type { FeaturedStory } from "@/lib/data/types";

/**
 * Programme stories, with consent enforced in the component.
 *
 * This is the highest safeguarding sensitivity in the organisation: minors and
 * young mothers. The tier is decided server-side in the data layer and is NOT
 * admin-editable, and this component refuses to render a name or a face the
 * tier does not permit.
 *
 * | Tier            | Render                                    |
 * |-----------------|-------------------------------------------|
 * | `named_full`    | Name and photograph                       |
 * | `named_no_face` | Name and outcome. **No image.**           |
 * | `anonymised`    | Quote only. **No name, no image.**        |
 *
 * ## Placeholders, not silence
 *
 * With no consented stories the section would previously render nothing, which
 * left a hole in the middle of the page. It now renders an explicit reserved
 * slot instead.
 *
 * The distinction matters: a placeholder is a labelled empty frame. It never
 * contains a quote, a name, or a face, because inventing one would be the
 * worst possible failure in a section about consent — it would look like a
 * real testimonial from a girl who does not exist. It is also `aria-hidden`
 * apart from its heading, so a screen reader is not read a paragraph of
 * editorial instructions in the middle of the donor's journey.
 */
export function ProgrammeStories({ stories }: { stories: FeaturedStory[] }) {
  return (
    <StoryBody stories={stories} />
  );
}

function StoryBody({ stories }: { stories: FeaturedStory[] }) {
  if (stories.length === 0) {
    return (
      <section aria-labelledby="stories-heading" className="py-section bg-surface">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              In their words
            </p>
            <h2
              id="stories-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              What changed
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2" aria-hidden="true">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex min-h-64 flex-col justify-between rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-6 sm:p-8"
              >
                <p className="text-2xl leading-relaxed text-brand-600/30" aria-hidden="true">
                  &ldquo;&rdquo;
                </p>
                <div>
                  <div className="mb-3 h-px w-16 bg-brand-600/20" />
                  <p className="text-sm font-medium text-brand-600/50">
                    Reserved for a consented story
                  </p>
                  <p className="mt-1 text-xs text-ink-muted/70">
                    {i === 0
                      ? "Placeholder — a quote from a School Re-entry participant, published only with recorded written consent."
                      : "Placeholder — a second consented story. Images appear only for the named_full consent tier."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section aria-labelledby="stories-heading" className="py-section bg-surface">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
            In their words
          </p>
          <h2
            id="stories-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            What changed
          </h2>
        </div>

        <ul className="mt-12 grid gap-5 lg:grid-cols-2">
          {stories.map((story) => {
            const mayShowName = story.consentTier !== "anonymised";
            const mayShowImage = story.consentTier === "named_full" && story.imagePath;

            return (
              <li
                key={story.slug}
                className="flex flex-col rounded-card border border-border bg-card p-6 sm:p-8"
              >
                <blockquote className="measure text-xl leading-relaxed text-ink">
                  {story.quote}
                </blockquote>

                {/*
                  Attribution is omitted entirely for `anonymised`. Rendering an
                  initial or a role would still identify her in a community this
                  small, which is the whole point of the tier.
                */}
                {mayShowName && story.attribution ? (
                  <figcaption className="mt-6 border-t border-border pt-5 text-sm text-ink-muted">
                    — {story.attribution}
                    {story.consentTier === "named_no_face" ? (
                      <span className="mt-1 block text-xs">
                        Name used with written consent.
                      </span>
                    ) : null}
                  </figcaption>
                ) : (
                  <p className="mt-6 border-t border-border pt-5 text-sm text-ink-muted">
                    — Name withheld at her request
                  </p>
                )}

                {/*
                  `named_no_face` gets a typographic placeholder, never a photo
                  and never a silhouette that could be mistaken for her.
                */}
                {mayShowImage ? (
                  <Image
                    src={story.imagePath!}
                    alt=""
                    width={640}
                    height={420}
                    sizes="(max-width: 1024px) 92vw, 560px"
                    className="mt-6 aspect-[3/2] w-full rounded-lg object-cover"
                  />
                ) : story.consentTier === "named_no_face" ? (
                  <div
                    aria-hidden="true"
                    className="mt-6 grid aspect-[3/2] w-full place-items-center rounded-lg bg-brand-50 text-sm text-brand-600"
                  >
                    Photograph withheld — consent to publish her image was not given
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
