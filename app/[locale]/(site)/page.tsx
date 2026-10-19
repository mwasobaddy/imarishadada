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
  getSection,
} from "@/lib/data/home";
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
  const [programmes, stats, tiers, story, programmesSection] = await Promise.all([
    getProgrammes(),
    getImpactStats(),
    getGivingTiers(),
    getFeaturedStory(),
    getSection("home-programmes"),
  ]);

  return (
    <>
      <Hero
        title="Every girl in Kibera deserves to go back to school."
        subtitle="Imarisha Dada is a girl-led organisation in Kibera, Nairobi. We support young mothers returning to education, girls finding safe spaces to grow, and young women building their own income."
        primaryCta={{ label: "Donate", href: "/donate" }}
        secondaryCta={{ label: "See our impact", href: "#impact" }}
        portrait={HERO_PORTRAIT}
        impactLine="19 young mothers back in school. 23 young women funded. All in 2025–26."
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