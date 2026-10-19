import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { ConsentNote, StoryGrid } from "@/components/sections/story-grid";
import { getConsentCounts, getStories } from "@/lib/data/impact";
import { getProgrammes } from "@/lib/data/home";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Stories index — `/stories`.
 *
 * The spec's framing: a consent-managed archive is "rarer and more credible than
 * an archive with 40 portraits". That is why the consent breakdown sits on this
 * page rather than being buried in a policy nobody opens.
 */

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Stories from the girls and young women in our programmes in Kibera, published only with recorded consent.",
  alternates: {
    canonical: "/stories",
    languages: { "en-KE": "/stories", "x-default": "/stories" },
  },
  openGraph: {
    type: "website",
    url: "/stories",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Stories | Imarisha Dada",
    description: "Stories from Kibera, published only with recorded consent.",
  },
};

async function StoriesBody({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = typeof params.programme === "string" ? params.programme : null;

  const [stories, counts, programmes] = await Promise.all([
    getStories(requested ?? undefined),
    getConsentCounts(),
    getProgrammes(),
  ]);

  return (
    <>
      <main id="main">
        <PageHero
          eyebrow="Stories"
          heading="Their words, on their terms."
          body="We publish a story only when consent is recorded, and the tier decides what appears. Some stories carry a name. Some do not. All of them are real."
        />

        {/* Plain links rather than tabs, so each filter is a real URL. A tab state
            that cannot be shared or bookmarked is worse than a query param. */}
        <section aria-labelledby="filter-heading" className="bg-surface py-8">
          <Container>
            <h2 id="filter-heading" className="sr-only">
              Filter stories by programme
            </h2>
            <nav className="flex flex-wrap gap-3" aria-label="Filter by programme">
              <Link
                href="/stories"
                aria-current={requested ? undefined : "page"}
                className={`inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-medium ${
                  requested
                    ? "border-border bg-card text-ink-muted"
                    : "border-brand-600 bg-brand-50 text-brand-600"
                }`}
              >
                All stories
              </Link>
              {programmes.map((programme) => {
                const active = requested === programme.slug;
                return (
                  <Link
                    key={programme.slug}
                    href={`/stories?programme=${programme.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-medium ${
                      active
                        ? "border-brand-600 bg-brand-50 text-brand-600"
                        : "border-border bg-card text-ink-muted"
                    }`}
                  >
                    {programme.title}
                  </Link>
                );
              })}
            </nav>
          </Container>
        </section>

        <section aria-labelledby="stories-heading" className="py-section bg-surface">
          <Container>
            <h2 id="stories-heading" className="sr-only">
              {requested
                ? `Stories from ${programmes.find((p) => p.slug === requested)?.title ?? requested}`
                : "All stories"}
            </h2>

            {stories.length > 0 ? (
              <StoryGrid stories={stories} />
            ) : (
              <div className="rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
                <p className="text-lg font-semibold text-brand-600">
                  No stories published here yet
                </p>
                <p className="measure mx-auto mt-2 text-ink-muted">
                  We publish a story only when the participant has given recorded
                  consent and we are certain the consent covers it. This space fills as
                  stories are cleared and not before.
                </p>
                <Link
                  href="/programmes"
                  className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                >
                  See the programmes instead
                </Link>
              </div>
            )}
          </Container>
        </section>

        <ConsentNote counts={counts} />
      </main>
    </>
  );
}

export default async function StoriesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/stories">) {
  const { locale } = await params;

  // Pin the locale for static rendering. See the note in
  // `app/[locale]/layout.tsx`: this must run in the page, because
  // a layout body executes after the page it wraps.
  setRequestLocale(locale);

  return (
    <>
      <Suspense
        // Neutral: the page exists, the filter is being applied.
        fallback={
          <main id="main" className="bg-surface py-section">
            <Container>
              <p className="text-ink-muted" role="status">
                Loading stories…
              </p>
            </Container>
          </main>
        }
      >
        <StoriesBody searchParams={searchParams} />
      </Suspense>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Stories", path: "/stories" },
            ]),
          ),
        }}
      />
    </>
  );
}
