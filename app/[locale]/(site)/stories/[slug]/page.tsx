import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Container } from "@/components/site/container";
import { getStories } from "@/lib/data/impact";
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Story detail — `/stories/[slug]`.
 *
 * Consent is enforced on this route too, not just on the index. A story URL is
 * shareable and ends up in search results, so the detail page is exactly where
 * a consent mistake becomes permanent. The tier is resolved in the data layer
 * and the page simply has no name and no image when the tier forbids them.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = (await getStories()).find((s) => s.slug === slug);
  if (!story) return { title: "Story not found" };

  return {
    title: `Story — ${story.programmeTitle ?? "Imarisha Dada"}`,
    description: story.quote.slice(0, 160),
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      type: "article",
      url: `/stories/${story.slug}`,
      locale: "en_KE",
      title: "A story from Kibera | Imarisha Dada",
      description: story.quote.slice(0, 160),
    },
  };
}

/**
 * Everything that needs the slug lives inside here, including the JSON-LD.
 *
 * The `params` promise is passed down rather than awaited in the page shell:
 * under `cacheComponents`, awaiting `params` above the Suspense boundary blocks
 * prerendering of the whole route.
 */
async function StoryBody({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = (await getStories()).find((s) => s.slug === slug);
  if (!story) notFound();

  const isAnonymised = story.consentTier === "anonymised";

  return (
    <article className="max-w-2xl">
      {story.programmeTitle ? (
        <Link
          href={`/stories?programme=${story.programmeSlug}`}
          className="text-sm font-medium tracking-wide text-brand-600 uppercase hover:underline"
        >
          {story.programmeTitle}
        </Link>
      ) : null}

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl">
        A story from Kibera
      </h1>

      <blockquote className="measure mt-8 border-l-4 border-brand-600/40 pl-6 text-2xl leading-relaxed text-ink">
        {story.quote}
      </blockquote>

      <div className="mt-8 border-t border-border pt-6">
        {isAnonymised ? (
          <p className="text-ink-muted">
            — Name withheld at her request
          </p>
        ) : story.attribution ? (
          <p className="text-ink-muted">
            — {story.attribution}
            <span className="mt-1 block text-sm">
              Name used with written consent.
              {story.consentTier === "named_no_face"
                ? " Photograph not published — consent did not cover it."
                : ""}
            </span>
          </p>
        ) : null}
      </div>

      <p className="mt-10 rounded-xl border border-border bg-surface-lilax p-5 text-sm leading-relaxed text-ink-muted">
        This story is published with recorded consent. Our{" "}
        <Link href="/legal/safeguarding#photography" className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4">
          consent tiers
        </Link>{" "}
        determine what appears here. If you would like this story removed, contact us
        and we will take it down.
      </p>

      <Link
        href="/stories"
        className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
      >
        ← All stories
      </Link>

      {/* JSON-LD lives in here rather than in the page shell because it needs the
          slug, and the slug is only resolved inside the Suspense boundary. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Stories", path: "/stories" },
              { name: "Story", path: `/stories/${slug}` },
            ]),
          ),
        }}
      />
    </article>
  );
}

/**
 * `instant = false` allows this route to block rather than stream.
 *
 * The route is a dynamic segment with no `generateStaticParams`, so there is no
 * shell Next can prerender without resolving a slug, and the `(site)` layout
 * pulls in a client header. Blocking is the honest option for a
 * consent-sensitive page: it is read fresh on every request.
 */
export const instant = false;

export default async function StoryPage({
  params,
}: PageProps<"/[locale]/stories/[slug]">) {
  const { locale } = await params;

  // Pin the locale for static rendering. See the note in
  // `app/[locale]/layout.tsx`: this must run in the page, because
  // a layout body executes after the page it wraps.
  setRequestLocale(locale);

  return (
    <main id="main" className="bg-surface py-section">
      <Container>
        <Suspense
          fallback={<p className="text-ink-muted" role="status">Loading story…</p>}
        >
          <StoryBody params={params} />
        </Suspense>
      </Container>
    </main>
  );
}
