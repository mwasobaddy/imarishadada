import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { LegalPage, NeedsSignOff } from "@/components/legal/legal-page";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Terms of use — `/legal/terms`.
 *
 * The roadmap flags the refund position specifically: "Donation refunds are a
 * real operational decision, not boilerplate... a generous policy on the website
 * that the team will not honour is worse than a clear one."
 *
 * So the refund position carries a sign-off block rather than an invented
 * promise. Everything else is standard and safe to state.
 */

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The terms that apply when you use this website or donate to Imarisha Dada. Donations, payments, acceptable use, liability, and governing law.",
  alternates: {
    canonical: "/legal/terms",
    languages: { "en-KE": "/legal/terms", "x-default": "/legal/terms" },
  },
  openGraph: {
    type: "article",
    url: "/legal/terms",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Terms of use | Imarisha Dada",
    description: "The terms that apply when you use this website or donate to us.",
  },
};

const REVIEWED = "2026-10-18";

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/legal/terms">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of use",
    url: absoluteUrl("/legal/terms"),
    dateModified: REVIEWED,
    inLanguage: "en-KE",
  };

  return (
    <>
      <LegalPage
        title="Terms of use"
        updated={REVIEWED}
        intro={
          <p>
            By using this website or making a donation you accept these terms. They
            are written to be read, not to be agreed without reading.
          </p>
        }
        sections={[
          {
            id: "acceptance",
            heading: "Acceptance",
            body: (
              <p>
                These terms apply to everyone who uses imarishadada.org or donates to
                Imarisha Dada. If you do not accept them, please do not use the site.
                We may update these terms; the date at the top of this page shows when
                they were last reviewed.
              </p>
            ),
          },
          {
            id: "donations",
            heading: "Donations",
            body: (
              <>
                <p>
                  Donations are voluntary and made to a registered non-profit
                  organisation in Kenya. You are responsible for the accuracy of the
                  details you give us, because we use them to issue your receipt.
                </p>
                <p>
                  Recurring gifts continue until you cancel them. You can cancel at
                  any time by contacting us, and we will confirm the date from which
                  further payments will stop.
                </p>
                <NeedsSignOff>
                  <p>
                    Our refund position has not yet been confirmed by counsel and is
                    therefore not stated here. It will be published once decided,
                    before this page is treated as final.
                  </p>
                  <p className="mt-2">
                    We would rather leave this blank than publish a promise the team
                    cannot keep.
                  </p>
                </NeedsSignOff>
              </>
            ),
          },
          {
            id: "payments",
            heading: "Payments",
            body: (
              <>
                <p>
                  Card payments are processed by Stripe and M-Pesa payments by
                  Safaricom and Airtel. We never see or store your full card details.
                </p>
                <p>
                  Processing fees are shown to you before you pay, so the amount that
                  leaves your account is never a surprise.
                </p>
                <p>
                  A donation is treated as complete when our payment provider confirms
                  it. If a payment fails, you have not been charged. See the{" "}
                  <Link href="/donate/failure" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                    payment failure page
                  </Link>{" "}
                  for what to do next.
                </p>
              </>
            ),
          },
          {
            id: "receipts",
            heading: "Receipts and tax",
            body: (
              <p>
                A receipt is issued for every donation. Whether a donation is tax
                deductible depends on your country and on our registration status, and
                we will tell you the truth about it rather than imply a benefit we
                cannot deliver. Questions about tax treatment go to our{" "}
                <Link href="/contact" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                  contact page
                </Link>
                .
              </p>
            ),
          },
          {
            id: "content",
            heading: "Content and intellectual property",
            body: (
              <p>
                The words, design, logo and code of this site belong to Imarisha Dada
                unless stated otherwise. You may share and link to our pages and
                quote short extracts with attribution. You may not reproduce our
                material commercially without permission.
              </p>
            ),
          },
          {
            id: "acceptable-use",
            heading: "Acceptable use",
            body: (
              <>
                <p>You agree not to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>submit false or misleading information through our forms;</li>
                  <li>
                    attempt to gain unauthorised access to the site or its underlying
                    data;
                  </li>
                  <li>
                    use the contact form to send bulk or unsolicited commercial
                    messages;
                  </li>
                  <li>
                    use the site in a way that harms participants, staff, or the
                    organisation.
                  </li>
                </ul>
              </>
            ),
          },
          {
            id: "safeguarding",
            heading: "Safeguarding",
            body: (
              <p>
                If you send us a safeguarding concern, our{" "}
                <Link href="/legal/safeguarding" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                  safeguarding policy
                </Link>{" "}
                applies, including how we handle confidentiality. Please do not send
                safeguarding details through a general enquiry.
              </p>
            ),
          },
          {
            id: "liability",
            heading: "Limitation of liability",
            body: (
              <p>
                We take care to keep this site accurate and available, but we do not
                guarantee that it will be uninterrupted or error-free. To the extent
                the law allows, we are not liable for loss arising from your use of
                this site. Nothing here limits our liability for fraud, for injury
                caused by our negligence, or for anything else that cannot lawfully be
                limited.
              </p>
            ),
          },
          {
            id: "law",
            heading: "Governing law",
            body: (
              <p>
                These terms are governed by the laws of Kenya, and the courts of Kenya
                have jurisdiction over any dispute arising from them.
              </p>
            ),
          },
          {
            id: "changes",
            heading: "Changes to these terms",
            body: (
              <p>
                We may update these terms from time to time. The review date at the top
                of this page always reflects the current version, and material changes
                affecting donations will be announced on the site.
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
              { name: "Legal", path: "/legal/terms" },
              { name: "Terms of use", path: "/legal/terms" },
            ]),
          ]),
        }}
      />
    </>
  );
}
