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
import {
  VolunteerApply,
  VolunteerProcess,
  VolunteerRemote,
  VolunteerRoles,
  VolunteerSafeguarding,
} from "@/components/volunteer/sections";
import {
  WaysOrganisation,
  WaysOther,
  WaysRails,
  WaysTransparency,
} from "@/components/sections/ways-to-give";
import { ProseSection } from "@/components/transparency/prose-section";
import {
  TransparencyGaps,
  TransparencyMeasure,
  TransparencyMoney,
  TransparencyMoneyStatus,
} from "@/components/transparency/sections";
import { Programmes } from "@/components/sections/programmes";
import { FaqContact, FaqEmpty } from "@/components/faq/sections";
import { NewsEmpty } from "@/components/news/sections";
import { ProgrammeContent } from "@/components/sections/programme-content";
import { ProgrammeNarrative } from "@/components/sections/programme-narrative";
import { LadiesRoom } from "@/components/stories/sections";
import { PullQuote } from "@/components/site/pull-quote";
import {
  PartnerApply,
  PartnerCannot,
  PartnerDirect,
  PartnerDueDiligence,
  PartnerList,
  PartnerNeed,
} from "@/components/partner/sections";
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

    /* ---- Transparency ---- */

    case "transparency-gaps":
      return (
        <TransparencyGaps section={section} gaps={data.governanceGaps ?? []} />
      );

    case "transparency-measure":
      return (
        <TransparencyMeasure section={section} gaps={data.measurementGaps ?? []} />
      );

    case "transparency-money":
      return <TransparencyMoney section={section} lines={data.financials ?? []} />;

    case "transparency-money-status":
      return <TransparencyMoneyStatus section={section} />;

    case "transparency-governance":
      return <ProseSection id="governance" section={section} />;

    case "transparency-safeguarding":
      return <ProseSection id="safeguarding" section={section} />;

    case "transparency-complaints":
      return <ProseSection id="complaints" section={section} />;

    /* ---- News ---- */

    case "news-empty":
      return <NewsEmpty section={section} />;

    /* ---- FAQ ---- */

    case "faq-empty":
      return <FaqEmpty section={section} />;

    case "faq-contact":
      return <FaqContact section={section} />;

    /* ---- Partner ---- */

    case "partner-need":
      return <PartnerNeed section={section} />;

    case "partner-cannot":
      return <PartnerCannot section={section} />;

    case "partner-dd":
      return <PartnerDueDiligence section={section} />;

    case "partner-partners":
      return <PartnerList section={section} partners={data.partners ?? []} />;

    case "partner-form":
      return <PartnerApply section={section} />;

    case "partner-direct":
      return (
        <PartnerDirect section={section} contact={data.contact ?? FALLBACK_CONTACT} />
      );

    /* ---- The programme pages ---- */

    case "reentry-lead":
    case "econ-lead":
    case "dada-lead":
    case "hub-lead": {
      // The lead section is the frame around the journey: the scrolling panels
      // come from the programme's own body, so the preview needs the programme.
      const slug = form.page_key?.replace(/^programme-/, "") ?? "";
      const programme = data.programmePages?.[slug];
      const paragraphs = programme
        ? programme.body
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
        : [];

      if (paragraphs.length === 0) {
        return <ProgrammeContent section={section} />;
      }

      return (
        <ProgrammeNarrative
          paragraphs={paragraphs}
          eyebrow={section.eyebrow}
          heading={section.heading}
          intro={section.body}
        />
      );
    }

    case "reentry-story":
    case "econ-story":
    case "dada-problems":
    case "dada-why":
    case "dada-how":
    case "dada-quote":
    case "hub-what":
      return <ProgrammeContent section={section} />;

    /* ---- The rest ---- */

    case "about-quote":
      return <PullQuote eyebrow={section.eyebrow} quote={section.heading} />;

    case "stories-ladies-room":
      return (
        <LadiesRoom
          section={section}
          links={data.socialLinks ?? EMPTY_LINKS}
          linksLabel="Where to find us"
        />
      );

    /* ---- Volunteer ---- */

    case "volunteer-roles":
      return (
        <VolunteerRoles
          section={section}
          emptySection={find("volunteer-roles-empty")}
          roles={data.volunteerRoles ?? []}
        />
      );

    case "volunteer-roles-empty":
      // The empty state is rendered inside the roles section, so on its own it
      // is the card without the list.
      return (
        <div className="rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-8">
          <h3 className="text-xl font-semibold text-brand-600">{section.heading}</h3>
          {section.body ? (
            <p className="measure mt-3 leading-relaxed text-ink-muted">{section.body}</p>
          ) : null}
        </div>
      );

    case "volunteer-process":
      return <VolunteerProcess section={section} />;

    case "volunteer-safeguarding":
      return <VolunteerSafeguarding section={section} />;

    case "volunteer-form":
      return <VolunteerApply section={section} roles={data.volunteerRoles ?? []} />;

    case "volunteer-remote":
      return <VolunteerRemote section={section} />;

    /* ---- Ways to give ---- */

    case "ways-ladder":
      // `moreHref: null` — the ladder is on the ways-to-give page, and a link
      // from that page to itself is a dead end.
      return <GivingWays tiers={data.tiers ?? []} section={section} moreHref={null} />;

    case "ways-rails":
      return (
        <WaysRails
          section={section}
          rails={data.rails ?? FALLBACK_RAILS}
          bank={data.bank ?? FALLBACK_BANK}
          statuses={data.railStatuses ?? FALLBACK_STATUSES}
          bankReady={data.bankReady ?? false}
        />
      );

    case "ways-transparency":
      return <WaysTransparency section={section} />;

    case "ways-organisation":
      return <WaysOrganisation section={section} />;

    case "ways-other":
      return <WaysOther section={section} />;

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
  "ways-rails",
  "ways-transparency",
  "ways-organisation",
  "ways-other",
  "volunteer-roles",
  "volunteer-roles-empty",
  "volunteer-process",
  "volunteer-safeguarding",
  "volunteer-form",
  "volunteer-remote",
  "news-empty",
  "stories-ladies-room",
  "about-quote",
  "reentry-lead",
  "reentry-story",
  "econ-lead",
  "econ-story",
  "dada-lead",
  "dada-problems",
  "dada-why",
  "dada-how",
  "dada-quote",
  "hub-lead",
  "hub-what",
  "faq-empty",
  "faq-contact",
  "partner-need",
  "partner-cannot",
  "partner-dd",
  "partner-partners",
  "partner-form",
  "partner-direct",
  "impact-headline",
  "impact-by-programme",
  "impact-methodology",
  "impact-gaps",
  "impact-reports",
  "transparency-gaps",
  "transparency-measure",
  "transparency-money",
  "transparency-money-status",
  "transparency-governance",
  "transparency-safeguarding",
  "transparency-complaints",
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

/**
 * The payment rails, when the preview has none.
 *
 * Empty rather than invented: a preview must not show a rail the site does
 * not offer, and the server always sends the real configuration.
 */
const FALLBACK_RAILS = {
  mpesa: { label: "M-Pesa", hint: "", enabled: false },
  card: { label: "Card", hint: "", enabled: false },
  bank: { label: "Bank transfer", hint: "", enabled: false },
} as never;

const FALLBACK_BANK = {
  accountName: null,
  bankName: null,
  accountNumber: null,
  branch: null,
  instructions: null,
} as never;

const FALLBACK_STATUSES = {
  mpesa: "coming_soon",
  card: "coming_soon",
  bank: "coming_soon",
} as never;

/** The channels, when the preview has none. */
const EMPTY_LINKS = {
  linkedin: null,
  facebook: null,
  spotify: null,
} as never;
