import type { Metadata } from "next";
import { Suspense } from "react";

import { ClosingCta } from "@/components/sections/closing-cta";
import { FeaturedStory } from "@/components/sections/featured-story";
import { GivingWays } from "@/components/sections/giving-ways";
import { Hero } from "@/components/sections/hero";
import { Programmes } from "@/components/sections/programmes";
import { StatCounter } from "@/components/sections/stat-counter";
import { SiteFooter } from "@/components/site/site-footer";
import { TrustStrip } from "@/components/site/trust-strip";
import {
  getFeaturedStory,
  getGivingTiers,
  getImpactStats,
  getProgrammes,
} from "@/lib/data/home";
import { HERO_PORTRAIT } from "@/lib/data/hero-portrait";
import { buildLanguageAlternates, jsonLdScript, webSiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Imarisha Dada — Empowering Girls and Young Women in Kibera",
  description:
    "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  alternates: {
    canonical: "/",
    languages: buildLanguageAlternates("/"),
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "/",
    title: "Imarisha Dada — Empowering Girls and Young Women in Kibera",
    description:
      "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imarisha Dada — Empowering Girls and Young Women in Kibera",
    description:
      "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  },
};

// Anything uncached is streamed through a Suspense boundary because
// cacheComponents is enabled (next.config.ts).
export default function HomePage() {
  return (
    <>
      <main id="main" className="flex-1">
        <Suspense fallback={<div className="min-h-[70vh] bg-surface-warm" />}>
          <HomeContent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function HomeContent() {
  const [programmes, stats, tiers, story] = await Promise.all([
    getProgrammes(),
    getImpactStats(),
    getGivingTiers(),
    getFeaturedStory(),
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

      <Programmes programmes={programmes} />
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