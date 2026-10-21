import { ArrowRight } from "lucide-react";

import { Container } from "@/components/site/container";
import { ContactFaqs, ContactMethods } from "@/components/sections/contact-methods";
import { ContactForm } from "@/components/sections/contact-form";
import type { ContactDetails, EnquiryTypeOption } from "@/lib/data/contact";
import type { SiteSection } from "@/lib/data/types";
import { Link } from "@/i18n/navigation";

/**
 * The editable parts of the contact page.
 *
 * ## Why they are components
 *
 * They were written in the page file, which meant the admin's live preview
 * could only ever draw an approximation of them. The page and the preview now
 * render the same code.
 *
 * ## The three sections that live in one band
 *
 * `contact-form`, `contact-faqs` and `contact-partner` share a band: the
 * heading and the answers sit in the left column, the form in the right. The
 * FAQ keeps its own preview, because it is a card in its own right; the form
 * and the partner block are previewed in the band, because that is where they
 * are read.
 */

/** The enquiry band: the heading, the answers, the partner note, and the form. */
export function ContactEnquiryBand({
  form,
  faqs,
  partner,
  enquiryTypes,
}: {
  /** The heading and paragraph above the form. */
  form: SiteSection | null;
  /** The questions that stop a wasted enquiry. */
  faqs: SiteSection | null;
  /** The note that routes a partnership enquiry to the right place. */
  partner: SiteSection | null;
  enquiryTypes: EnquiryTypeOption[];
}) {
  return (
    <section aria-labelledby="form-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="max-w-2xl">
            {form ? (
              <>
                <h2
                  id="form-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {form.heading}
                </h2>
                {form.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">{form.body}</p>
                ) : null}
              </>
            ) : null}

            {faqs ? <ContactFaqs section={faqs} /> : null}

            {partner ? <ContactPartnerCard section={partner} /> : null}
          </div>

          <ContactForm enquiryTypes={enquiryTypes} />
        </div>
      </Container>
    </section>
  );
}

/**
 * Partnering gets a route, not a footnote.
 *
 * The enquiry-type dropdown already does the routing; this says so, and points
 * at the page that actually helps.
 */
export function ContactPartnerCard({ section }: { section: SiteSection }) {
  return (
    <div className="mt-8 rounded-card border border-brand-600/30 bg-brand-50 p-6">
      <h3 className="text-base font-semibold text-brand-600">{section.heading}</h3>
      {section.body ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{section.body}</p>
      ) : null}
      {section.ctaLabel && section.ctaHref ? (
        <Link
          href={section.ctaHref}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          {section.ctaLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * The ways to reach us, and the heading over the secondary channels.
 *
 * `contact-methods-other` is a heading inside the methods block rather than a
 * section of its own, so its preview is the block with that heading in place.
 */
export function ContactMethodsBlock({
  section,
  otherSection,
  contact,
}: {
  /** The main heading and paragraph. */
  section: SiteSection;
  /** The heading over the secondary channels. */
  otherSection: SiteSection | null;
  contact: ContactDetails;
}) {
  return (
    <ContactMethods
      contact={contact}
      section={section}
      otherSection={otherSection ?? section}
    />
  );
}
