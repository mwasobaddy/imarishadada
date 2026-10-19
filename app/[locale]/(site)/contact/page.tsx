import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { ContactFaqs, ContactMethods } from "@/components/sections/contact-methods";
import { ContactForm } from "@/components/sections/contact-form";
import { getContactDetails, getEnquiryTypes } from "@/lib/data/contact";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Contact — `/contact`.
 *
 * Lowest visual ambition on the site, highest conversion value. In Kenya a
 * large share of donations are preceded or followed by a WhatsApp conversation,
 * so the WhatsApp channel is deliberately the most prominent card.
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

  const [contact, enquiryTypes] = await Promise.all([
    getContactDetails(),
    getEnquiryTypes(),
  ]);

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
        <PageHero
          eyebrow="Contact"
          heading="Talk to us."
          body="Whether you want to give, partner, volunteer, or press us — there is a person here who will read it."
        />

        <ContactMethods contact={contact} />

        <section aria-labelledby="form-heading" className="bg-surface-lilac py-section">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
              <div className="max-w-2xl">
                <h2
                  id="form-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  Or send a message
                </h2>
                <p className="measure mt-4 text-lg text-ink-muted">
                  This reaches our team inbox. If your message is about an existing
                  donation, quote your reference so we can find it quickly.
                </p>

                <div className="mt-8 rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-ink">
                    Partnering or fundraising?
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">
                    For institutional partnerships and funding proposals, ask for a
                    partner in the dropdown — it routes faster than a general enquiry.
                  </p>
                </div>
              </div>

              <ContactForm enquiryTypes={enquiryTypes} />
            </div>
          </Container>
        </section>

        <ContactFaqs />
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
