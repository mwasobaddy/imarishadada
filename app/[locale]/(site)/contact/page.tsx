import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Clock, Heart, MapPin, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import {
  ContactFaqs,
  ContactMethods,
} from "@/components/sections/contact-methods";
import { ContactForm } from "@/components/sections/contact-form";
import {
  getContactDetails,
  getContactSections,
  getEnquiryTypes,
} from "@/lib/data/contact";
import { isVisible } from "@/lib/data/sections";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { Link } from "@/i18n/navigation";

/**
 * Contact — `/contact`.
 *
 * ## The shape, and why
 *
 * The research on contact pages is consistent, and this page was breaking most
 * of it:
 *
 *   * **One page, one instruction.** Red Cross: *"Always provide a clear
 *     heading that explains the purpose of the contact information."* The old
 *     page had a hero saying "Talk to us." and then, a screenful later, a
 *     second heading saying "Start with WhatsApp". Two competing instructions
 *     in one viewport. Now the hero makes the promise and the methods section
 *     does the routing.
 *   * **Route by user language, not organisational language.** WANDR: *"If
 *     you want to give, the donation page is faster."* The old hero opened
 *     with "Whether you want to give, partner, volunteer, or press us" — and
 *     then offered a contact form to a donor who wanted to *give*. Giving is
 *     not a contact. It now goes to the donation page.
 *   * **Put the "before you write" answers where they prevent a wasted
 *     enquiry.** Redwings puts "Need help?" at the top; NN/g notes people
 *     arrive wanting to know whether they need to contact at all. The old page
 *     put "Before you write" at the very bottom, *after* the form — where a
 *     visitor only reaches it having already scrolled past the thing it was
 *     meant to prevent. It now sits beside the form, so both are visible at
 *     once and the reader can check before typing.
 *   * **Trust architecture in the first screen.** WANDR: *"Does the design
 *     establish credibility within the first screen?"* Someone on a contact
 *     page is often checking whether the organisation is real. The hero now
 *     carries where we are, how we respond, and a link to the safeguarding
 *     policy — a duty-of-care link, not decoration.
 *
 * Prerendered shell with a client form: the page is static content plus an
 * island, so it stays cheap and indexable.
 */

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Imarisha Dada by WhatsApp, phone, email or our contact form. Kibera, Nairobi, Kenya. We reply within three working days.",
  alternates: {
    canonical: "/contact",
    languages: { "en-KE": "/contact", "x-default": "/contact" },
  },
  openGraph: {
    type: "website",
    url: "/contact",
    locale: "en_KE",
    images: ["/opengraph-image"],
    title: "Contact Imarisha Dada — Kibera, Nairobi, Kenya",
    description:
      "Reach Imarisha Dada by WhatsApp, phone, email or our contact form. We reply within three working days.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Imarisha Dada — Kibera, Nairobi, Kenya",
    description:
      "Reach Imarisha Dada by WhatsApp, phone, email or our contact form.",
  },
};

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [contact, enquiryTypes, sections] = await Promise.all([
    getContactDetails(),
    getEnquiryTypes(),
    getContactSections(),
  ]);

  const hero = sections["contact-hero"];
  const methods = sections["contact-methods"];
  const methodsOther = sections["contact-methods-other"];
  const form = sections["contact-form"];
  const faqs = sections["contact-faqs"];
  const partner = sections["contact-partner"];

  const contactPointJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: absoluteUrl("/contact"),
    mainEntity: {
      "@type": "NGO",
      name: "Imarisha Dada",
      url: absoluteUrl("/"),
      // Only emitted when we actually hold the value. A schema.org `email` of
      // an address that bounces is worse than omitting the property — search
      // engines surface it, and a broken address in a rich result costs trust.
      ...(contact.email ? { email: contact.email } : {}),
      ...(contact.phone
        ? { telephone: `+${contact.phone.replace(/[\s-]/g, "")}` }
        : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kibera",
        addressRegion: "Nairobi",
        addressCountry: "KE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "general enquiries",
        ...(contact.phone
          ? { telephone: `+${contact.phone.replace(/[\s-]/g, "")}` }
          : {}),
        availableLanguage: ["en", "sw", "fr", "de", "pt"],
      },
    },
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body}>
            {/* Trust architecture, in the first screen.
                Someone landing on a contact page is often checking whether the
                organisation is real before they send anything. Where we are, how
                we respond, and a duty-of-care link to the safeguarding policy —
                all three, above the fold.

                The two links are the section's primary and secondary CTAs, and
                the two facts between them come from `settings`. The strip is
                ordered link / fact / fact / link so the reader gets a route in
                and a route to the policy around the details. */}
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted">
              {/*
                Giving is not a contact. A donor who lands here looking to give
                should be on the donation page, not filling in a form. WANDR:
                "Navigation labels should use user language, not organizational
                language."
              */}
              {hero.ctaLabel && hero.ctaHref ? (
                <li className="flex items-center gap-2">
                  <Heart aria-hidden="true" className="size-4 shrink-0 text-brand-600" />
                  <Link
                    href={hero.ctaHref}
                    className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {hero.ctaLabel}
                  </Link>
                </li>
              ) : null}

              {contact.address ? (
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-4 shrink-0 text-brand-600" />
                  {contact.address}
                </li>
              ) : null}

              <li className="flex items-center gap-2">
                <Clock aria-hidden="true" className="size-4 shrink-0 text-brand-600" />
                {contact.responseTimes?.email ?? contact.responseTime}
              </li>

              {hero.ctaSecondaryLabel && hero.ctaSecondaryHref ? (
                <li className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-brand-600" />
                  <Link
                    href={hero.ctaSecondaryHref}
                    className="underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {hero.ctaSecondaryLabel}
                  </Link>
                </li>
              ) : null}
            </ul>
          </PageHero>
        ) : null}

        {isVisible(methods) && isVisible(methodsOther) ? (
          <ContactMethods
            contact={contact}
            section={methods}
            otherSection={methodsOther}
          />
        ) : null}

        {/* ---- The form, and the answers that stop a wasted enquiry ----
            The FAQ sits beside the form rather than below it, so a visitor can
            read both at once and check a question before writing it. */}
        <section aria-labelledby="form-heading" className="bg-surface-lilac py-section">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <div className="max-w-2xl">
                {isVisible(form) ? (
                  <>
                    <h2
                      id="form-heading"
                      className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                    >
                      {form.heading}
                    </h2>
                    {form.body ? (
                      <p className="measure mt-4 text-lg text-ink-muted">
                        {form.body}
                      </p>
                    ) : null}
                  </>
                ) : null}

                {isVisible(faqs) ? <ContactFaqs section={faqs} /> : null}

                {/* Partnering gets a route, not a footnote. The enquiry-type
                    dropdown already does the routing; this says so, and
                    points at the page that actually helps. */}
                {isVisible(partner) ? (
                  <div className="mt-8 rounded-card border border-brand-600/30 bg-brand-50 p-6">
                    <h3 className="text-base font-semibold text-brand-600">
                      {partner.heading}
                    </h3>
                    {partner.body ? (
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        {partner.body}
                      </p>
                    ) : null}
                    {partner.ctaLabel && partner.ctaHref ? (
                      <Link
                        href={partner.ctaHref}
                        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                      >
                        {partner.ctaLabel}
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <ContactForm enquiryTypes={enquiryTypes} />
            </div>
          </Container>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            contactPointJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Contact", path: "/contact" },
            ]),
          ]),
        }}
      />
    </>
  );
}
