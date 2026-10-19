import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/site/page-hero";
import { ProgrammeCard } from "@/components/sections/programme-card";
import {
  ProgrammeCost,
  ProgrammeImpact,
  ProgrammeOutcomes,
} from "@/components/sections/programme-detail";
import { ProgrammeProblem } from "@/components/sections/programme-problem";
import { PartnerSchools } from "@/components/sections/partner-schools";
import { ProgrammeStories } from "@/components/sections/programme-stories";
import {
  getOtherProgrammes,
  getPartnerSchools,
  getProgramme,
  getProgrammeSlugs,
  getProgrammeStats,
  getProgrammeStories,
  getProgrammeTiers,
} from "@/lib/data/programmes";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Programme detail — `/programmes/[slug]`.
 *
 * The route is dynamic on slug rather than a hardcoded segment. The roadmap is
 * explicit that a route literal alongside a database slug is a bug: "A
 * canonical pointing at a different slug splits SEO signals and breaks
 * hreflang." `generateStaticParams` prerenders every active programme, so all
 * three pages exist from this one file.
 */
export async function generateStaticParams() {
  const slugs = await getProgrammeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/programmes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const programme = await getProgramme(slug);

  if (!programme) return { title: "Programme not found" };

  // Prefer the admin-editable `stat`, which already carries the figure and
  // period, over inventing a description from a count.
  const description =
    programme.summary ||
    `${programme.title} — ${programme.stat ?? "girl-led support in Kibera, Nairobi"}.`;

  return {
    title: `${programme.title} | Imarisha Dada Kibera`,
    description: description.slice(0, 160),
    alternates: {
      canonical: `/programmes/${programme.slug}`,
      languages: { "en-KE": `/programmes/${programme.slug}`, "x-default": `/programmes/${programme.slug}` },
    },
    openGraph: {
      type: "article",
      url: `/programmes/${programme.slug}`,
      locale: "en_KE",
      title: `${programme.title} | Imarisha Dada`,
      description: description.slice(0, 160),
    },
    twitter: {
      card: "summary_large_image",
      title: `${programme.title} | Imarisha Dada`,
      description: description.slice(0, 160),
    },
  };
}

function formatKsh(amount: number): string {
  return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(amount)}`;
}

export default async function ProgrammePage({
  params,
}: PageProps<"/[locale]/programmes/[slug]">) {
  const { locale, ...rest } = await params;

  // Pin the locale for static rendering. See the note in
  // `app/[locale]/layout.tsx`: this must run in the page, because
  // a layout body executes after the page it wraps.
  setRequestLocale(locale);

  const { slug } = rest;

  const [programme, stats, tiers, stories, partners, others] = await Promise.all([
    getProgramme(slug),
    getProgrammeStats(slug),
    getProgrammeTiers(slug),
    getProgrammeStories(slug),
    getPartnerSchools(slug),
    getOtherProgrammes(slug),
  ]);

  // A slug that matches no active programme is a 404, not an empty page.
  if (!programme) notFound();

  const paragraphs = programme.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: programme.title,
    description: programme.summary || undefined,
    author: { "@type": "NGO", name: "Imarisha Dada" },
    publisher: {
      "@type": "NGO",
      name: "Imarisha Dada",
      logo: { "@type": "ImageObject", url: absoluteUrl("/brand/mark.webp") },
    },
    inLanguage: "en-KE",
    mainEntityOfPage: absoluteUrl(`/programmes/${programme.slug}`),
  };

  return (
    <>
      <main id="main">
        <PageHero
          eyebrow={programme.stat ?? undefined}
          heading={programme.title}
          body={
            programme.slug === "school-reentry"
              ? "When a girl becomes a mother, she does not stop learning. She gets pushed out. We walk with adolescent mothers from the decision to go back, through re-enrolment, and through the school years that follow."
              : programme.summary
          }
        />

        {/* Body copy is the section that earns the donation. Skipped when empty. */}
        {paragraphs.length > 0 ? <ProgrammeProblem paragraphs={paragraphs} /> : null}

        <ProgrammeOutcomes
          title={`What ${programme.title.toLowerCase()} actually involves`}
          outcomes={programme.outcomes}
        />

        <ProgrammeImpact stats={stats} />

        <ProgrammeStories stories={stories} />

        <ProgrammeCost tiers={tiers} currencyFormatter={formatKsh} />

        {/* Renders a labelled placeholder until a school has agreed in writing. */}
        <PartnerSchools partners={partners} />

        {others.length > 0 ? (
          <section aria-labelledby="others-heading" className="py-section bg-surface-lilac">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <h2
                id="others-heading"
                className="text-2xl font-semibold tracking-tight text-brand-600"
              >
                What else we run
              </h2>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                {others.map((other) => (
                  <li key={other.slug} className="flex">
                    <ProgrammeCard programme={other} />
                  </li>
                ))}
              </ul>

              <Link
                href="/"
                className="mt-8 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
              >
                Back to the homepage
              </Link>
            </div>
          </section>
        ) : null}
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            articleJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Programmes", path: "/programmes" },
              { name: programme.title, path: `/programmes/${programme.slug}` },
            ]),
          ]),
        }}
      />
    </>
  );
}
