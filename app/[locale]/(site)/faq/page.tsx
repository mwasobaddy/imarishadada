import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { FAQS } from "@/lib/data/pages";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * FAQ — `/faq`.
 *
 * Emits `FAQPage` structured data, which is what makes these eligible for
 * rich results. The markup is a plain `<dl>` rather than a JS accordion so the
 * content is in the server-rendered HTML and works without hydration — the
 * spec is firm that indexable text must not be client-only.
 */

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about giving, our programmes in Kibera, how we work, and how we protect the girls we serve.",
  alternates: {
    canonical: "/faq",
    languages: { "en-KE": "/faq", "x-default": "/faq" },
  },
  openGraph: {
    type: "website",
    url: "/faq",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Frequently asked questions | Imarisha Dada",
    description: "Answers about giving, our programmes, and safeguarding.",
  },
};

const GROUPS = ["Giving", "Programmes", "About us", "Safeguarding"] as const;

export default async function FaqPage({
  params,
}: PageProps<"/[locale]/faq">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl("/faq"),
    inLanguage: "en-KE",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <main id="main">
        <PageHero
          eyebrow="Questions"
          heading="The things people ask us most"
          body="If your question is not here, message us and we will answer it and probably add it."
        />

        <Container className="py-section">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="Jump to a section" className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold tracking-wide text-ink uppercase">
                Sections
              </p>
              <ul className="mt-4 space-y-2">
                {GROUPS.map((group) => (
                  <li key={group}>
                    <a
                      href={`#${group.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    >
                      {group}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="max-w-2xl space-y-12">
              {GROUPS.map((group) => {
                const entries = FAQS.filter((f) => f.group === group);
                if (entries.length === 0) return null;
                const id = group.toLowerCase().replace(/\s+/g, "-");

                return (
                  <section key={group} id={id} className="scroll-mt-24">
                    <h2 className="text-2xl font-semibold tracking-tight text-brand-600">
                      {group}
                    </h2>

                    <dl className="mt-6 space-y-4">
                      {entries.map((faq) => (
                        <div
                          key={faq.question}
                          className="rounded-card border border-border bg-card p-6"
                        >
                          <dt className="text-lg font-semibold text-ink">{faq.question}</dt>
                          <dd className="measure mt-2 leading-relaxed text-ink-muted">
                            {faq.answer}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                );
              })}

              <div className="rounded-2xl border border-brand-600/30 bg-brand-50 p-8">
                <h2 className="text-xl font-semibold text-brand-600">
                  Still have a question?
                </h2>
                <p className="measure mt-2 text-ink-muted">
                  WhatsApp is the fastest way to reach us in Kenya, and we read every
                  message.
                </p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                >
                  Ask us
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "FAQ", path: "/faq" },
            ]),
          ]),
        }}
      />
    </>
  );
}
