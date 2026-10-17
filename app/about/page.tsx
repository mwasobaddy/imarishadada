import type { Metadata } from "next";

import {
  AboutApproach,
  AboutField,
  AboutStory,
  AboutValues,
  AboutVisionMission,
  AboutWork,
} from "@/components/about/story";
import { AboutTeam } from "@/components/about/team";
import { PageHero } from "@/components/site/page-hero";
import {
  getAboutSections,
  getCoreValues,
  getTeamMembers,
  getAboutProgrammes,
} from "@/lib/data/about";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

const TITLE = "About us";
const DESCRIPTION =
  "Imarisha Dada is a girl-led organisation in Kibera, Nairobi. Our story, our vision and mission, our values, and the three programmes we run.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about", languages: { "en-KE": "/about", "x-default": "/about" } },
  openGraph: {
    type: "website",
    url: "/about",
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
};

export default async function AboutPage() {
  const [sections, values, members, programmes] = await Promise.all([
    getAboutSections(),
    getCoreValues(),
    getTeamMembers(),
    getAboutProgrammes(),
  ]);

  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About Imarisha Dada`,
    url: absoluteUrl("/about"),
    inLanguage: "en-KE",
    mainEntity: {
      "@type": "NGO",
      name: "Imarisha Dada",
      url: absoluteUrl("/"),
    },
  };

  return (
    <>
      <main id="main">
        <PageHero
          eyebrow={sections["about-hero"]?.eyebrow}
          heading={sections["about-hero"]?.heading ?? "Imarisha Dada"}
          body={sections["about-hero"]?.body}
        />

        <AboutStory section={sections["about-story"]!} />
        <AboutVisionMission
          vision={sections["about-vision"]!}
          mission={sections["about-mission"]!}
        />
        <AboutValues section={sections["about-values"]!} values={values} />
        <AboutWork section={sections["about-work"]!} programmes={programmes} />
        <AboutTeam section={sections["about-team"]!} members={members} />
        <AboutField />
        <AboutApproach section={sections["about-approach"]!} />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            aboutPageJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]),
          ]),
        }}
      />
    </>
  );
}
