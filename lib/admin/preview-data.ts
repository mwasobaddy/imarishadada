import { getCoreValues, getTeamMembers } from "@/lib/data/about";
import { getContactDetails } from "@/lib/data/contact";
import { getGivingTiers, getProgrammes } from "@/lib/data/home";
import { getFinancialBreakdown, getTransparencyGaps } from "@/lib/data/transparency";
import type { FinancialLine, TransparencyGap } from "@/lib/data/gaps";
import {
  getAllImpactStats,
  getConsentCounts,
  getMeasurementGaps,
  getStories,
  type ConsentTierCounts,
  type StoryCard,
} from "@/lib/data/impact";
import { getPublicPartners, type PublicPartner } from "@/lib/data/partner";
import type {
  CoreValue,
  GivingTier,
  ImpactStat,
  Programme,
  SiteSection,
  TeamMember,
} from "@/lib/data/types";

/**
 * The data the admin's live preview needs.
 *
 * ## Why the preview needs the published data
 *
 * The preview renders the *real* public components, and those components are
 * not pure copy: the programmes section shows programme cards, the giving
 * section shows tiers with their amounts, the partners section shows logos.
 * An editor changing a heading on the homepage needs to see the section as it
 * will look with the real cards in it, not an empty box.
 *
 * ## Why the public readers and not the admin ones
 *
 * The admin actions behind `/admin/programmes` and friends check permissions
 * that a page editor may not hold — a person who can edit copy but not
 * programmes would get an error instead of a preview. The public readers have
 * no permission check and return exactly what the page shows, which is the
 * thing being previewed.
 */
export type PreviewData = {
  /** The page's saved sections, for the ones that reference each other. */
  sections: SiteSection[];
  programmes?: Programme[];
  tiers?: GivingTier[];
  partners?: PublicPartner[];
  coreValues?: CoreValue[];
  teamMembers?: TeamMember[];
  stories?: StoryCard[];
  consentCounts?: ConsentTierCounts;
  /** The dated figures, for the impact page. */
  stats?: ImpactStat[];
  /** The things we do not yet measure, for the impact page. */
  gaps?: string[];
  /** The transparency page's two gap lists. */
  governanceGaps?: TransparencyGap[];
  measurementGaps?: TransparencyGap[];
  /** The published financial lines, for the transparency page. */
  financials?: FinancialLine[];
  contact?: Awaited<ReturnType<typeof getContactDetails>>;
};

/**
 * Load only what a page's previews need.
 *
 * A page editor opening `/admin/pages/home` should not pay for the contact
 * details and the consent counts. Each page declares what it renders.
 */
export async function loadPreviewData(
  pageKey: string,
  sections: SiteSection[],
): Promise<PreviewData> {
  const data: PreviewData = { sections };

  switch (pageKey) {
    case "home":
      [data.programmes, data.tiers, data.partners] = await Promise.all([
        getProgrammes(),
        getGivingTiers(),
        getPublicPartners(),
      ]);
      break;

    case "about":
      [data.programmes, data.coreValues, data.teamMembers] = await Promise.all([
        getProgrammes(),
        getCoreValues(),
        getTeamMembers(),
      ]);
      break;

    case "contact":
      data.contact = await getContactDetails();
      break;

    case "stories":
      [data.stories, data.consentCounts] = await Promise.all([
        getStories(),
        getConsentCounts(),
      ]);
      break;

    case "impact":
      [data.stats, data.gaps, data.programmes] = await Promise.all([
        getAllImpactStats(),
        getMeasurementGaps(),
        getProgrammes(),
      ]);
      break;

    case "transparency":
      [data.governanceGaps, data.measurementGaps, data.financials] =
        await Promise.all([
          getTransparencyGaps("governance"),
          getTransparencyGaps("measurement"),
          getFinancialBreakdown(),
        ]);
      break;

    case "ways-to-give":
    case "donate":
      data.tiers = await getGivingTiers();
      break;

    case "programmes":
      data.programmes = await getProgrammes();
      break;

    default:
      break;
  }

  return data;
}
