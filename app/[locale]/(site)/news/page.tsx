import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import { PostCard } from "@/components/news/post-card";
import { NewsEmpty } from "@/components/news/sections";
import { Container } from "@/components/site/container";
import { PageHero } from "@/components/site/page-hero";
import { getFeaturedPost, getNewsCategoriesInUse, getNewsPage, getNewsSections } from "@/lib/data/news";
import { isVisible } from "@/lib/data/sections";
import type { SiteSection } from "@/lib/data/types";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { NEWS_CATEGORIES, categoryLabel, isNewsCategory, type NewsCategory } from "@/lib/news/vocabulary";

/**
 * News index — `/news`.
 *
 * ## What is outside the Suspense boundary
 *
 * The heading and the structured data do not depend on the URL, so they are
 * prerendered into the static shell. The list reads `?category=` and `?before=`,
 * so it streams from inside a boundary. This is the same split the stories index
 * uses, and it is the only arrangement `cacheComponents` accepts for a page that
 * reads `searchParams`.
 *
 * ## Filters are real URLs
 *
 * `/news?category=announcement` is server-rendered, so a crawler and a shared link
 * both get the filtered list. Nothing here filters on the client.
 *
 * ## Pagination is a cursor
 *
 * `?before=` carries the publish time of the last post shown. A post published
 * while a reader is paging cannot push another post off the page.
 *
 * ## What is not on this page
 *
 * The newsletter. The roadmap requires double opt-in, one-click unsubscribe and a
 * legal review of the consent wording, and none of that exists yet. A signup box
 * that stores an address with no confirmation would be the thing the roadmap warns
 * against, so it is left out rather than half built.
 */

const TITLE = "News and Updates from Kibera";
const DESCRIPTION =
  "Updates, announcements and stories from Imarisha Dada's work with girls and young women in Kibera, Nairobi, Kenya.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/news",
    languages: { "en-KE": "/news", "x-default": "/news" },
  },
  openGraph: {
    type: "website",
    url: "/news",
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

function listHref(category: NewsCategory | undefined, before?: string): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (before) params.set("before", before);
  const query = params.toString();
  return query ? `/news?${query}` : "/news";
}

export default async function NewsPage({ params, searchParams }: PageProps<"/[locale]/news">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = await getNewsSections();
  const hero = sections["news-hero"];
  const empty = sections["news-empty"];

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    url: absoluteUrl("/news"),
    inLanguage: "en-KE",
    description: DESCRIPTION,
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body} />
        ) : null}

        <Suspense
          fallback={
            <section aria-busy="true" className="bg-surface py-section">
              <Container>
                <p className="text-sm text-ink-muted">Loading posts…</p>
              </Container>
            </section>
          }
        >
          <NewsFeed searchParams={searchParams} empty={empty} />
        </Suspense>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            collectionJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "News", path: "/news" },
            ]),
          ]),
        }}
      />
    </>
  );
}

async function NewsFeed({
  searchParams,
  empty,
}: {
  searchParams: PageProps<"/[locale]/news">["searchParams"];
  empty: SiteSection | undefined;
}) {
  const query = await searchParams;

  // Anything that is not a known category or a date is ignored, not passed through.
  const category = isNewsCategory(query.category) ? query.category : undefined;
  const before =
    typeof query.before === "string" && !Number.isNaN(Date.parse(query.before))
      ? query.before
      : undefined;

  const [page, featured, inUse] = await Promise.all([
    getNewsPage({ category, before }),
    // The featured post leads the first page only, and only when nothing is filtered.
    !before && !category ? getFeaturedPost() : Promise.resolve(null),
    getNewsCategoriesInUse(),
  ]);

  const gridPosts = featured ? page.posts.filter((p) => p.slug !== featured.slug) : page.posts;
  const hasAnything = Boolean(featured) || page.posts.length > 0;
  const filters = NEWS_CATEGORIES.filter((c) => inUse.includes(c.value));

  return (
    <>
      {filters.length > 0 ? (
        <nav aria-label="News categories" className="border-b border-border bg-surface">
          <Container>
            <ul className="flex flex-wrap gap-2 py-4">
              <li>
                <FilterLink href="/news" active={!category}>
                  All
                </FilterLink>
              </li>
              {filters.map((c) => (
                <li key={c.value}>
                  <FilterLink href={listHref(c.value)} active={category === c.value}>
                    {c.label}
                  </FilterLink>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      ) : null}

      <section aria-label="Posts" className="bg-surface py-section">
        <Container>
          {hasAnything ? (
            <>
              {featured && !category && !before ? (
                <div className="mb-10">
                  <p className="mb-4 text-sm font-medium tracking-wide text-brand-600 uppercase">
                    Featured · {categoryLabel(featured.category)}
                  </p>
                  <div className="max-w-4xl">
                    <PostCard post={featured} featured />
                  </div>
                </div>
              ) : null}

              {gridPosts.length > 0 ? (
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <li key={post.slug}>
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>
              ) : null}

              {page.nextCursor ? (
                <div className="mt-12 flex justify-center">
                  <Link
                    href={listHref(category, page.nextCursor)}
                    className="inline-flex min-h-11 items-center rounded-full border border-brand-600 px-6 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                  >
                    Older posts
                  </Link>
                </div>
              ) : null}
            </>
          ) : empty && isVisible(empty) ? (
            // Never an empty grid. Shown when nothing is published, and when a
            // filter or a page is pointed at nothing.
            <NewsEmpty section={empty} />
          ) : null}
        </Container>
      </section>
    </>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
        active
          ? "bg-brand-600 text-brand-50"
          : "border border-border bg-card text-ink-muted hover:border-brand-600 hover:text-brand-600"
      }`}
    >
      {children}
    </Link>
  );
}
