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

export const PARTNER_PAGE: ProsePage = {
  slug: "partner",
  title: "Partner with us",
  eyebrow: "Partnership",
  lede: "We are small, accountable and on the ground in Kibera. We say what we are good at, and we say what we are not.",
  draft: false,
  cta: { label: "Start a conversation", href: "/contact" },
  sections: [
    {
      id: "what-we-need",
      heading: "What we actually need",
      paragraphs: [
        "Unrestricted funding is the most useful thing a partner can give us. It lets a participant move between programmes as her needs change, rather than being shaped by whichever grant is easiest to apply for.",
        "We are also open to institutional partners who can help with safeguarding training, legal or registration costs, or professional services we genuinely cannot afford.",
      ],
      bullets: [
        "Multi-year unrestricted funding, which is what makes continuity possible.",
        "Help with our BRS NGO registration and fiscal sponsorship.",
        "Safeguarding, data-protection and fundraising training.",
        "Pro bono legal and financial review.",
      ],
    },
    {
      id: "honest-position",
      heading: "What we cannot offer yet",
      paragraphs: [
        "We would rather this page be useful than flattering. The following are real limitations, not modesty.",
      ],
      bullets: [
        "We are not yet able to issue receipts that are tax deductible in every jurisdiction.",
        "We cannot yet report cost-per-participant, because our overhead allocation is not settled.",
        "We are not yet able to accept unrestricted gifts through every international platform.",
        "We do not yet have formal partnerships with secondary schools, so we cannot name them.",
      ],
    },
    {
      id: "due-diligence",
      heading: "Due diligence",
      paragraphs: [
        "Institutional funders and diaspora partners will want documentation before they commit. We would rather you ask for it early than discover a gap late.",
        "What we can provide now: our safeguarding policy, our privacy notice, programme figures with the period each one covers, and our methodology for counting. What is still being prepared is marked as such rather than left out.",
      ],
    },
  ],
};

/*
 * VOLUNTEER_PAGE used to live here.
 *
 * Removed when /volunteer left `ProseRoute` (migration 0026). Two tables had
 * been wired on the admin side and unreachable from the public site:
 * `volunteer_roles` was read only by /admin/volunteer-roles, and
 * `volunteer_applications` had an inbox, status transitions and a dashboard
 * count with nothing public that ever wrote a row.
 *
 * The remaining prose pages are partner, annual-report and news. When one of
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

export const NEWS_PAGE: ProsePage = {
  slug: "news",
  title: "News",
  eyebrow: "News",
  lede: "Updates from the organisation: programme news, announcements, and what we are learning.",
  draft: true,
  sections: [
    {
      id: "nothing-yet",
      heading: "Nothing published yet",
      paragraphs: [
        "We have not posted any news yet. Rather than fill this page with placeholder entries, it stays empty until there is something real to say.",
        "If you want to hear from us, the fastest route is WhatsApp or the contact form, we do not run an email newsletter yet.",
      ],
    },
    {
      id: "what-belongs",
      heading: "What will appear here",
      bullets: [
        "Programme announcements and changes.",
        "Registration and governance milestones.",
        "What we have learned from a reporting period.",
        "Requests for volunteers or partners.",
      ],
    },
  ],
};

/** Look up a prose page by slug. */
export const PROSE_PAGES: Record<string, ProsePage> = {
  partner: PARTNER_PAGE,
  "annual-report": ANNUAL_REPORT_PAGE,
  news: NEWS_PAGE,
};
