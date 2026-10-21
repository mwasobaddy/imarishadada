import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { VolunteerForm } from "@/components/volunteer/volunteer-form";
import { getVolunteerRoles, getVolunteerSections, placesRemaining } from "@/lib/data/volunteer";
import { isVisible } from "@/lib/data/sections";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * Volunteer — `/volunteer`.
 *
 * ## What was wrong
 *
 * A `ProseRoute` page with `draft: true` rendering a static constant, while two
 * tables sat fully wired on the admin side and unreachable from here:
 *
 *   * `volunteer_roles` — read only by `/admin/volunteer-roles`.
 *   * `volunteer_applications` — an inbox, status transitions and a dashboard
 *     count, with **nothing public that ever wrote a row.** The triage surface
 *     could not fill.
 *
 * Both are now reachable. The form posts to a Server Action which writes with
 * the service role, because the table holds applicant PII and RLS gives `anon`
 * no insert — correct, and the reason the write does not happen from the browser.
 *
 * ## Screening is stated before the form, not after it
 *
 * The roadmap: *"Leading with the screening requirement is unusual and correct.
 * It filters out casual applicants and reassures parents and funders."* It is in
 * the hero, in the process steps, and again as a gate above the form.
 *
 * ## The "no exceptions" line is code, not copy
 *
 * The list of screening requirements is editable. The sentence that says nobody
 * is placed with a child-facing role before all of them are complete is not —
 * same reasoning as `PATHWAY_UNVERIFIED` on `/programmes` and the consent tiers.
 * The roadmap is blunt: *"Never soften the screening step. Removing it to
 * increase application volume is how safeguarding incidents happen."*
 */

const TITLE = "Volunteer with us";
const DESCRIPTION =
  "Volunteer with Imarisha Dada in Kibera, Nairobi: mentors, session facilitators, professional advisors and administrative support. Every volunteer is screened and trained before working with a girl.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/volunteer",
    languages: { "en-KE": "/volunteer", "x-default": "/volunteer" },
  },
  openGraph: {
    type: "website",
    url: "/volunteer",
    locale: "en_KE",
    images: ["/opengraph-image"],
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
};

function StepList({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <ol className="mt-8 space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-xs font-semibold text-brand-600"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-semibold text-ink">{step.title}</p>
            <p className="measure mt-1 leading-relaxed text-ink-muted">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function VolunteerPage({
  params,
}: PageProps<"/[locale]/volunteer">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [sections, roles] = await Promise.all([
    getVolunteerSections(),
    getVolunteerRoles(),
  ]);

  const hero = sections["volunteer-hero"];
  const rolesSection = sections["volunteer-roles"];
  const rolesEmpty = sections["volunteer-roles-empty"];
  const process = sections["volunteer-process"];
  const safeguarding = sections["volunteer-safeguarding"];
  const form = sections["volunteer-form"];
  const remote = sections["volunteer-remote"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: absoluteUrl("/volunteer"),
    inLanguage: "en-KE",
    description: DESCRIPTION,
    isPartOf: { "@type": "WebSite", name: "Imarisha Dada", url: absoluteUrl("/") },
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body} />
        ) : null}

        {/* ---- Roles --------------------------------------------------- */}
        {isVisible(rolesSection) ? (
          <section aria-labelledby="vol-roles-heading" className="py-section bg-surface">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="vol-roles-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {rolesSection.heading}
                </h2>
                {rolesSection.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">
                    {rolesSection.body}
                  </p>
                ) : null}
              </div>

              {roles.length === 0 ? (
                isVisible(rolesEmpty) ? (
                  <div className="mt-10 rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-8">
                    <h3 className="text-xl font-semibold text-brand-600">
                      {rolesEmpty.heading}
                    </h3>
                    {rolesEmpty.body ? (
                      <p className="measure mt-3 leading-relaxed text-ink-muted">
                        {rolesEmpty.body}
                      </p>
                    ) : null}
                    <Link
                      href="#apply"
                      className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                    >
                      Apply anyway →
                    </Link>
                  </div>
                ) : null
              ) : (
                <ul className="mt-10 grid gap-5 sm:grid-cols-2">
                  {roles.map((role) => {
                    const remaining = placesRemaining(role);
                    return (
                      <li
                        key={role.id}
                        className="flex flex-col rounded-card border border-border bg-card p-6"
                      >
                        <h3 className="text-lg font-semibold text-brand-600">
                          {role.title}
                        </h3>
                        {role.description ? (
                          <p className="measure mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                            {role.description}
                          </p>
                        ) : null}

                        <dl className="mt-4 space-y-1 text-xs text-ink-muted">
                          {role.timeCommitment ?? role.commitment ? (
                            <div className="flex gap-2">
                              <dt className="font-medium">Commitment</dt>
                              <dd>{role.timeCommitment ?? role.commitment}</dd>
                            </div>
                          ) : null}
                          {role.location ? (
                            <div className="flex gap-2">
                              <dt className="font-medium">Where</dt>
                              <dd>{role.location}</dd>
                            </div>
                          ) : null}
                          <div className="flex gap-2">
                            <dt className="font-medium">Places</dt>
                            {/* A full role stays listed. Filtering it out would
                                make the list silently shorter and leave an
                                applicant unable to tell "not needed" from
                                "full". */}
                            <dd>
                              {remaining === 0
                                ? "Full at the moment — apply and we will keep you on file"
                                : `${remaining} open`}
                            </dd>
                          </div>
                        </dl>

                        {role.requirements ? (
                          <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-ink-muted">
                            {role.requirements}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Container>
          </section>
        ) : null}

        {/* ---- Process ------------------------------------------------- */}
        {isVisible(process) ? (
          <section aria-labelledby="vol-process-heading" className="bg-surface-lilac py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="vol-process-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {process.heading}
                </h2>
                {process.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">{process.body}</p>
                ) : null}
                <StepList steps={process.steps ?? []} />
              </div>
            </Container>
          </section>
        ) : null}

        {/* ---- Safeguarding -------------------------------------------- */}
        {isVisible(safeguarding) ? (
          <section aria-labelledby="vol-safe-heading" className="py-section bg-surface">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="vol-safe-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {safeguarding.heading}
                </h2>
                {safeguarding.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">
                    {safeguarding.body}
                  </p>
                ) : null}

                <StepList steps={safeguarding.steps ?? []} />

                {/*
                  Code-owned. An editor can reword the requirements above; they
                  cannot remove the statement that nobody is placed before all of
                  them are complete. The roadmap: "Never soften the screening
                  step."
                */}
                <p
                  role="note"
                  className="mt-8 rounded-xl border-2 border-dashed border-brand-600/40 bg-surface-lilac p-5 text-sm leading-relaxed text-ink-muted"
                >
                  <span className="font-semibold text-brand-600">
                    We do not place anyone with a child-facing role until every
                    one of these is complete.
                  </span>{" "}
                  No exceptions, and no role is urgent enough to skip one. If that
                  makes us slower to reply than another organisation, that is the
                  trade we have chosen.
                </p>

                {safeguarding.ctaLabel && safeguarding.ctaHref ? (
                  <Link
                    href={safeguarding.ctaHref}
                    className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                  >
                    {safeguarding.ctaLabel} →
                  </Link>
                ) : null}
              </div>
            </Container>
          </section>
        ) : null}

        {/* ---- Application form ---------------------------------------- */}
        {isVisible(form) ? (
          <section id="apply" aria-labelledby="vol-form-heading" className="bg-surface-lilac py-section">
            <Container>
              <div className="mx-auto max-w-3xl">
                <h2
                  id="vol-form-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {form.heading}
                </h2>
                {form.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">{form.body}</p>
                ) : null}

                <div className="mt-8">
                  <VolunteerForm roles={roles} />
                </div>
              </div>
            </Container>
          </section>
        ) : null}

        {/* ---- Remote -------------------------------------------------- */}
        {isVisible(remote) ? (
          <section aria-labelledby="vol-remote-heading" className="bg-surface py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="vol-remote-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {remote.heading}
                </h2>
                {remote.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">{remote.body}</p>
                ) : null}
                {remote.ctaLabel && remote.ctaHref ? (
                  <Link
                    href={remote.ctaHref}
                    className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                  >
                    {remote.ctaLabel} →
                  </Link>
                ) : null}
              </div>
            </Container>
          </section>
        ) : null}
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Volunteer", path: "/volunteer" },
            ]),
          ]),
        }}
      />
    </>
  );
}
