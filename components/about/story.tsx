import Image from "next/image";

import { Container } from "@/components/site/container";
import { AboutPhotoCarousel } from "@/components/about/photo-carousel";
import { Programmes } from "@/components/sections/programmes";
import { isVisible } from "@/lib/data/sections";
import type { Programme, SiteSection } from "@/lib/data/types";

export function AboutStory({
  section,
  carousel,
}: {
  section: SiteSection;
  carousel?: SiteSection | null;
}) {
  return (
    <section aria-labelledby="about-story-heading" className="py-section bg-surface">
      <Container>
        {/*
          Image leads on desktop, text leads on mobile. The order is chosen so
          the narrative opens with the people, not a heading, and the columns
          stay visually balanced once the image has real height.
        */}
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <AboutPhotoCarousel
            images={isVisible(carousel) ? (carousel!.images ?? []) : []}
            caption={carousel?.body}
            className="lg:order-1"
          />

          <div className="lg:order-2">
            {section.eyebrow ? (
              <p className="mb-3 text-sm font-medium tracking-wide text-brand-600 uppercase">
                {section.eyebrow}
              </p>
            ) : null}
            <h2
              id="about-story-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>

            {section.body ? (
              <div className="mt-5 space-y-5 text-lg text-ink-muted">
                {section.body.split("\n\n").map((para) => (
                  <p key={para.slice(0, 32)}>{para}</p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Vision and mission sit together because readers compare them: the mission is
 * the vehicle, the vision the destination.
 *
 * Either may be switched off in the admin. One alone still renders — a
 * two-column grid with one column is worse than a single full-width card.
 */
export function AboutVisionMission({
  vision,
  mission,
}: {
  vision?: SiteSection | null;
  mission?: SiteSection | null;
}) {
  const cards = [
    { section: vision, id: "about-vision-heading" },
    { section: mission, id: "about-mission-heading" },
  ].filter(
    (card): card is { section: SiteSection; id: string } => isVisible(card.section),
  );

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="about-vision-heading" className="bg-surface pb-section">
      <Container>
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map(({ section, id }) => (
            <article
              key={id}
              className="rounded-2xl bg-surface-lilac p-8 sm:p-10"
              aria-labelledby={id}
            >
              {section.eyebrow ? (
                <p className="mb-3 text-sm font-medium tracking-wide text-brand-600 uppercase">
                  {section.eyebrow}
                </p>
              ) : null}
              <p id={id} className="text-2xl leading-snug font-medium text-brand-600">
                {section.heading}
              </p>
              {section.body ? (
                <p className="measure mt-4 text-base text-ink-muted">{section.body}</p>
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function AboutValues({
  section,
  values,
  carousel,
}: {
  section: SiteSection;
  values: import("@/lib/data/types").CoreValue[];
  carousel?: SiteSection | null;
}) {
  if (values.length === 0) return null;

  return (
    <section aria-labelledby="about-values-heading" className="py-section bg-surface">
      <Container>
        {/*
          Heading and image share a row so the section does not open as a wall
          of six identical definition pairs. The image is pulled onto the
          lilac band to break the long run of identical page background.
        */}
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            {section.eyebrow ? (
              <p className="mb-3 text-sm font-medium tracking-wide text-brand-600 uppercase">
                {section.eyebrow}
              </p>
            ) : null}
            <h2
              id="about-values-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>

            <dl className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {values.map((value) => (
                <div key={value.slug}>
                  <dt className="text-lg font-semibold text-brand-600">{value.name}</dt>
                  <dd className="mt-1.5 text-base text-ink-muted">{value.description}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/*
            The same set as the story carousel. The caption is deliberately
            omitted here — it is already stated at the top of the page, and
            repeating it verbatim reads as a copy-paste rather than a design.
          */}
          <AboutPhotoCarousel
            images={isVisible(carousel) ? (carousel!.images ?? []) : []}
            className="lg:order-last"
          />
        </div>
      </Container>
    </section>
  );
}

export function AboutWork({
  section,
  programmes,
}: {
  section: SiteSection;
  programmes: Programme[];
}) {
  return <Programmes programmes={programmes} section={section} />;
}

/**
 * Deliberately static. These are the operating commitments the organisation
 * makes publicly; they are claims about behaviour, not data, so there is
 * nothing to configure in a table.
 */
const APPROACH = [
  {
    title: "Community-owned",
    body: "Nothing is designed for Kibera without Kibera in the room. Site selection, mentor matching and programme content are set with community leaders.",
  },
  {
    title: "Girl-led",
    body: "The young women we work with hold real roles in the organisation rather than being consulted about a plan already finished.",
  },
  {
    title: "Evidence-informed",
    body: "We track re-entry and business survival because we are accountable to the girls, not only to our donors.",
  },
];

export function AboutApproach({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="about-approach-heading" className="py-section bg-brand">
      <Container>
        <div className="max-w-2xl">
          {section.eyebrow ? (
            <p className="mb-3 text-sm font-medium tracking-wide text-brand-100 uppercase">
              {section.eyebrow}
            </p>
          ) : null}
          <h2
            id="about-approach-heading"
            className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl"
          >
            {section.heading}
          </h2>
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          {APPROACH.map((item) => (
            <li key={item.title}>
              <h3 className="text-lg font-semibold text-ink-inverse">{item.title}</h3>
              <p className="mt-2 text-base text-brand-100">{item.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * Field media slot, its own section.
 *
 * This was previously nested inside the purple "How we work" band, which put a
 * pale placeholder image and its caption directly on the brand fill — the
 * caption rendered purple-on-purple. Its own section on the page background
 * keeps the band a single clean colour.
 *
 * This slot is reserved for a VIDEO, not a still. When the footage is ready it
 * becomes Magic UI `HeroVideoDialog` (`npx shadcn@latest add @magicui/hero-video-dialog`),
 * which opens a lightbox on click. Until then it holds a static poster so the
 * section is not an empty gap — a `<video>` with no real source would reserve
 * a black box and add weight for nothing.
 */
export function AboutField() {
  return (
    <section aria-label="Our work in the field" className="bg-surface py-section">
      <Container>
        <figure className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-card bg-surface-lilac">
            <Image
              src="/images/about/about-outdoor-candid.avif"
              alt="Participants in branded t-shirts talking together outdoors after a session in Kibera"
              width={1400}
              height={933}
              sizes="(max-width: 768px) 92vw, 1152px"
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="text-xs leading-relaxed text-ink-muted">
            A session in Kibera. A consented field video will replace this
            photograph and open in a lightbox on click.
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
