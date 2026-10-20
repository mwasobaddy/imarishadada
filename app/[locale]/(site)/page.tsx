import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ClosingCta } from "@/components/sections/closing-cta";
import { FeaturedStory } from "@/components/sections/featured-story";
import { GivingWays } from "@/components/sections/giving-ways";
import { Hero } from "@/components/sections/hero";
import { Programmes } from "@/components/sections/programmes";
import { StatCounter } from "@/components/sections/stat-counter";
import { TrustStrip } from "@/components/site/trust-strip";
import {
  getFeaturedStory,
  getGivingTiers,
  getImpactStats,
  getProgrammes,
} from "@/lib/data/home";
import { getSection } from "@/lib/data/sections";
import { HERO_PORTRAIT } from "@/lib/data/hero-portrait";
import { buildLanguageAlternates, jsonLdScript, webSiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Empowering Girls in Kibera, Nairobi",
  description:
    "Imarisha Dada is a girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  keywords: [
    "Imarisha Dada",
    "Kibera",
    "Nairobi",
    "girls education",
    "school re-entry",
    "young mothers",
    "economic empowerment",
    "safe spaces",
    "NGO Kenya",
    "charity Kenya",
  ],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    languages: buildLanguageAlternates("/"),
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "/",
    title: "Empowering Girls in Kibera, Nairobi | Imarisha Dada",
    description:
      "Imarisha Dada is a girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Empowering Girls in Kibera, Nairobi | Imarisha Dada",
    description:
      "Imarisha Dada is a girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
    images: ["/opengraph-image"],
  },
};

// Anything uncached is streamed through a Suspense boundary because
// cacheComponents is enabled (next.config.ts).
export default async function HomePage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  return (
    <>
      <main id="main" className="flex-1">
        <Suspense fallback={<div className="min-h-[70vh] bg-surface" />}>
          <HomeContent />
        </Suspense>
      </main>
    </>
  );
}

async function HomeContent() {
  const [programmes, stats, tiers, story, programmesSection, hero] = await Promise.all([
    getProgrammes(),
    getImpactStats(),
    getGivingTiers(),
    getFeaturedStory(),
    getSection("home-programmes"),
    getSection("home-hero"),
  ]);

  return (
    <>
      {/* Copy comes from `site_sections`, so an editor can change the headline
          and the CTA labels without a deploy. The component's own defaults are
          the fallback, so a database blip renders the last-known-good page
          rather than an empty <h1>. */}
      <Hero
        title={hero.heading}
        subtitle={hero.body ?? ""}
        primaryCta={{
          label: hero.ctaLabel ?? "Donate",
          href: hero.ctaHref ?? "/donate",
        }}
        secondaryCta={{
          label: hero.ctaSecondaryLabel ?? "See our impact",
          href: hero.ctaSecondaryHref ?? "#impact",
        }}
        portrait={HERO_PORTRAIT}
        impactLine={hero.statLine ?? ""}
      />

      {/* Registration number is not published until issued — TrustStrip
          renders nothing rather than a placeholder. */}
      <TrustStrip registrationNumber={null} fiscalSponsor={null} />

      <div id="impact">
        <StatCounter stats={stats} />
      </div>

      <Programmes programmes={programmes} section={programmesSection} />
      <FeaturedStory story={story} />
      <GivingWays tiers={tiers} />
      <ClosingCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webSiteJsonLd()) }}
      />
    </>
  );
}