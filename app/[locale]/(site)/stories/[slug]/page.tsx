import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/site/container";
import { ClosingCta } from "@/components/sections/closing-cta";
import { AnonymisedNotice, ConsentBanner } from "@/components/stories/consent-banner";
import { RelatedStories } from "@/components/stories/related-stories";
import { ShareLinks } from "@/components/stories/share-links";
import {
  REPORTING_PERIOD,
  getRelatedStories,
  getStoriesSections,
  getStory,
} from "@/lib/data/impact";
import { getProgrammeStats } from "@/lib/data/programmes";
import { isVisible } from "@/lib/data/sections";
import { fillTemplate } from "@/lib/stories/copy";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Story detail — `/stories/[slug]`.
 *
 * The page with the highest emotional impact and the highest safeguarding risk
 * per unit of content on the site. Consent is enforced here as well as on the
 * index, because a story URL is shareable and ends up in search results — which
 * is exactly where a consent mistake becomes permanent.
 *
 * ## The consent matrix, implemented in the data layer
 *
 * | Tier | Metadata | Photograph | Name | Indexable |
 * |---|---|---|---|---|
 * | `named_full` | Full | Rendered, preloaded | Yes | Yes |
 * | `named_no_face` | Full | **Never requested** | Yes | Yes |
 * | `anonymised` | Neutral, no title | **Never requested** | **No** | `noindex, follow` |
 *
 * `getStory()` resolves the tier, so this page receives an image path only for
 * `named_full` and an attribution only for the named tiers. There is no branch
 * here that could be got wrong, and no `<img>` hidden with CSS — which would
 * still have downloaded a photograph of a minor.
 *
 * ## Why anonymised metadata is not the story's title
 *
 * The tier withholds the *attribution*; it knows nothing about the title. An
 * editor can write a perfectly safe title, and the admin gate
 * (`titleLeaksName`) rejects one that repeats the recorded name. But this page
 * does not rely on that: for an anonymised story it emits a neutral title and
 * description of its own, so a leak in the title cannot reach a `<title>` tag
 * or an OG card regardless of what the admin allowed through.
 */

/**
 * ## Why there is no `generateStaticParams`
 *
 * The roadmap asks for it, and it is the right thing once stories exist — it
 * would prerender every published story per locale. It cannot be here yet:
 * there are zero published stories, and under `cacheComponents` a
 * `generateStaticParams` that returns an empty array **fails the build**:
 *
 *     Error: When using Cache Components, all `generateStaticParams` functions
 *     must return at least one result.
 *
 * That check exists so the build can prove the route has no other dynamic
 * access, which is a reasonable thing to want. There is no honest way to satisfy
 * it with no data — a sentinel slug would prerender a 404 as if it were a page.
 *
 * So the route renders on demand. It is not slower: `getStory` is `'use cache'`,
 * so the Supabase round trip is cached and the route still reports as `◐` —
 * a static shell with streamed, cached data.
 *
 * **Re-add this the moment there is a published story**, and delete this note:
 *
 *     export async function generateStaticParams() {
 *       const slugs = await getStorySlugs();
 *       return slugs.map((slug) => ({ slug }));
 *     }
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);

  // A slug that matches nothing published is a 404. Returning an empty object
  // here would let the page render and then not-found, which is two responses
  // for one URL.
  if (!story) return { title: "Story not found", robots: { index: false, follow: true } };

  const canonical = `/stories/${story.slug}`;

  // Anonymised: never the story's own words in metadata. See the note above.
  if (story.consentTier === "anonymised") {
    return {
      title: "A story from Kibera",
      description:
        "A participant has shared her story with us. She asked us not to publish her name or her photograph, and we have not.",
      alternates: { canonical },
      // Thin content and a weak link magnet, per the roadmap. `follow` keeps the
      // links flowing to the stories that are indexable.
      robots: { index: false, follow: true },
    };
  }

  const description = (story.excerpt || story.quote).slice(0, 160);

  return {
    title: story.title || "A story from Kibera",
    description,
    alternates: {
      canonical,
      languages: { "en-KE": canonical, "x-default": canonical },
    },
    openGraph: {
      type: "article",
      url: canonical,
      locale: "en_KE",
      images: story.imagePath ? [story.imagePath] : ["/opengraph-image"],
      title: story.title || "A story from Kibera",
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: story.title || "A story from Kibera",
      description,
    },
  };
}

function formatDate(iso: string): { label: string; dateTime: string } {
  const d = new Date(iso);
  return {
    label: new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d),
    dateTime: d.toISOString().slice(0, 10),
  };
}

export default async function StoryPage({
  params,
}: PageProps<"/[locale]/stories/[slug]">) {
  const { locale } = await params;

  // Pin the locale for static rendering. See the note in
  // `app/[locale]/layout.tsx`: this must run in the page, because a layout body
  // executes after the page it wraps.
  setRequestLocale(locale);

  const { slug } = await params;

  const story = await getStory(slug);
  if (!story) notFound();

  // Note on the status code: this returns **200 with a 404 page**, not a 404.
  //
  // The route is `◐` (Partial Prerender), so the shell is flushed before the
  // slug resolves, and Next's docs are explicit: *"Calling `notFound()` before
  // streaming starts returns a 404."* After it starts, the status is already
  // sent.
  //
  // Next injects `<meta name="robots" content="noindex">` on that page, so the
  // practical risk is contained — a crawler will not index it. The documented
  // remedy is a request-time check in Proxy, which for this route would mean a
  // Supabase round trip on every story view and would undo the `'use cache'`
  // work. Not worth that trade.
  //
  // This is **not new here**: `/programmes/[slug]` behaves the same way and
  // always has. Worth revisiting if it ever shows up as a soft-404 report in
  // Search Console.

  const [sections, stats, related] = await Promise.all([
    getStoriesSections(),
    story.programmeSlug ? getProgrammeStats(story.programmeSlug) : Promise.resolve([]),
    getRelatedStories(story.slug, story.programmeSlug),
  ]);

  const banner = sections["story-consent-banner"];
  const anonymised = sections["story-anonymised"];
  const cohort = sections["story-cohort"];
  const more = sections["story-more"];
  const share = sections["story-share"];

  const published = formatDate(story.publishedAt);
  const paragraphs = story.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // The cohort line ties one story to the aggregate, so it does not read as a
  // manufactured exception. The figure is a real `impact_stats` row and carries
  // its own period; the sentence around it is editable and the period is filled
  // in, so the two cannot drift.
  const cohortStat = stats[0] ?? null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title || "A story from Kibera",
    description: story.excerpt || undefined,
    author: { "@type": "NGO", name: "Imarisha Dada" },
    publisher: { "@type": "NGO", name: "Imarisha Dada" },
    datePublished: published.dateTime,
    inLanguage: "en-KE",
    mainEntityOfPage: absoluteUrl(`/stories/${story.slug}`),
    // Deliberately no `about`/`mentions` naming the participant, and no image
    // for any tier but `named_full`.
    ...(story.imagePath ? { image: absoluteUrl(story.imagePath) } : {}),
  };

  return (
    <>
      <main id="main" className="bg-surface py-section">
        <Container>
          <article className="mx-auto max-w-2xl">
            <header>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide text-brand-600 uppercase">
                {story.programmeSlug && story.programmeTitle ? (
                  <Link
                    href={`/stories?programme=${story.programmeSlug}`}
                    className="hover:underline"
                  >
                    {story.programmeTitle}
                  </Link>
                ) : null}
                <span className="font-medium tracking-normal text-ink-muted normal-case">
                  · <time dateTime={published.dateTime}>{published.label}</time>
                  {story.readingMinutes ? ` · ${story.readingMinutes} min read` : ""}
                </span>
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl">
                {story.title || "A story from Kibera"}
              </h1>
            </header>

            {/*
              Before the photograph, in the DOM. A screen reader reaches the
              sentence that says she agreed before it reaches her face.
            */}
            {isVisible(banner) ? (
              <ConsentBanner
                tier={story.consentTier}
                attribution={story.attribution}
                section={banner}
              />
            ) : null}
            {story.consentTier === "anonymised" && isVisible(anonymised) ? (
              <AnonymisedNotice section={anonymised} />
            ) : null}

            {/* Structural: `imagePath` is null for every tier but `named_full`,
                so this branch cannot render a withheld photograph. */}
            {story.imagePath ? (
              <div className="mt-8 overflow-hidden rounded-card bg-surface-lilac">
                <Image
                  src={story.imagePath}
                  alt={story.imageAlt ?? ""}
                  width={1400}
                  height={933}
                  sizes="(max-width: 768px) 92vw, 672px"
                  preload
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            {/* Her words first, then the context. The roadmap's rule: "Quote
                her, then contextualise. Do not narrate her life entirely in
                third person." */}
            <div className="mt-10">
              {story.quote ? (
                <blockquote className="border-l-4 border-brand-600/40 pl-6 text-2xl leading-relaxed font-medium text-brand-600">
                  {story.quote}
                </blockquote>
              ) : null}

              {paragraphs.length > 0 ? (
                <div className="mt-8 space-y-5 text-[1.0625rem] leading-[1.75] text-ink">
                  {paragraphs.map((para) => (
                    <p key={para.slice(0, 40)}>{para}</p>
                  ))}
                </div>
              ) : null}
            </div>

            {cohortStat && isVisible(cohort) ? (
              <div className="mt-12 rounded-card bg-surface-lilac p-7">
                <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">
                  {cohort.heading}
                </p>
                <p className="tabular mt-2 text-5xl leading-none font-semibold text-brand-600">
                  {cohortStat.value}
                </p>
                <p className="measure mt-3 text-ink-muted">
                  {fillTemplate(cohort.body ?? "", {
                    period: cohortStat.period ?? REPORTING_PERIOD.label,
                  })}
                </p>
              </div>
            ) : null}

            {isVisible(share) ? (
              <ShareLinks
                url={absoluteUrl(`/stories/${story.slug}`)}
                title={story.title || "A story from Kibera"}
                section={share}
              />
            ) : null}

            <Link
              href="/stories"
              className="mt-10 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
            >
              ← All stories
            </Link>
          </article>
        </Container>
      </main>

      {isVisible(more) ? <RelatedStories stories={related} section={more} /> : null}

      <ClosingCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            articleJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Stories", path: "/stories" },
              { name: story.title || "A story from Kibera", path: `/stories/${story.slug}` },
            ]),
          ]),
        }}
      />
    </>
  );
}
