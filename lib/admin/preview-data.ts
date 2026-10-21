import { getCoreValues, getTeamMembers } from "@/lib/data/about";
import { getContactDetails, getEnquiryTypes } from "@/lib/data/contact";
import {
  bankRailUsable,
  getBankDetails,
  getPaymentRails,
  railStatuses,
} from "@/lib/data/donate";
import { getGivingTiers, getProgrammes } from "@/lib/data/home";
import { getProgramme } from "@/lib/data/programmes";
import { getSocialLinks } from "@/lib/data/social";
import { getVolunteerRoles } from "@/lib/data/volunteer";
import { getFinancialBreakdown, getTransparencyGaps } from "@/lib/data/transparency";
import type { EnquiryTypeOption } from "@/lib/data/contact";
import type { BankDetails, PaymentRails, RailStatus } from "@/lib/data/donate";
import type { FinancialLine, TransparencyGap } from "@/lib/data/gaps";
import type { PaymentRail } from "@/lib/donate/money";
import type { SocialLink } from "@/components/site/social-links";
import type { VolunteerRole } from "@/lib/volunteer/roles";
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
  /** The payment rails and the bank details, for the ways-to-give page. */
  rails?: PaymentRails;
  bank?: BankDetails;
  /** Whether a provider can complete a charge, per rail. */
  railStatuses?: Record<PaymentRail, RailStatus>;
  /** Whether the published bank details are complete enough to use. */
  bankReady?: boolean;
  /** The open volunteer roles, for the volunteer page. */
  volunteerRoles?: VolunteerRole[];
  /** The channels, for the pages that list them. */
  socialLinks?: SocialLink;
  /**
   * The programme pages, by slug.
   *
   * A programme page's lead section is the frame around the journey — the
   * scrolling panels come from the programme's own body — so the preview needs
   * the programme, not just its copy.
   */
  programmePages?: Record<string, { title: string; body: string }>;
  contact?: Awaited<ReturnType<typeof getContactDetails>>;
  /** The enquiry types, for the contact form's dropdown. */
  enquiryTypes?: EnquiryTypeOption[];
  /** The featured story, for the stories index. */
  featuredStory?: StoryCard | null;
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
      [data.contact, data.enquiryTypes] = await Promise.all([
        getContactDetails(),
        getEnquiryTypes(),
      ]);
      break;

    case "stories": {
      const [stories, consentCounts, socialLinks] = await Promise.all([
        getStories(),
        getConsentCounts(),
        getSocialLinks(),
      ]);
      data.stories = stories;
      data.consentCounts = consentCounts;
      data.socialLinks = socialLinks;
      // The same rule the page uses: the featured story leads, and is only
      // featured when there is something left to show underneath it.
      data.featuredStory =
        stories.length > 1 ? (stories.find((s) => s.featured) ?? stories[0]!) : null;
      break;
    }

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

    case "partner":
      [data.partners, data.contact, data.socialLinks] = await Promise.all([
        getPublicPartners(),
        getContactDetails(),
        getSocialLinks(),
      ]);
      break;

    case "volunteer":
      data.volunteerRoles = await getVolunteerRoles();
      break;

    case "programme-school-reentry":
    case "programme-economic-empowerment":
    case "programme-dada-space":
    case "programme-community-hub": {
      const slug = pageKey.replace(/^programme-/, "");
      const programme = await getProgramme(slug);
      if (programme) {
        data.programmePages = {
          ...data.programmePages,
          [slug]: { title: programme.title, body: programme.body },
        };
      }
      break;
    }

    case "ways-to-give": {
      const [tiers, rails, bank] = await Promise.all([
        getGivingTiers(),
        getPaymentRails(),
        getBankDetails(),
      ]);
      data.tiers = tiers;
      data.rails = rails;
      data.bank = bank;
      // The status is derived on the server: it combines the editorial switch
      // with whether a provider can actually take the money, and the browser
      // cannot know the second half.
      data.railStatuses = railStatuses(rails);
      data.bankReady = bankRailUsable(bank);
      break;
    }

    case "donate":
      [data.tiers, data.stats] = await Promise.all([
        getGivingTiers(),
        getAllImpactStats(),
      ]);
      break;

    case "programmes":
      data.programmes = await getProgrammes();
      break;

    default:
      break;
  }

  return data;
}
