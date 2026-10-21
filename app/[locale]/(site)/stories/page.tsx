import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { PageHero } from "@/components/site/page-hero";
import { LadiesRoom } from "@/components/stories/sections";
import { Container } from "@/components/site/container";
import { ClosingCta } from "@/components/sections/closing-cta";
import { ConsentLedger, ConsentNote } from "@/components/stories/consent";
import { FeaturedStoryCard } from "@/components/stories/featured-story";
import { StoryGrid } from "@/components/stories/story-grid";
import { getConsentCounts, getStories, getStoriesSections } from "@/lib/data/impact";
import { getProgrammes } from "@/lib/data/home";
import { getSocialLinks } from "@/lib/data/social";
import { isVisible } from "@/lib/data/sections";
import type { SiteSection } from "@/lib/data/types";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Stories index — `/stories`.
 *
 * The spec's framing: a consent-managed archive is *"rarer and more credible
 * than an archive with 40 portraits of unnamed children"*. That is why the
 * consent ledger sits in the masthead, above the first photograph, rather than
 * in a policy nobody opens.
 *
 * ## What is outside the Suspense boundary
 *
 * The hero, the ledger and the consent note do not depend on `searchParams`, so
 * they are prerendered into the static shell. Only the feed — which reads the
 * `?programme=` filter — streams. That keeps the `<h1>` and the consent
 * statement in the initial HTML rather than behind a loading state.
 */

const TITLE = "Stories";
const DESCRIPTION =
  "Stories from the girls and young women in our programmes in Kibera, Nairobi — published only with recorded consent, and only as much of each story as the participant agreed to share.";

export async function generateMetadata({
  searchParams,
}: PageProps<"/[locale]/stories">): Promise<Metadata> {
  const sp = await searchParams;
  const programme = typeof sp.programme === "string" ? sp.programme : null;

  // Filtered URLs are indexable in their own right — each shows a different set
  // of stories. Give them a self-referencing canonical and hreflang so search
  // engines do not flag "no self-referencing hreflang".
  const path = programme ? `/stories?programme=${programme}` : "/stories";

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: path,
      languages: { "en-KE": path, "x-default": path },
    },
    openGraph: {
      type: "website",
      url: path,
      locale: "en_KE",
      images: ["/opengraph-image"],
      title: "Stories | Imarisha Dada",
      description: DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: "Stories | Imarisha Dada",
      description: DESCRIPTION,
    },
  };
}

/**
 * The filtered feed.
 *
 * All stories are fetched once and filtered here rather than issuing a query per
 * filter. Two reasons: the filter counts have to be accurate for every
 * programme, and one cache entry beats N.
 */
async function StoriesFeed({
  searchParams,
  programmes,
  sections,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  programmes: { slug: string; title: string }[];
  sections: Record<string, SiteSection>;
}) {
  const params = await searchParams;
  const requested = typeof params.programme === "string" ? params.programme : null;

  const all = await getStories();
  const stories = requested ? all.filter((s) => s.programmeSlug === requested) : all;

  // The featured story leads, and is then removed from the grid so the same
  // card is not printed twice. Only when there is something left to show —
  // a "featured" card above an empty grid is worse than a plain grid of one.
  const featured =
    stories.length > 1 ? (stories.find((s) => s.featured) ?? stories[0]!) : null;
  const rest = featured ? stories.filter((s) => s.slug !== featured.slug) : stories;

  const countsFor = (slug: string | null) =>
    slug ? all.filter((s) => s.programmeSlug === slug).length : all.length;

  const featuredSection = sections["stories-featured"];

  return (
    <>
      {/* Plain links rather than tabs, so each filter is a real URL. A tab state
          that cannot be shared or bookmarked is worse than a query param. */}
      <section aria-labelledby="filter-heading" className="border-b border-border bg-surface py-6">
        <Container>
          <h2 id="filter-heading" className="sr-only">
            Filter stories by programme
          </h2>
          <nav className="flex flex-wrap gap-3" aria-label="Filter by programme">
            <Link
              href="/stories"
              aria-current={requested ? undefined : "page"}
              className={
                requested
                  ? "inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600"
                  : "inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-600 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600"
              }
            >
              All stories
              <span className="tabular text-xs opacity-60">{countsFor(null)}</span>
            </Link>

            {programmes.map((programme) => {
              const active = requested === programme.slug;
              return (
                <Link
                  key={programme.slug}
                  href={`/stories?programme=${programme.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-600 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600"
                      : "inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600"
                  }
                >
                  {programme.title}
                  <span className="tabular text-xs opacity-60">
                    {countsFor(programme.slug)}
                  </span>
                </Link>
              );
            })}
          </nav>
        </Container>
      </section>

      {featured && isVisible(featuredSection) ? (
        <section aria-labelledby="featured-heading" className="py-section bg-surface">
          <Container>
            <h2
              id="featured-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {featuredSection.heading}
            </h2>
            <div className="mt-8">
              <FeaturedStoryCard story={featured} />
            </div>
          </Container>
        </section>
      ) : null}

      <StoryGrid
        stories={rest}
        section={sections["stories-grid"]}
        emptySection={sections["stories-empty"]}
      />
    </>
  );
}

export default async function StoriesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/stories">) {
  const { locale } = await params;

  // Pin the locale for static rendering. See the note in
  // `app/[locale]/layout.tsx`: this must run in the page, because a layout body
  // executes after the page it wraps.
  setRequestLocale(locale);

  const [sections, counts, programmes] = await Promise.all([
    getStoriesSections(),
    getConsentCounts(),
    getProgrammes(),
  ]);

  const hero = sections["stories-hero"];
  const consent = sections["stories-consent"];
  const ladiesRoom = sections["stories-ladies-room"];
  const [t, links] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getSocialLinks(),
  ]);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Stories from Kibera",
    url: absoluteUrl("/stories"),
    inLanguage: "en-KE",
    description: DESCRIPTION,
    isPartOf: { "@type": "WebSite", name: "Imarisha Dada", url: absoluteUrl("/") },
    // No `about` list of stories here. Enumerating them would put a name into
    // structured data on a page where an anonymised story may sit beside a
    // named one, and the two must not be conflated by a crawler.
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body}>
            <ConsentLedger counts={counts} />
          </PageHero>
        ) : null}

        <Suspense
          // Neutral: the page exists, the filter is being applied.
          fallback={
            <div className="bg-surface py-section">
              <Container>
                <p className="text-ink-muted" role="status">
                  Loading stories…
                </p>
              </Container>
            </div>
          }
        >
          <StoriesFeed
            searchParams={searchParams}
            programmes={programmes.map((p) => ({ slug: p.slug, title: p.title }))}
            sections={sections}
          />
        </Suspense>

        {isVisible(consent) ? <ConsentNote counts={counts} section={consent} /> : null}

        {/*
          The storytelling programme. It sits after the consent note on
          purpose: the podcast runs on the same rule as the written stories
          — a young mother tells her own story, and the platform does not
          decide what she is allowed to have said.
        */}
        {isVisible(ladiesRoom) ? (
          <LadiesRoom section={ladiesRoom} links={links} linksLabel={t("findUs")} />
        ) : null}
      </main>

      <ClosingCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            collectionJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Stories", path: "/stories" },
            ]),
          ]),
        }}
      />
    </>
  );
}
