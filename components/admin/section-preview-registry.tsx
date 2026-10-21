"use client";

import type { ReactNode } from "react";

import { AboutApproach, AboutStory, AboutValues, AboutVisionMission, AboutWork } from "@/components/about/story";
import { ImpactByProgramme } from "@/components/impact/by-programme";
import { ImpactGaps } from "@/components/impact/gaps";
import { ImpactMethodology } from "@/components/impact/methodology";
import { ImpactReports } from "@/components/impact/reports";
import { AboutTeam } from "@/components/about/team";
import { ContactFaqs, ContactMethods } from "@/components/sections/contact-methods";
import { GivingWays } from "@/components/sections/giving-ways";
import { Hero } from "@/components/sections/hero";
import { PartnerStrip } from "@/components/sections/partner-strip";
import { StatCounter } from "@/components/sections/stat-counter";
import { Programmes } from "@/components/sections/programmes";
import { PageHero } from "@/components/site/page-hero";
import { ConsentLedger, ConsentNote } from "@/components/stories/consent";
import { StoryGrid } from "@/components/stories/story-grid";
import { toPreviewSection, type SectionForm } from "@/lib/admin/section-form";
import type { ContactDetails } from "@/lib/data/contact";
import type { ConsentTierCounts } from "@/lib/data/impact";
import type { PreviewData } from "@/lib/admin/preview-data";
import { HERO_PORTRAIT } from "@/lib/data/hero-portrait";
import { REPORTING_PERIOD } from "@/lib/data/reporting-period";

/**
 * The exact preview: the section as the public page renders it.
 *
 * ## Why this exists
 *
 * The first version of the preview redrew each section in the admin's own
 * words — the same type scale, the same colours, but a second implementation.
 * It was close, and it was wrong in the way that matters: the moment the page
 * changed its layout, the preview kept showing the old one, and the editor
 * was told the preview was the page.
 *
 * So the preview now calls the same component the page calls. When the page
 * changes, the preview changes with it, because there is only one of it.
 *
 * ## What it covers, and what it does not
 *
 * A section is only exact when it is rendered by a component. Several pages
 * still compose parts of themselves inline, and those parts fall back to the
 * approximate preview until they are extracted. `EXACT_SECTIONS` below is the
 * list of what is exact today, and the admin says which one you are looking
 * at.
 *
 * ## Why the components can be used here
 *
 * They are Server Components, but none of them reads cookies, headers or the
 * database. They take their copy as props, which is exactly what the editor
 * has. The one thing that had to move is `isVisible`, which used to live
 * beside `next/cache` in `lib/data/sections.ts`; it is now in
 * `lib/data/visibility.ts` so the browser bundle can use it.
 */
export function ExactSectionPreview({
  form,
  data,
}: {
  form: SectionForm;
  data: PreviewData;
}): ReactNode | null {
  const section = toPreviewSection(form);
  const others = data.sections;
  const find = (key: string) => others.find((s) => s.key === key) ?? null;

  switch (form.section_key) {
    /* ---- The homepage ---- */

    case "home-hero":
      return (
        <Hero
          title={form.heading}
          subtitle={form.body ?? ""}
          primaryCta={{
            label: form.cta_label || "Donate",
            href: form.cta_href || "/donate",
          }}
          secondaryCta={{
            label: form.cta_secondary_label || "See our impact",
            href: form.cta_secondary_href || "#impact",
          }}
          portrait={HERO_PORTRAIT}
          impactLine={form.stat_line ?? ""}
        />
      );

    case "home-programmes":
      return <Programmes programmes={data.programmes ?? []} section={section} />;

    case "home-giving":
      return <GivingWays tiers={data.tiers ?? []} section={section} />;

    case "home-partners":
      return <PartnerStrip partners={data.partners ?? []} section={section} />;

    /* ---- About ---- */

    case "about-story":
      return <AboutStory section={section} carousel={find("about-carousel")} />;

    case "about-vision":
    case "about-mission":
      // The two cards are one component. Rendering either one alone would
      // show a half-width grid, so both are passed.
      return (
        <AboutVisionMission
          vision={form.section_key === "about-vision" ? section : find("about-vision")}
          mission={form.section_key === "about-mission" ? section : find("about-mission")}
        />
      );

    case "about-values":
      return (
        <AboutValues
          section={section}
          values={data.coreValues ?? []}
          carousel={find("about-carousel")}
        />
      );

    case "about-work":
      return <AboutWork section={section} programmes={data.programmes ?? []} />;

    case "about-team":
      return <AboutTeam section={section} members={data.teamMembers ?? []} />;

    case "about-approach":
      return <AboutApproach section={section} />;

    /* ---- Contact ---- */

    case "contact-methods":
      return (
        <ContactMethods
          contact={data.contact ?? FALLBACK_CONTACT}
          section={section}
          otherSection={find("contact-methods-other") ?? section}
        />
      );

    case "contact-faqs":
      return <ContactFaqs section={section} />;

    /* ---- Stories ---- */

    case "stories-grid":
      return (
        <StoryGrid
          stories={data.stories ?? []}
          section={section}
          emptySection={find("stories-empty") ?? section}
        />
      );

    case "stories-consent":
      return (
        <ConsentNote
          counts={data.consentCounts ?? EMPTY_COUNTS}
          section={section}
        />
      );

    /* ---- Impact ---- */

    case "impact-headline":
      return (
        <StatCounter
          stats={data.stats ?? []}
          headingId="impact-headline-heading"
          heading={form.heading}
          intro={form.body || undefined}
          period={`${REPORTING_PERIOD.from} – ${REPORTING_PERIOD.to}`}
        />
      );

    case "impact-by-programme":
      return (
        <ImpactByProgramme
          section={section}
          programmes={data.programmes ?? []}
          stats={data.stats ?? []}
        />
      );

    case "impact-methodology":
      return <ImpactMethodology section={section} />;

    case "impact-gaps":
      return <ImpactGaps section={section} gaps={data.gaps ?? []} />;

    case "impact-reports":
      return <ImpactReports section={section} />;

    /* ---- Ways to give ---- */

    case "ways-ladder":
      // `moreHref: null` — the ladder is on the ways-to-give page, and a link
      // from that page to itself is a dead end.
      return <GivingWays tiers={data.tiers ?? []} section={section} moreHref={null} />;

    /* ---- The mastheads ---- */

    default:
      if (!form.section_key.endsWith("-hero")) return null;

      return (
        <PageHero
          eyebrow={form.eyebrow || null}
          heading={form.heading}
          body={form.body || null}
        >
          {form.section_key === "stories-hero" && data.consentCounts ? (
            <ConsentLedger counts={data.consentCounts} />
          ) : null}
        </PageHero>
      );
  }
}

/**
 * The sections whose preview is the real thing.
 *
 * Used by the admin to say which kind of preview is on screen, so nobody has
 * to guess whether they are looking at the page or an impression of it.
 *
 * Every masthead is in it: they all render through `PageHero`, and the
 * renderer treats any `-hero` key that way. `isExactSectionKey` is the single
 * answer to "is this section exact?", used by both the renderer and the label.
 */
export const EXACT_SECTION_KEYS = new Set([
  "home-hero",
  "home-programmes",
  "home-giving",
  "home-partners",
  "about-story",
  "about-vision",
  "about-mission",
  "about-values",
  "about-work",
  "about-team",
  "about-approach",
  "contact-methods",
  "contact-faqs",
  "stories-grid",
  "stories-consent",
  "ways-ladder",
  "impact-headline",
  "impact-by-programme",
  "impact-methodology",
  "impact-gaps",
  "impact-reports",
]);

/**
 * Contact details, for the one preview that needs them before the data
 * arrives. Empty rather than invented: a preview must not show a phone number
 * the site does not publish.
 */
const FALLBACK_CONTACT: ContactDetails = {
  email: null,
  phone: null,
  whatsapp: null,
  whatsappPrefill: "",
  address: null,
  responseTime: "",
  officeHours: null,
  responseTimes: { email: "", phone: "", whatsapp: "" },
} as ContactDetails;

/** Consent counts, for the same reason. */
const EMPTY_COUNTS: ConsentTierCounts = {
  named_full: 0,
  named_no_face: 0,
  anonymised: 0,
};

/**
 * Whether a section's preview is the real component.
 *
 * The renderer and the label must agree, or the editor is told one thing and
 * shown another. Both ask this.
 */
export function isExactSectionKey(sectionKey: string): boolean {
  return EXACT_SECTION_KEYS.has(sectionKey) || sectionKey.endsWith("-hero");
}
