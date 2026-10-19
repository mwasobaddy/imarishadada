import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { PROSE_PAGES, type ProsePage } from "@/lib/data/pages";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * Renders the long-form prose pages (partner, volunteer, transparency, annual
 * report, news) from one component.
 *
 * These five pages share a structure — masthead, a few sections of prose, an
 * optional CTA — and differ only in content. Five near-identical page files
 * would drift apart on spacing and heading levels; one renderer keeps them
 * consistent and means a fix lands everywhere at once.
 *
 * Content lives in `lib/data/pages.ts`. Anything needing a database row or an
 * admin override does not belong there.
 */

export function proseMetadata(page: ProsePage): Metadata {
  return {
    title: page.title,
    description: page.lede.slice(0, 160),
    alternates: {
      canonical: `/${page.slug}`,
      languages: { "en-KE": `/${page.slug}`, "x-default": `/${page.slug}` },
    },
    openGraph: {
      type: "article",
      url: `/${page.slug}`,
      locale: "en_KE",
      title: `${page.title} | Imarisha Dada`,
      description: page.lede.slice(0, 160),
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Imarisha Dada`,
      description: page.lede.slice(0, 160),
    },
  };
}

export function ProseRoute({ slug }: { slug: string }) {
  const page = PROSE_PAGES[slug];
  if (!page) throw new Error(`No prose page registered for "${slug}"`);

  return (
    <>
      <main id="main">
        <PageHero eyebrow={page.eyebrow} heading={page.title} body={page.lede} />

        {/*
          A page flagged `draft` says so on the page, not only in the code. These
          are real routes the navigation links to, and a visitor arriving at an
          empty annual report deserves to know it is being prepared rather than
          discovering that from an absence.
        */}
        {page.draft ? (
          <Container className="pb-8">
            <p
              role="note"
              className="max-w-2xl rounded-xl border-2 border-dashed border-brand-600/40 bg-surface-lilac p-5 text-sm leading-relaxed text-ink-muted"
            >
              <span className="font-semibold text-brand-600">
                In preparation.
              </span>{" "}
              This page is live but incomplete. We would rather show you what we
              intend to publish than leave a link in the navigation going nowhere.
            </p>
          </Container>
        ) : null}

        <Container className="py-section">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
                On this page
              </h2>
              <ol className="mt-4 space-y-2">
                {page.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-sm text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="max-w-2xl space-y-12">
              {page.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight text-brand-600">
                    {section.heading}
                  </h2>

                  {section.paragraphs?.map((text) => (
                    <p key={text.slice(0, 32)} className="measure mt-4 leading-relaxed text-ink-muted">
                      {text}
                    </p>
                  ))}

                  {section.bullets ? (
                    <ul className="measure mt-4 list-disc space-y-2 pl-5 leading-relaxed text-ink-muted">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              {page.cta ? (
                <div className="rounded-2xl border border-brand-600/30 bg-brand-50 p-8">
                  <Link
                    href={page.cta.href}
                    className="inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                  >
                    {page.cta.label}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: page.title,
              description: page.lede.slice(0, 200),
              url: absoluteUrl(`/${page.slug}`),
              inLanguage: "en-KE",
            },
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: page.title, path: `/${page.slug}` },
            ]),
          ]),
        }}
      />
    </>
  );
}
