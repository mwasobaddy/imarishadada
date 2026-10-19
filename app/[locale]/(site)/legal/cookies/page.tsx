import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { LegalPage } from "@/components/legal/legal-page";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Cookie notice — `/legal/cookies`.
 *
 * Written to describe what we *actually* set, which right now is: nothing
 * beyond what the site needs to function. The roadmap makes this page
 * conditional ("if any non-essential cookies are used"), so publishing an honest
 * "we do not use them" is more useful than omitting it — and the privacy notice
 * links here, so a 404 would be worse.
 *
 * If analytics is added later, this page must be updated in the same change,
 * not afterwards. An out-of-date cookie notice is a compliance failure.
 */

export const metadata: Metadata = {
  title: "Cookie notice",
  description:
    "What cookies and similar technologies this site uses, and what it does not.",
  alternates: {
    canonical: "/legal/cookies",
    languages: { "en-KE": "/legal/cookies", "x-default": "/legal/cookies" },
  },
  openGraph: {
    type: "article",
    url: "/legal/cookies",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Cookie notice | Imarisha Dada",
    description: "What cookies this site uses, and what it does not.",
  },
};

const REVIEWED = "2026-10-18";

export default async function CookiesPage({
  params,
}: PageProps<"/[locale]/legal/cookies">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Cookie notice",
    url: absoluteUrl("/legal/cookies"),
    dateModified: REVIEWED,
    inLanguage: "en-KE",
  };

  return (
    <>
      <LegalPage
        title="Cookie notice"
        updated={REVIEWED}
        intro={
          <p>
            This site does not use advertising cookies, cross-site tracking, or any
            third-party embed that would share your visit with another company. This
            page explains what that means in practice.
          </p>
        }
        sections={[
          {
            id: "what-we-use",
            heading: "What this site uses",
            body: (
              <>
                <p>
                  Strictly what is needed for the site to work, and nothing that
                  identifies you across other websites:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong className="text-ink">Session and security cookies</strong>{" "}
                    &mdash; set by our hosting to protect form submissions and
                    donations from cross-site request forgery. These expire when you
                    close the browser.
                  </li>
                  <li>
                    <strong className="text-ink">Any measurement, if we add it</strong>{" "}
                    &mdash; we do not currently run analytics. If we introduce
                    consent-based analytics, this page will be updated in the same
                    change and you will be asked before anything is set.
                  </li>
                </ul>
              </>
            ),
          },
          {
            id: "what-we-dont",
            heading: "What we deliberately do not use",
            body: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Advertising or retargeting cookies.</li>
                <li>Third-party analytics that profile you across other sites.</li>
                <li>
                  Embedded maps, video players, or social widgets. A single embed
                  sends your IP address to that company without you doing anything.
                </li>
                <li>
                  Donation or payment cookies. Your card details never touch our
                  servers at all &mdash; they go straight to the payment processor.
                </li>
              </ul>
            ),
          },
          {
            id: "control",
            heading: "Controlling cookies",
            body: (
              <>
                <p>
                  Your browser can block or delete cookies at any time. Because we set
                  only those needed for forms and payments to work, blocking them will
                  stop those two things from functioning &mdash; the rest of the site
                  will read normally.
                </p>
                <p>
                  If a donation appears not to go through with cookies blocked, that
                  is almost certainly why. Contact us and we will take your gift
                  another way.
                </p>
              </>
            ),
          },
          {
            id: "contact",
            heading: "Questions",
            body: (
              <p>
                Ask us anything about this page through the{" "}
                <Link href="/contact"
                  className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4"
                >
                  contact page
                </Link>
                . Our wider{" "}
                <Link href="/legal/privacy"
                  className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4"
                >
                  privacy notice
                </Link>{" "}
                covers the data side of the same question.
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
              { name: "Legal", path: "/legal/cookies" },
              { name: "Cookie notice", path: "/legal/cookies" },
            ]),
          ]),
        }}
      />
    </>
  );
}
