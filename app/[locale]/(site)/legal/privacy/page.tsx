import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { LegalPage, NeedsSignOff } from "@/components/legal/legal-page";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Privacy notice — `/legal/privacy`.
 *
 * The roadmap is blunt about two things this page must not fudge:
 *
 *   * "Recipients and processors — **name them**"
 *   * "Be honest about transfers... Vague 'we use secure services' language is
 *     both legally weak and a trust negative — particularly to European donors."
 *
 * So the processors we can name are named, the ones we cannot yet confirm carry
 * a sign-off block rather than a reassuring phrase, and the retention periods
 * that are genuinely undecided are marked as such.
 */

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What personal data Imarisha Dada collects, why, who we share it with, how long we keep it, and how to exercise your rights.",
  alternates: {
    canonical: "/legal/privacy",
    languages: { "en-KE": "/legal/privacy", "x-default": "/legal/privacy" },
  },
  openGraph: {
    type: "article",
    url: "/legal/privacy",
    locale: "en_KE",
    title: "Privacy notice | Imarisha Dada",
    description: "What we collect, why, who we share it with, and how to exercise your rights.",
  },
};

const REVIEWED = "2026-10-18";

/** Processors we can name today. Anything uncertain is flagged rather than vague. */
const PROCESSORS = [
  {
    name: "Supabase",
    role: "Database and file storage. Holds donor records, contact enquiries and programme content.",
    location: "Supabase (US/EU regions) — see transfers below",
  },
  {
    name: "Stripe (payment processing)",
    role: "Card payments. Processes your card details.",
    location: "United States",
  },
  {
    name: "Safaricom / Airtel (M-Pesa Daraja)",
    role: "M-Pesa payments. Receives your phone number and the payment instruction.",
    location: "Kenya",
  },
  {
    name: "Vercel",
    role: "Website hosting. Receives request logs including IP addresses.",
    location: "United States / Europe",
  },
];

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/legal/privacy">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy notice",
    url: absoluteUrl("/legal/privacy"),
    dateModified: REVIEWED,
    inLanguage: "en-KE",
  };

  return (
    <>
      <LegalPage
        title="Privacy notice"
        updated={REVIEWED}
        intro={
          <p>
            This explains what happens to your personal data when you use this site,
            donate to us, or contact us. We collect as little as we can get away with,
            and we do not sell or rent your data to anyone.
          </p>
        }
        sections={[
          {
            id: "collect",
            heading: "What we collect",
            body: (
              <>
                <div className="min-w-0 overflow-x-auto">
                  <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Personal data collected, why, our lawful basis, and how long we keep it
                    </caption>
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className="py-2 pr-4 font-semibold text-ink">
                          Data
                        </th>
                        <th scope="col" className="py-2 pr-4 font-semibold text-ink">
                          Why
                        </th>
                        <th scope="col" className="py-2 pr-4 font-semibold text-ink">
                          Basis
                        </th>
                        <th scope="col" className="py-2 font-semibold text-ink">
                          Kept for
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Donor name, email, phone", "Receipt and donor communication", "Consent / contract", "7 years (accounting)"],
                        ["Payment references", "Accounting and reconciliation", "Legal obligation", "7 years (accounting)"],
                        ["M-Pesa phone number", "Sending the payment prompt", "Consent", "Duration of the donation + 7 years"],
                        ["Newsletter email", "Programme updates", "Consent", "Until you unsubscribe"],
                        ["Contact form message", "Responding to your enquiry", "Consent", "24 months"],
                        ["Volunteer application", "Recruitment and safeguarding", "Consent", "12 months, then deleted unless you are placed"],
                        ["Website analytics", "Understanding how the site is used", "Consent", "14 months"],
                        ["Participant data", "Delivering programmes and keeping children safe", "Consent", "See the safeguarding policy"],
                      ].map((row) => (
                        <tr key={row[0]} className="border-b border-border/60">
                          <th scope="row" className="py-3 pr-4 font-medium text-ink">
                            {row[0]}
                          </th>
                          <td className="py-3 pr-4">{row[1]}</td>
                          <td className="py-3 pr-4">{row[2]}</td>
                          <td className="py-3">{row[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4">
                  We do not collect postal addresses, dates of birth, or ID numbers.
                  We do not need them for an e-receipt, and not collecting them reduces
                  the risk of holding data we have no use for.
                </p>
              </>
            ),
          },
          {
            id: "children",
            heading: "Children&rsquo;s data",
            body: (
              <>
                <p>
                  We work with children aged 9 and over. Data about them is collected
                  only for the purpose of running the programme they are in, and only
                  with recorded consent.
                </p>
                <p>
                  Participant records are held separately from any fundraising data. We
                  never use a child&rsquo;s information to ask anyone for money. Consent
                  given by a child is treated as expiring when she reaches adulthood,
                  and photographs are governed by the consent tiers described in the{" "}
                  <Link href="/legal/safeguarding#photography" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                    safeguarding policy
                  </Link>
                  .
                </p>
              </>
            ),
          },
          {
            id: "processors",
            heading: "Who we share it with",
            body: (
              <>
                <p>
                  We name our processors rather than describing them as &ldquo;secure
                  services&rdquo;. Each one sees only what it needs to do its job:
                </p>
                <ul className="list-disc space-y-3 pl-5">
                  {PROCESSORS.map((p) => (
                    <li key={p.name}>
                      <strong className="text-ink">{p.name}</strong> — {p.role}{" "}
                      <span className="text-ink-muted">({p.location})</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  We do not sell or share your data for anyone else&rsquo;s marketing.
                </p>
              </>
            ),
          },
          {
            id: "transfers",
            heading: "International transfers",
            body: (
              <>
                <NeedsSignOff>
                  <p>
                    Some of our processors are hosted outside Kenya — in the United
                    States and Europe. We will confirm the exact regions our data sits
                    in and state them here plainly, rather than relying on a general
                    assurance.
                  </p>
                  <p className="mt-2">
                    This matters particularly for European donors, and &ldquo;we use
                    secure services&rdquo; is not an acceptable answer.
                  </p>
                </NeedsSignOff>
              </>
            ),
          },
          {
            id: "cookies",
            heading: "Cookies",
            body: (
              <>
                <p>
                  This site sets no advertising or cross-site tracking cookies, and no
                  third-party map or video embeds that would leak your IP address to
                  another company.
                </p>
                <p>
                  Any analytics we use is consent-based and described on the{" "}
                  <Link href="/legal/cookies" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                    cookie notice
                  </Link>
                  .
                </p>
              </>
            ),
          },
          {
            id: "rights",
            heading: "Your rights",
            body: (
              <>
                <p>You can ask us to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>give you a copy of the personal data we hold about you;</li>
                  <li>correct anything that is wrong;</li>
                  <li>delete your data, where we are not required to keep it;</li>
                  <li>stop using your data for a purpose you agreed to;</li>
                  <li>withdraw consent, at any time and without giving a reason.</li>
                </ul>
                <p>
                  Email or use the{" "}
                  <Link href="/contact" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                    contact form
                  </Link>
                  . We respond within 30 days.
                </p>
                <p>
                  We do not sell or share your data for anyone else&rsquo;s marketing,
                  so there is nothing to opt out of.
                </p>
              </>
            ),
          },
          {
            id: "contact",
            heading: "How to reach our data protection contact",
            body: (
              <>
                <NeedsSignOff>
                  <p>
                    A dedicated data protection address has not yet been set up. Until
                    it is, please use the{" "}
                    <Link href="/contact" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
                      contact page
                    </Link>{" "}
                    and ask for the data protection lead. A named, monitored address
                    will be published here once it exists.
                  </p>
                </NeedsSignOff>
              </>
            ),
          },
          {
            id: "complaints",
            heading: "Complaints",
            body: (
              <p>
                If you are unhappy with how we have handled your data, tell us first
                and we will try to fix it. If you would rather go straight to the
                regulator, that is your right and we will not obstruct it. Kenya&rsquo;s
                data protection regulator is the Office of the Data Protection
                Commissioner.
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
              { name: "Legal", path: "/legal/privacy" },
              { name: "Privacy notice", path: "/legal/privacy" },
            ]),
          ]),
        }}
      />
    </>
  );
}
