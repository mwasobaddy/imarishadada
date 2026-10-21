import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { PartnerForm } from "@/components/partner/partner-form";
import type { ContactDetails } from "@/lib/data/contact";
import type { PublicPartner } from "@/lib/data/partner";
import type { SiteSection } from "@/lib/data/types";

/**
 * The sections of `/partner`.
 *
 * ## Why they are components
 *
 * They were written in the page file, which meant the admin's live preview —
 * which renders the *real* components — had nothing to call for six of the
 * seven sections. Now the page and the preview render the same code, so the
 * preview is the page.
 *
 * ## Why the partners list is hidden when it is empty
 *
 * A section that says "organisations we work with" and then lists nothing
 * reads as an absence of partners rather than as an absence of permission to
 * name them. The list is only rendered when a partner is publishable — see
 * `lib/data/partner.ts`.
 */

/** The bullets: what we need, and what we cannot offer yet. */
function BulletList({ items }: { items: { title: string }[] }) {
  return (
    <ul className="mt-8 space-y-3">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3 leading-relaxed text-ink">
          <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-600" />
          <span className="measure">{item.title}</span>
        </li>
      ))}
    </ul>
  );
}

/** What we actually need. */
export function PartnerNeed({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="partner-need-heading" className="bg-surface py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="partner-need-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
          {section.bodySecondary ? (
            <p className="measure mt-4 leading-relaxed text-ink-muted">
              {section.bodySecondary}
            </p>
          ) : null}
          <BulletList items={section.steps ?? []} />
        </div>
      </Container>
    </section>
  );
}

/** What we cannot offer yet. */
export function PartnerCannot({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="partner-cannot-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="partner-cannot-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
          <BulletList items={section.steps ?? []} />
        </div>
      </Container>
    </section>
  );
}

/** Due diligence. */
export function PartnerDueDiligence({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="partner-dd-heading" className="bg-surface py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="partner-dd-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
          {section.bodySecondary ? (
            <p className="measure mt-4 leading-relaxed text-ink-muted">
              {section.bodySecondary}
            </p>
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

/** The organisations we are allowed to name. */
export function PartnerList({
  section,
  partners,
}: {
  section: SiteSection;
  partners: PublicPartner[];
}) {
  if (partners.length === 0) return null;

  return (
    <section aria-labelledby="partner-partners-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="partner-partners-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <li
              key={partner.id}
              className="flex flex-col rounded-card border border-border bg-card p-6"
            >
              {partner.logoPath && partner.logoAlt ? (
                <div className="relative mb-5 h-16 w-full">
                  <Image
                    src={partner.logoPath}
                    alt={partner.logoAlt}
                    fill
                    sizes="(min-width: 1024px) 300px, 50vw"
                    className="object-contain object-left"
                  />
                </div>
              ) : null}
              <h3 className="text-lg font-semibold text-ink">{partner.name}</h3>
              {partner.description ? (
                <p className="measure mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {partner.description}
                </p>
              ) : null}
              {partner.websiteUrl ? (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                >
                  Visit {partner.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** The enquiry form. */
export function PartnerApply({ section }: { section: SiteSection }) {
  return (
    <section id="enquire" aria-labelledby="partner-form-heading" className="bg-surface py-section">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2
            id="partner-form-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
          <div className="mt-8">
            <PartnerForm />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** The direct channels. */
export function PartnerDirect({
  section,
  contact,
}: {
  section: SiteSection;
  contact: ContactDetails;
}) {
  return (
    <section aria-labelledby="partner-direct-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="partner-direct-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
          <ul className="mt-6 space-y-2 text-ink">
            {contact.email ? (
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                >
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.whatsapp ? (
              <li>
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                >
                  WhatsApp us
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </Container>
    </section>
  );
}
