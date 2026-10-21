/**
 * Static page content.
 *
 * These pages are long-form prose with no per-request data, so their content
 * lives here as typed data rather than being hardcoded in JSX. That keeps the
 * page components structural and makes the copy reviewable in one place.
 *
 * Anything that needs an admin override or a database row does NOT belong here.
 */

/*
 * FAQS and its FaqEntry type used to live here.
 *
 * Removed when /faq moved to the `faqs` table (migration 0025). The table had a
 * full schema and a working admin editor at /admin/content/faqs since 0007, and
 * this constant was what the page actually rendered — so an editor adding a
 * question saw nothing change.
 *
 * The move also fixed a false claim: the constant said the organisation has "a
 * named safeguarding officer", which /legal/safeguarding and /transparency both
 * contradict.
 */


/** Generic prose page: partner, volunteer, transparency, annual report, news. */
export type ProseSection = {
  id: string;
  heading: string;
  /** Optional: a section may be a pure list. */
  paragraphs?: string[];
  bullets?: string[];
};

export type ProsePage = {
  slug: string;
  title: string;
  eyebrow: string;
  lede: string;
  /** True when the page is a placeholder pending real content. */
  draft: boolean;
  cta?: { label: string; href: string };
  sections: ProseSection[];
};

/*
 * PARTNER_PAGE used to live here.
 *
 * Removed when /partner left `ProseRoute` (migration 0027). The page had no form,
 * and `partner_enquiries` had an inbox that nothing public wrote to. Its copy now
 * lives in `site_sections` and the enquiry form writes through a Server Action.
 */

/*
 * VOLUNTEER_PAGE used to live here.
 *
 * Removed when /volunteer left `ProseRoute` (migration 0026). Two tables had
 * been wired on the admin side and unreachable from the public site:
 * `volunteer_roles` was read only by /admin/volunteer-roles, and
 * `volunteer_applications` had an inbox, status transitions and a dashboard
 * count with nothing public that ever wrote a row.
 *
 * The remaining prose page is annual-report. When one of
 * them needs a database row, move it out the same way rather than adding the
 * row to this file.
 */


/*
 * TRANSPARENCY_PAGE used to live here.
 *
 * It was removed when /transparency left `ProseRoute` and became a real page
 * (migration 0022). It needed two things this file cannot provide, by its own
 * comment: a database row (`transparency_gaps`, `financial_breakdown`) and an
 * admin override, because the roadmap requires an editor to be able to mark a
 * gap as done.
 *
 * The remaining four prose pages still render from here. When one of them needs
 * a database row, move it out the same way rather than adding the row to this
 * file.
 */

export const ANNUAL_REPORT_PAGE: ProsePage = {
  slug: "annual-report",
  title: "Annual report",
  eyebrow: "Annual report",
  lede: "The written record behind the numbers. Published in full, or not at all.",
  draft: true,
  sections: [
    {
      id: "status",
      heading: "Current status",
      paragraphs: [
        "Our first annual report is in preparation. It will cover the 2025–26 reporting period and will be published in full once complete and signed off.",
        "We would rather publish late than publish a partial report that reads as complete. A funder reviewing a half-finished document is worse served than one told plainly that it does not exist yet.",
      ],
    },
    {
      id: "will-contain",
      heading: "What it will contain",
      bullets: [
        "Income and expenditure for the period.",
        "Programme figures, each with the period it covers and how it was counted.",
        "A safeguarding and governance section.",
        "The measurement gaps we did not close.",
        "Plans for the following year.",
      ],
    },
    {
      id: "impact",
      heading: "In the meantime",
      paragraphs: [
        "Our impact page carries the current figures and our methodology, and both are dated. If you need the underlying detail now, ask us and we will send what we have.",
      ],
    },
  ],
};

/*
 * NEWS_PAGE used to live here. Removed when /news left `ProseRoute` (migration
 * 0029). The index and article pages read `posts` and `site_sections` directly.
 */
/** Look up a prose page by slug. */
export const PROSE_PAGES: Record<string, ProsePage> = {
  "annual-report": ANNUAL_REPORT_PAGE,
};
