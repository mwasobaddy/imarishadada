import Link from "next/link";

import { Container } from "@/components/site/container";
import { VolunteerForm } from "@/components/volunteer/volunteer-form";
import { placesRemaining, type VolunteerRole } from "@/lib/volunteer/roles";
import type { SiteSection } from "@/lib/data/types";

/**
 * The sections of `/volunteer`.
 *
 * ## Why they are components
 *
 * They were written in the page file, which meant the admin's live preview —
 * which renders the *real* components — had nothing to call for six of the
 * seven sections. Now the page and the preview render the same code, so the
 * preview is the page.
 *
 * ## Why the screening note is code
 *
 * The list of screening requirements is editable. The sentence that says
 * nobody is placed with a child-facing role before all of them are complete is
 * not — same reasoning as `PATHWAY_UNVERIFIED` on `/programmes` and the consent
 * tiers. The roadmap is blunt: *"Never soften the screening step. Removing it
 * to increase application volume is how safeguarding incidents happen."*
 */

/** The steps, numbered. */
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

/** The open roles, or the empty state when there are none. */
export function VolunteerRoles({
  section,
  emptySection,
  roles,
}: {
  section: SiteSection;
  /** Rendered instead of the list when no role is open. */
  emptySection: SiteSection | null;
  roles: VolunteerRole[];
}) {
  return (
    <section aria-labelledby="vol-roles-heading" className="py-section bg-surface">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="vol-roles-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
        </div>

        {roles.length === 0 ? (
          emptySection ? (
            <div className="mt-10 rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-8">
              <h3 className="text-xl font-semibold text-brand-600">
                {emptySection.heading}
              </h3>
              {emptySection.body ? (
                <p className="measure mt-3 leading-relaxed text-ink-muted">
                  {emptySection.body}
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
                  <h3 className="text-lg font-semibold text-brand-600">{role.title}</h3>
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
                      {/* A full role stays listed. Filtering it out would make
                          the list silently shorter and leave an applicant
                          unable to tell "not needed" from "full". */}
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
  );
}

/** The six steps, from application to support. */
export function VolunteerProcess({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="vol-process-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="vol-process-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
          <StepList steps={section.steps ?? []} />
        </div>
      </Container>
    </section>
  );
}

/** What working with children here requires. */
export function VolunteerSafeguarding({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="vol-safe-heading" className="py-section bg-surface">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="vol-safe-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}

          <StepList steps={section.steps ?? []} />

          {/*
            Code-owned. An editor can reword the requirements above; they cannot
            remove the statement that nobody is placed before all of them are
            complete. The roadmap: "Never soften the screening step."
          */}
          <p
            role="note"
            className="mt-8 rounded-xl border-2 border-dashed border-brand-600/40 bg-surface-lilac p-5 text-sm leading-relaxed text-ink-muted"
          >
            <span className="font-semibold text-brand-600">
              We do not place anyone with a child-facing role until every one of
              these is complete.
            </span>{" "}
            No exceptions, and no role is urgent enough to skip one. If that makes
            us slower to reply than another organisation, that is the trade we have
            chosen.
          </p>

          {section.ctaLabel && section.ctaHref ? (
            <Link
              href={section.ctaHref}
              className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            >
              {section.ctaLabel} →
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/** The application form. */
export function VolunteerApply({
  section,
  roles,
}: {
  section: SiteSection;
  roles: VolunteerRole[];
}) {
  return (
    <section id="apply" aria-labelledby="vol-form-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2
            id="vol-form-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}

          <div className="mt-8">
            <VolunteerForm roles={roles} />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Not in Kibera. */
export function VolunteerRemote({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="vol-remote-heading" className="bg-surface py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="vol-remote-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
          {section.ctaLabel && section.ctaHref ? (
            <Link
              href={section.ctaHref}
              className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            >
              {section.ctaLabel} →
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
