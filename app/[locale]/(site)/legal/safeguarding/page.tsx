import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { LegalPage, NeedsSignOff } from "@/components/legal/legal-page";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Safeguarding policy — `/legal/safeguarding`.
 *
 * **Blocking for launch**, and the contact form already links here as its
 * mandatory safeguarding notice, so a disclosure arriving through the form has
 * nowhere to go until this page exists.
 *
 * ## What is deliberately NOT filled in
 *
 * Two sections carry visible sign-off placeholders rather than plausible
 * content, because the roadmap is explicit about both:
 *
 *   * **Named officer** — "Role, name, contact — mandatory, never a
 *     placeholder." A confident-looking invented name on a child safeguarding
 *     policy is the single worst thing this page could ship.
 *   * **Statutory reporting** — "Do not guess at Kenyan statutory reporting
 *     obligations... An incorrect legal statement about mandatory reporting is
 *     worse than an omission."
 *
 * Everything else is drafted in full, because it is our own policy and we are
 * the right people to write it.
 */

export const metadata: Metadata = {
  title: "Safeguarding policy",
  description:
    "How Imarisha Dada protects the children and young women we work with: our safeguarding commitment, reporting routes, photography consent, and how to raise a concern.",
  alternates: {
    canonical: "/legal/safeguarding",
    languages: { "en-KE": "/legal/safeguarding", "x-default": "/legal/safeguarding" },
  },
  openGraph: {
    type: "article",
    url: "/legal/safeguarding",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Safeguarding policy | Imarisha Dada",
    description:
      "How Imarisha Dada protects the children and young women we work with, and how to raise a concern.",
  },
};

const REVIEWED = "2026-10-18";

export default async function SafeguardingPage({
  params,
}: PageProps<"/[locale]/legal/safeguarding">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Safeguarding policy",
    url: absoluteUrl("/legal/safeguarding"),
    dateModified: REVIEWED,
    inLanguage: "en-KE",
  };

  return (
    <>
      <LegalPage
        title="Safeguarding policy"
        updated={REVIEWED}
        intro={
          <>
            <p>
              Imarisha Dada works with children aged 9 and over, and with adults at
              risk of harm. This policy describes what we do to keep them safe, how
              to tell us something is wrong, and what happens next.
            </p>
            <p>
              If you are worried about a child&rsquo;s safety right now, please read
              <a
                href="#respond"
                className="mx-1 font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4"
              >
                how to report a concern
              </a>
              before reading anything else.
            </p>
          </>
        }
        sections={[
          {
            id: "commitment",
            heading: "Our commitment",
            body: (
              <>
                <p>
                  Every girl and young woman we work with is entitled to be safe, to
                  be believed, and to be treated with dignity. Safeguarding is not a
                  separate activity from our work — it is the condition that makes the
                  work possible.
                </p>
                <p>
                  This policy applies without exception to our staff, volunteers, board
                  members, partner schools, donors who volunteer on site, and anyone
                  acting on our behalf.
                </p>
              </>
            ),
          },
          {
            id: "scope",
            heading: "Who and what this covers",
            body: (
              <p>
                This policy covers all staff, volunteers, board members, partner
                organisations, and anyone working with participants on our behalf,
                whether paid or unpaid. It applies in every location where we work,
                including partner school grounds and community venues, and it applies
                to concerns raised online or by message as well as in person.
              </p>
            ),
          },
          {
            id: "officer",
            heading: "Our safeguarding officer",
            body: (
              <>
                <NeedsSignOff>
                  <p>
                    A named officer has not yet been recorded. The roadmap requires
                    that this role is filled by a <strong>real, named person</strong> —
                    &ldquo;mandatory, never a placeholder&rdquo; — because a worried
                    parent, donor or regulator will act on the name printed here.
                  </p>
                  <p className="mt-2">
                    This section will carry the officer&rsquo;s name, role and contact
                    details once appointed.
                  </p>
                </NeedsSignOff>
              </>
            ),
          },
          {
            id: "definition",
            heading: "What counts as a safeguarding concern",
            body: (
              <p>
                A concern is any indication that a child or young person may be being
                harmed, is at risk of harm, or has been harmed. It includes abuse of
                any kind — physical, sexual, emotional, or neglect — as well as
                exploitation, and any action that breaches a child&rsquo;s rights.
              </p>
            ),
          },
          {
            id: "prevent",
            heading: "How we prevent harm",
            body: (
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Safe recruitment.</strong> Everyone working directly with
                  children is interviewed, references-checked, and required to
                  complete safeguarding training before their first session.
                </li>
                <li>
                  <strong>Code of conduct.</strong> Signed and understood by everyone,
                  with explicit rules on physical contact, communication and gifts.
                </li>
                <li>
                  <strong>Training.</strong> Annual refresher training for all staff
                  and volunteers, including how to recognise and respond to a
                  disclosure.
                </li>
                <li>
                  <strong>Two-adult rule.</strong> Sessions are never delivered by a
                  single adult alone, and no session takes place behind a closed door.
                </li>
                <li>
                  <strong>Open sessions.</strong> Dada Space is deliberately an open
                  space where participants can be observed by others.
                </li>
              </ul>
            ),
          },
          {
            id: "recognise",
            heading: "How we recognise a concern",
            body: (
              <>
                <p>
                  Concerns are usually noticed through changes in behaviour, through a
                  disclosure made by a child, or through a report from another
                  professional or community member.
                </p>
                <p>
                  <strong>A concern is not proof.</strong> It is a signal that
                  something may be wrong and requires us to act. We do not need
                  certainty to look into something, and we do not require a child to
                  prove anything before we listen.
                </p>
              </>
            ),
          },
          {
            id: "respond",
            heading: "How to report a concern",
            body: (
              <>
                <p>
                  If you are concerned about the safety of a child or young woman:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Use the contact form</strong> and choose{" "}
                    <em>Something else</em>, or email us. Please do not put
                    safeguarding details in a general enquiry.
                  </li>
                  <li>
                    <strong>Call or WhatsApp</strong> on the number published on the{" "}
                    <Link href="/contact" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                      contact page
                    </Link>
                    , and ask for the safeguarding officer.
                  </li>
                  <li>
                    <strong>If a child is in immediate danger</strong>, contact the
                    police first. Tell us afterwards so we can support the family.
                  </li>
                </ul>
                <p>
                  You will not be asked to investigate. You will not be blamed for
                  raising it. We will not ask you to keep it confidential from the
                  authorities where the law requires us to report it.
                </p>
              </>
            ),
          },
          {
            id: "escalate",
            heading: "Statutory reporting — Kenya",
            body: (
              <>
                <NeedsSignOff>
                  <p>
                    This section has not been drafted. Kenya&rsquo;s Children Act
                    places specific duties on organisations working with children,
                    including obligations to report concerns of child abuse, and we
                    will not publish a statement about them without qualified advice.
                  </p>
                  <p className="mt-2">
                    The roadmap requires this to be determined with counsel: the
                    correct statutory body, the timelines, whether and how to involve
                    the police, and how to escalate if an internal report is not acted
                    on. It will state all four once confirmed.
                  </p>
                </NeedsSignOff>
              </>
            ),
          },
          {
            id: "confidentiality",
            heading: "Confidentiality",
            body: (
              <>
                <p>
                  We share the minimum necessary with the minimum number of people.
                  Information is shared on a need-to-know basis with those
                  responsible for keeping the child safe.
                </p>
                <p>
                  We will tell a child what we do with anything they tell us, in terms
                  they can understand, and we will keep that promise wherever it is
                  possible to do so.
                </p>
                <p>
                  We do not promise absolute confidentiality, and we never ask a child
                  to keep a disclosure secret. If we believe a child is at risk, we
                  will act, and we will be honest with them about why.
                </p>
              </>
            ),
          },
          {
            id: "photography",
            heading: "Photography and media",
            body: (
              <>
                <p>
                  No image of a participant is published without a recorded consent
                  tier. The tiers are:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Named and photographed</strong> — written informed consent,
                    with the name and image both shown.
                  </li>
                  <li>
                    <strong>Named, not photographed</strong> — consent to be named
                    only. No image is ever shown, including a silhouette or a
                    placeholder that could be mistaken for her.
                  </li>
                  <li>
                    <strong>Anonymised</strong> — outcome described, no identity. No
                    name, no image, and no identifying detail in the attribution.
                  </li>
                </ul>
                <p>
                  Consent given by a child is treated as expiring when she reaches
                  adulthood, because the situation is different. Consent can be
                  withdrawn at any time, and we will remove the image from the site.
                  Where a photograph shows a child, we seek guardian consent as well as
                  the participant&rsquo;s own.
                </p>
              </>
            ),
          },
          {
            id: "data",
            heading: "How we handle participant data",
            body: (
              <p>
                We record only what we need to deliver programmes and keep children
                safe. Participant records are access-controlled, held separately from
                marketing data, and never used for fundraising without specific,
                  recorded consent.
              </p>
            ),
          },
          {
            id: "complaints",
            heading: "Complaints about this policy",
            body: (
              <p>
                If you believe this policy is not being followed, or that a concern was
                mishandled, raise it through the{" "}
                <Link href="/contact"
                  className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4"
                >
                  contact page
                </Link>
                . Complaints are handled separately from safeguarding reports, by
                someone not involved in the original decision where that is possible.
              </p>
            ),
          },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Legal", path: "/legal/safeguarding" },
              { name: "Safeguarding policy", path: "/legal/safeguarding" },
            ]),
          ]),
        }}
      />
    </>
  );
}
