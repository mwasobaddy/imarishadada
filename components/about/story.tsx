import { Container } from "@/components/site/container";
import { Programmes } from "@/components/sections/programmes";
import type { Programme, SiteSection } from "@/lib/data/types";

export function AboutStory({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="about-story-heading" className="py-section bg-surface-warm">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            {section.eyebrow ? (
              <p className="mb-3 text-sm font-medium tracking-wide text-secondary uppercase">
                {section.eyebrow}
              </p>
            ) : null}
            <h2
              id="about-story-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>
          </div>

          {section.body ? (
            <div className="space-y-5 text-lg text-ink-muted">
              {section.body.split("\n\n").map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/**
 * Vision and mission sit together because readers compare them: the mission is
 * the vehicle, the vision the destination.
 */
export function AboutVisionMission({
  vision,
  mission,
}: {
  vision: SiteSection;
  mission: SiteSection;
}) {
  return (
    <section aria-labelledby="about-vision-heading" className="bg-surface-warm pb-section">
      <Container>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { section: vision, id: "about-vision-heading" },
            { section: mission, id: "about-mission-heading" },
          ].map(({ section, id }) => (
            <article
              key={id}
              className="rounded-2xl bg-surface-sand p-8 sm:p-10"
              aria-labelledby={id}
            >
              {section.eyebrow ? (
                <p className="mb-3 text-sm font-medium tracking-wide text-secondary uppercase">
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
}: {
  section: SiteSection;
  values: import("@/lib/data/types").CoreValue[];
}) {
  if (values.length === 0) return null;

  return (
    <section aria-labelledby="about-values-heading" className="py-section bg-surface-warm">
      <Container>
        <div className="max-w-2xl">
          {section.eyebrow ? (
            <p className="mb-3 text-sm font-medium tracking-wide text-secondary uppercase">
              {section.eyebrow}
            </p>
          ) : null}
          <h2
            id="about-values-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
        </div>

        <dl className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => (
            <div key={value.slug}>
              <dt className="text-lg font-semibold text-brand-600">{value.name}</dt>
              <dd className="mt-2 text-base text-ink-muted">{value.description}</dd>
            </div>
          ))}
        </dl>
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
    <section aria-labelledby="about-approach-heading" className="py-section bg-surface-deep">
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
