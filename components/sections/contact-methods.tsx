import { Container } from "@/components/site/container";
import type { ContactDetails } from "@/lib/data/contact";

/**
 * Contact methods — above the fold, all equal weight.
 *
 * No accordion and no hidden panel. The spec's point is that a visitor sees a
 * reachable channel immediately; anything that needs a click first to reveal a
 * phone number defeats it.
 *
 * Each channel renders independently. A null field becomes a labelled
 * placeholder rather than a blank or a dead `mailto:` — currently email, because
 * `hello@imarishadada.org` does not resolve until the domain is live, and
 * publishing an address that bounces is worse than publishing none.
 */
export function ContactMethods({ contact }: { contact: ContactDetails }) {
  const whatsappHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.whatsappPrefill)}`
    : null;

  return (
    <section aria-labelledby="methods-heading" className="py-section bg-surface">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
            Get in touch
          </p>
          <h2
            id="methods-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            Four ways to reach us
          </h2>
          <p className="measure mt-4 text-lg text-ink-muted">
            {contact.responseTime}
          </p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* ---- WhatsApp ------------------------------------------- */}
          <li className="flex flex-col rounded-card border border-brand-600/30 bg-brand-50 p-6">
            <span aria-hidden="true" className="text-2xl">
              💬
            </span>
            <h3 className="mt-3 text-lg font-semibold text-brand-600">WhatsApp</h3>
            {whatsappHref && contact.phone ? (
              <>
                <p className="mt-1 text-sm text-ink-muted tabular">{contact.phone}</p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  Message us
                </a>
                {/*
                  Copy-paste fallback. Some devices and some desktop browsers
                  do not have WhatsApp, and a dead link there is a lost enquiry.
                */}
                <p className="mt-3 text-xs text-ink-muted">
                  Opens WhatsApp with a message ready to send.
                </p>
              </>
            ) : (
              <PlaceholderNote>WhatsApp number not yet published</PlaceholderNote>
            )}
          </li>

          {/* ---- Phone ----------------------------------------------- */}
          <li className="flex flex-col rounded-card border border-border bg-card p-6">
            <span aria-hidden="true" className="text-2xl">
              📞
            </span>
            <h3 className="mt-3 text-lg font-semibold text-ink">Phone</h3>
            {contact.phone ? (
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="mt-1 text-sm text-ink-muted tabular underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600"
              >
                {contact.phone}
              </a>
            ) : (
              <PlaceholderNote>Phone number not yet published</PlaceholderNote>
            )}
            {contact.officeHours ? (
              <p className="mt-3 text-xs text-ink-muted">{contact.officeHours}</p>
            ) : null}
          </li>

          {/* ---- Email ----------------------------------------------- */}
          <li className="flex flex-col rounded-card border border-border bg-card p-6">
            <span aria-hidden="true" className="text-2xl">
              ✉️
            </span>
            <h3 className="mt-3 text-lg font-semibold text-ink">Email</h3>
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="mt-1 break-words text-sm text-ink-muted underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600"
              >
                {contact.email}
              </a>
            ) : (
              <>
                {/*
                  The domain email is the roadmap's critical-path item 1. Until
                  it resolves, this slot says so rather than linking to an
                  address that bounces. `hello@imarishadada.org` is deliberately
                  NOT hardcoded here.
                */}
                <PlaceholderNote>
                  Our domain email is being set up
                </PlaceholderNote>
                <p className="mt-2 text-xs text-ink-muted">
                  WhatsApp is the fastest way to reach us right now.
                </p>
              </>
            )}
          </li>

          {/* ---- Office ---------------------------------------------- */}
          <li className="flex flex-col rounded-card border border-border bg-card p-6">
            <span aria-hidden="true" className="text-2xl">
              📍
            </span>
            <h3 className="mt-3 text-lg font-semibold text-ink">Office</h3>
            {contact.address ? (
              <p className="mt-1 text-sm text-ink-muted">{contact.address}</p>
            ) : (
              <PlaceholderNote>Address not yet published</PlaceholderNote>
            )}
            {/*
              A static map image plus a directions link, never a third-party
              embed. The spec's reasoning: embeds leak visitor IP addresses to
              Google, which conflicts with donor privacy expectations. No embed
              is mounted, so nothing loads and nothing is sent.
            */}
            <div className="mt-4 flex min-h-32 items-center justify-center rounded-lg border-2 border-dashed border-brand-600/30 bg-surface-lilac p-4 text-center" aria-hidden="true">
              <span className="text-xs text-ink-muted">
                Static map image
                <br />
                <span className="text-[11px]">
                  No third-party embed — visitor IPs are never sent to a map provider
                </span>
              </span>
            </div>
            <a
              href="https://www.openstreetmap.org/search?query=Kibera%2C%20Nairobi%2C%20Kenya"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600"
            >
              Directions
            </a>
          </li>
        </ul>
      </Container>
    </section>
  );
}

function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-sm font-medium text-brand-600/70" role="note">
      {children}
    </p>
  );
}

/**
 * FAQ teaser.
 *
 * Three of the questions a prospective donor asks most, answered inline so the
 * contact page does not depend on `/faq` existing.
 */
export function ContactFaqs() {
  const faqs = [
    {
      q: "Do you offer monthly giving?",
      a: "Yes — every amount on our giving ladder can be given monthly. Monthly gifts are what keep a mentor in a girl's life through the whole school year.",
    },
    {
      q: "Can I give from outside Kenya?",
      a: "Yes, by card. Receipts are issued for every gift, in your currency.",
    },
    {
      q: "Do you accept in-kind donations?",
      a: "Message us first. We cannot always accept physical goods, and an unasked-for donation is often unusable.",
    },
  ];

  return (
    <section aria-labelledby="contact-faq-heading" className="bg-surface-lilac py-section">
      <Container>
        <h2
          id="contact-faq-heading"
          className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
        >
          Before you write
        </h2>

        <dl className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-card border border-border bg-card p-6">
              <dt className="text-lg font-semibold text-ink">{faq.q}</dt>
              <dd className="measure mt-2 text-ink-muted">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
