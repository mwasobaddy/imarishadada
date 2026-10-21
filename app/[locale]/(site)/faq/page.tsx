import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { getFaqGroups, getFaqSections } from "@/lib/data/faqs";
import { isVisible } from "@/lib/data/sections";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * FAQ — `/faq`.
 *
 * ## What changed, and why it mattered
 *
 * This page rendered a static `FAQS` constant from `lib/data/pages.ts` while the
 * admin editor at `/admin/content/faqs` wrote to a `faqs` table that was empty
 * and never read. Adding a question in the admin did nothing.
 *
 * The move to the table also **fixed a false claim**. The constant answered "How
 * do you protect the girls you work with?" with "...and a named safeguarding
 * officer." There is no named safeguarding officer — `/legal/safeguarding` says
 * none has been recorded and `/transparency` lists the appointment as
 * outstanding. The same site told a reader three different things, and this page
 * was the one that was untrue. Migration 0025 corrects it.
 *
 * ## Structured data comes from the same rows
 *
 * `FAQPage` JSON-LD is what makes these eligible for rich results, so it is
 * built from the published entries the page renders — not from a constant that
 * could disagree with them. If a question is unpublished it leaves the markup
 * too, which matters: structured data describing content that is not on the page
 * is a manual-action risk.
 *
 * ## A plain `<dl>`, not an accordion
 *
 * The spec is firm that indexable text must not be client-only, and an accordion
 * that hides answers until a click is exactly that. Everything here is in the
 * server-rendered HTML and works without hydration.
 */

const TITLE = "Frequently asked questions";
const DESCRIPTION =
  "Answers about giving, our programmes in Kibera, how we are registered and run, and how we protect the girls we serve.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/faq",
    languages: { "en-KE": "/faq", "x-default": "/faq" },
  },
  openGraph: {
    type: "website",
    url: "/faq",
    locale: "en_KE",
    images: ["/opengraph-image"],
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
};

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [groups, sections] = await Promise.all([getFaqGroups(), getFaqSections()]);

  const hero = sections["faq-hero"];
  const empty = sections["faq-empty"];
  const contact = sections["faq-contact"];

  const allEntries = groups.flatMap((g) => g.entries);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl("/faq"),
    inLanguage: "en-KE",
    mainEntity: allEntries.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body} />
        ) : null}

        <Container className="py-section">
          {groups.length === 0 ? (
            /* An empty shell would read as a broken page. This says why. */
            isVisible(empty) ? (
              <div className="measure mx-auto max-w-xl rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-8 text-center">
                <h2 className="text-xl font-semibold text-brand-600">
                  {empty.heading}
                </h2>
                {empty.body ? (
                  <p className="mt-3 text-ink-muted">{empty.body}</p>
                ) : null}
              </div>
            ) : null
          ) : (
            <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
              {/* The nav is built from the groups that actually have entries, so
                  a category nobody has written for leaves no dead anchor. */}
              <nav aria-label="Jump to a section" className="lg:sticky lg:top-24 lg:self-start">
                <p className="text-sm font-semibold tracking-wide text-ink uppercase">
                  Sections
                </p>
                <ul className="mt-4 space-y-2">
                  {groups.map((group) => (
                    <li key={group.category}>
                      <a
                        href={`#${group.id}`}
                        className="text-sm text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                      >
                        {group.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="max-w-2xl space-y-12">
                {groups.map((group) => (
                  <section key={group.category} id={group.id} className="scroll-mt-24">
                    <h2 className="text-2xl font-semibold tracking-tight text-brand-600">
                      {group.label}
                    </h2>

                    <dl className="mt-6 space-y-4">
                      {group.entries.map((faq) => (
                        <div
                          key={faq.id}
                          className="rounded-card border border-border bg-card p-6"
                        >
                          <dt className="text-lg font-semibold text-ink">
                            {faq.question}
                          </dt>
                          <dd className="measure mt-2 leading-relaxed text-ink-muted">
                            {faq.answer}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}

                {isVisible(contact) ? (
                  <div className="rounded-2xl border border-brand-600/30 bg-brand-50 p-8">
                    <h2 className="text-xl font-semibold text-brand-600">
                      {contact.heading}
                    </h2>
                    {contact.body ? (
                      <p className="measure mt-2 text-ink-muted">{contact.body}</p>
                    ) : null}
                    {contact.ctaLabel && contact.ctaHref ? (
                      <Link
                        href={contact.ctaHref}
                        className="mt-6 inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                      >
                        {contact.ctaLabel}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
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
