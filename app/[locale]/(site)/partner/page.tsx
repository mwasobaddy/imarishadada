import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { Container } from "@/components/site/container";
import { PageHero } from "@/components/site/page-hero";
import { PartnerForm } from "@/components/partner/partner-form";
import { getContactDetails } from "@/lib/data/contact";
import { getPartnerSections, getPublicPartners } from "@/lib/data/partner";
import { isVisible } from "@/lib/data/sections";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Partner — `/partner`.
 *
 * ## What was wrong
 *
 * A `ProseRoute` constant with no form, and a public API that would have served
 * any partner marked active, whether or not it was a test or had written
 * permission. See migration 0027 for the gate that now refuses both.
 *
 * ## Only publishable partners appear
 *
 * `getPublicPartners` returns active, non-test rows with written permission on
 * file, and the section is hidden when that list is empty. Until an organisation
 * has signed off, the page says so in words, not with empty logo boxes.
 *
 * ## What is not on this page yet
 *
 * The roadmap's cohort cost table and its \"ways to partner\" tabs. Cohort costs
 * wait for verified figures and an admin path to enter them; the giving-tiers
 * editor has no cohort option today. The tabs would publish offers the
 * organisation has not confirmed, such as matched giving and cause marketing.
 */

const TITLE = "Partner with us";
const DESCRIPTION =
  "Partner with Imarisha Dada on girls' education, school re-entry and economic empowerment in Kibera, Nairobi. How we work with funders, what we need, and what we cannot yet offer.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/partner",
    languages: { "en-KE": "/partner", "x-default": "/partner" },
  },
  openGraph: {
    type: "website",
    url: "/partner",
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

export default async function PartnerPage({ params }: PageProps<"/[locale]/partner">) {
  const { locale } = await params;

  // Pin the locale for static rendering. It must run in the page, not the layout,
  // because layouts execute after the page they wrap.
  setRequestLocale(locale);

  const [sections, partners, contact] = await Promise.all([
    getPartnerSections(),
    getPublicPartners(),
    getContactDetails(),
  ]);

  const hero = sections["partner-hero"];
  const need = sections["partner-need"];
  const cannot = sections["partner-cannot"];
  const dd = sections["partner-dd"];
  const partnersSection = sections["partner-partners"];
  const form = sections["partner-form"];
  const direct = sections["partner-direct"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: absoluteUrl("/partner"),
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

        {isVisible(need) ? (
          <section aria-labelledby="partner-need-heading" className="bg-surface py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="partner-need-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {need.heading}
                </h2>
                {need.body ? <p className="measure mt-4 text-lg text-ink-muted">{need.body}</p> : null}
                {need.bodySecondary ? (
                  <p className="measure mt-4 leading-relaxed text-ink-muted">{need.bodySecondary}</p>
                ) : null}
                <BulletList items={need.steps ?? []} />
              </div>
            </Container>
          </section>
        ) : null}

        {isVisible(cannot) ? (
          <section aria-labelledby="partner-cannot-heading" className="bg-surface-lilac py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="partner-cannot-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {cannot.heading}
                </h2>
                {cannot.body ? <p className="measure mt-4 text-lg text-ink-muted">{cannot.body}</p> : null}
                <BulletList items={cannot.steps ?? []} />
              </div>
            </Container>
          </section>
        ) : null}

        {isVisible(dd) ? (
          <section aria-labelledby="partner-dd-heading" className="bg-surface py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="partner-dd-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {dd.heading}
                </h2>
                {dd.body ? <p className="measure mt-4 text-lg text-ink-muted">{dd.body}</p> : null}
                {dd.bodySecondary ? (
                  <p className="measure mt-4 leading-relaxed text-ink-muted">{dd.bodySecondary}</p>
                ) : null}
                {dd.ctaLabel && dd.ctaHref ? (
                  <Link
                    href={dd.ctaHref}
                    className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                  >
                    {dd.ctaLabel} →
                  </Link>
                ) : null}
              </div>
            </Container>
          </section>
        ) : null}

        {/* Hidden entirely when no partner is publishable. See lib/data/partner.ts. */}
        {isVisible(partnersSection) && partners.length > 0 ? (
          <section aria-labelledby="partner-partners-heading" className="bg-surface-lilac py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="partner-partners-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {partnersSection.heading}
                </h2>
                {partnersSection.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">{partnersSection.body}</p>
                ) : null}
              </div>
              <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <li key={partner.id} className="flex flex-col rounded-card border border-border bg-card p-6">
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
        ) : null}

        {isVisible(form) ? (
          <section id="enquire" aria-labelledby="partner-form-heading" className="bg-surface py-section">
            <Container>
              <div className="mx-auto max-w-3xl">
                <h2
                  id="partner-form-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {form.heading}
                </h2>
                {form.body ? <p className="measure mt-4 text-lg text-ink-muted">{form.body}</p> : null}
                <div className="mt-8">
                  <PartnerForm />
                </div>
              </div>
            </Container>
          </section>
        ) : null}

        {isVisible(direct) ? (
          <section aria-labelledby="partner-direct-heading" className="bg-surface-lilac py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="partner-direct-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {direct.heading}
                </h2>
                {direct.body ? <p className="measure mt-4 text-lg text-ink-muted">{direct.body}</p> : null}
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
        ) : null}
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Partner with us", path: "/partner" },
            ]),
          ]),
        }}
      />
    </>
  );
}
