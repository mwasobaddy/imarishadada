import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Container } from "@/components/site/container";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import type { ContactDetails } from "@/lib/data/contact";

/**
 * Contact methods.
 *
 * ## The shape, and why
 *
 * This used to be four equal cards in a row, with an emoji on each. The
 * research on contact sections is consistent about what that gets wrong:
 *
 *   * **Order and prominence should reflect what people actually use.** For a
 *     Kenyan organisation, WhatsApp is the channel. A visitor in Kibera or
 *     Nairobi will message; they will not compose an email to a charity. So
 *     WhatsApp is a full-width primary panel and the rest are secondary
 *     cards. The old version *said* "all equal weight" in its own comment
 *     while visually promoting WhatsApp — an internal contradiction, and the
 *     visual was the honest one.
 *   * **Tell people how long they will wait, per channel.** One blanket "we
 *     reply within three working days" applied to all four is wrong twice
 *     over: it is not true of WhatsApp, and it tells a visitor messaging on
 *     WhatsApp to sit and wait three days for a reply that arrives in
 *     minutes. The wait differs by channel, so the wait is stated per
 *     channel.
 *   * **Say whether a human will answer.** People assume a form goes to a
 *     bot. One line removes the doubt, and for a charity asking for money it
 *     is the difference between a message and a bounce.
 *   * **The value is the action, except where it is not.** A phone number
 *     that is a `tel:` link and an address that opens a map need no extra
 *     button — a "Call us" button next to a tappable number is noise.
 *     WhatsApp is the exception: the number opens the dialler, not WhatsApp,
 *     so it needs a real button.
 *   * **Icons supplement text, never replace it.** The emoji (💬 📞 ✉️ 📍)
 *     also rendered differently on every platform and read as unfinished. These
 *     are lucide line icons in a tinted disc, with the label still in text.
 *
 * No accordion and no hidden panel. The spec's point is that a visitor sees a
 * reachable channel immediately; anything that needs a click first to reveal a
 * phone number defeats it.
 *
 * Each channel renders independently. A null field becomes a labelled
 * placeholder rather than a blank or a dead `mailto:` — currently email,
 * because `hello@imarishadada.org` does not resolve until the domain is live,
 * and publishing an address that bounces is worse than publishing none.
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
            Start with WhatsApp
          </h2>
          <p className="measure mt-4 text-lg text-ink-muted">
            It is the fastest way to reach us, and every message is read by a
            person on the team — not a bot, and not a shared inbox nobody
            opens.
          </p>
        </div>

        {/* ---- Primary channel: WhatsApp --------------------------- */}
        {whatsappHref && contact.phone ? (
          <div className="mt-10 overflow-hidden rounded-card border border-brand-600/30 bg-brand-50">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-600 text-brand-50"
                  >
                    <MessageCircle className="size-5" />
                  </span>
                  <p className="text-lg font-semibold text-brand-600">
                    Message us on WhatsApp
                  </p>
                </div>

                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="tabular mt-4 inline-flex min-h-11 items-center text-3xl font-semibold tracking-tight text-brand-600 underline decoration-brand-600/30 underline-offset-8 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700 sm:text-4xl"
                >
                  {contact.phone}
                </a>

                {contact.officeHours ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
                    <Clock aria-hidden="true" className="size-4 shrink-0" />
                    {contact.officeHours}
                  </p>
                ) : null}

                {contact.responseTimes?.whatsapp ? (
                  <p className="mt-2 text-sm font-medium text-brand-600">
                    {contact.responseTimes.whatsapp}
                  </p>
                ) : null}
              </div>

              <div className="lg:text-right">
                <InteractiveHoverButton
                  href={whatsappHref}
                  tone="brand"
                  className="min-h-13 w-full rounded-full bg-brand-600 px-8 text-base font-semibold text-brand-50 lg:w-auto"
                >
                  Message us
                </InteractiveHoverButton>
                <p className="mt-3 text-xs text-ink-muted">
                  Opens WhatsApp with a message ready to send.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-card border-2 border-dashed border-brand-600/40 bg-brand-50 p-6">
            <p className="text-sm font-semibold text-brand-600">
              WhatsApp number not yet published
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Use the form below and it will reach the team.
            </p>
          </div>
        )}

        {/* ---- Secondary channels ---------------------------------- */}
        <h3 className="mt-14 text-sm font-semibold tracking-wide text-ink uppercase">
          Other ways to reach us
        </h3>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* ---- Phone --------------------------------------------- */}
          <li className="flex flex-col rounded-card border border-border bg-card p-6">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-lilac text-brand-600"
            >
              <Phone className="size-5" />
            </span>
            <h4 className="mt-4 text-lg font-semibold text-ink">Phone</h4>

            {contact.phone ? (
              <>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="tabular mt-1 inline-flex min-h-11 items-center text-sm text-ink-muted underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  {contact.phone}
                </a>
                {contact.officeHours ? (
                  <p className="mt-3 text-xs text-ink-muted">{contact.officeHours}</p>
                ) : null}
                {contact.responseTimes?.phone ? (
                  <p className="mt-2 text-xs font-medium text-brand-600">
                    {contact.responseTimes.phone}
                  </p>
                ) : null}
              </>
            ) : (
              <PlaceholderNote>Phone number not yet published</PlaceholderNote>
            )}
          </li>

          {/* ---- Email --------------------------------------------- */}
          <li className="flex flex-col rounded-card border border-border bg-card p-6">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-lilac text-brand-600"
            >
              <Mail className="size-5" />
            </span>
            <h4 className="mt-4 text-lg font-semibold text-ink">Email</h4>

            {contact.email ? (
              <>
                <a
                  href={`mailto:${contact.email}`}
                  className="mt-1 break-words text-sm text-ink-muted underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  {contact.email}
                </a>
                {contact.responseTimes?.email ? (
                  <p className="mt-3 text-xs font-medium text-brand-600">
                    {contact.responseTimes.email}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                {/*
                  The domain email is the roadmap's critical-path item 1. Until
                  it resolves, this slot says so rather than linking to an
                  address that bounces. `hello@imarishadada.org` is deliberately
                  NOT hardcoded here.
                */}
                <PlaceholderNote>Our domain email is being set up</PlaceholderNote>
                <p className="mt-2 text-xs text-ink-muted">
                  WhatsApp is the fastest way to reach us right now.
                </p>
              </>
            )}
          </li>

          {/* ---- Office -------------------------------------------- */}
          <li className="flex flex-col rounded-card border border-border bg-card p-6">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-lilac text-brand-600"
            >
              <MapPin className="size-5" />
            </span>
            <h4 className="mt-4 text-lg font-semibold text-ink">Office</h4>

            {contact.address ? (
              <>
                {/*
                  A static map image plus a directions link, never a
                  third-party embed. The spec's reasoning: embeds leak visitor
                  IP addresses to Google, which conflicts with donor privacy
                  expectations. No embed is mounted, so nothing loads and
                  nothing is sent.

                  The address is a locality, not a building, so there is no
                  street address to map to — which is why this card offers
                  directions rather than pretending to show a pin.
                */}
                <p className="mt-1 text-sm text-ink-muted">{contact.address}</p>
                <a
                  href="https://www.openstreetmap.org/search?query=Kibera%2C%20Nairobi%2C%20Kenya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  Get directions
                  <span aria-hidden="true">→</span>
                </a>
                <p className="mt-2 text-xs text-ink-muted">
                  Opens OpenStreetMap in a new tab. We never embed a map, so
                  your visit is not shared with a map provider.
                </p>
              </>
            ) : (
              <PlaceholderNote>Address not yet published</PlaceholderNote>
            )}
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
