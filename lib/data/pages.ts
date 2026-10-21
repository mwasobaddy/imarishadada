/**
 * Static page content.
 *
 * These pages are long-form prose with no per-request data, so their content
 * lives here as typed data rather than being hardcoded in JSX. That keeps the
 * page components structural and makes the copy reviewable in one place.
 *
 * Anything that needs an admin override or a database row does NOT belong here.
 */

/** An FAQ entry. `group` drives the filter chips on `/faq`. */
export type FaqEntry = {
  question: string;
  answer: string;
  group: "Giving" | "Programmes" | "About us" | "Safeguarding";
};

export const FAQS: FaqEntry[] = [
  {
    group: "Giving",
    question: "Do you offer monthly giving?",
    answer:
      "Yes, every amount on our giving ladder can be given monthly. Monthly gifts are what keep a mentor in a girl's life through the whole school year, rather than through one term.",
  },
  {
    group: "Giving",
    question: "Can I give from outside Kenya?",
    answer:
      "Yes, by card. You choose your currency at checkout and we record both the amount you gave and the Kenyan shilling equivalent, so your receipt is accurate either way.",
  },
  {
    group: "Giving",
    question: "Do you accept in-kind donations?",
    answer:
      "Please message us first. We cannot always accept physical goods, and an unasked-for donation is often unusable.",
  },
  {
    group: "Giving",
    question: "Is my donation tax deductible?",
    answer:
      "A receipt is issued for every donation. Whether it is deductible depends on your country and on our registration status, and we will tell you the truth about it rather than imply a benefit we cannot deliver.",
  },
  {
    group: "Programmes",
    question: "Who do you work with?",
    answer:
      "Young mothers aged 16 and over returning to school, and girls aged 9 to 16 in safe-space sessions. Both groups are in Kibera, Nairobi.",
  },
  {
    group: "Programmes",
    question: "How long does a participant stay with you?",
    answer:
      "It depends on what she needs. A re-entry package runs for a school year. Dada Space is open-ended: a girl can attend for as long as she finds it useful.",
  },
  {
    group: "Programmes",
    question: "Can I visit a session?",
    answer:
      "Ask us first. Sessions involving minors need consent and notice, and some conversations should not have visitors in the room.",
  },
  {
    group: "About us",
    question: "Are you a registered organisation?",
    answer:
      "Our BRS NGO registration number is being issued and will be published as soon as it is. Institutional and diaspora donors should expect to see it here.",
  },
  {
    group: "About us",
    question: "How is money spent?",
    answer:
      "Unrestricted gifts go where the need is greatest that term. Restricted gifts fund the outcome label you selected, for example a single re-entry package, and we report against that specific figure.",
  },
  {
    group: "Safeguarding",
    question: "How do you protect the girls you work with?",
    answer:
      "Two-adult sessions, safe recruitment with references and training, a code of conduct, and a named safeguarding officer. Our full policy is published on this site.",
  },
  {
    group: "Safeguarding",
    question: "Why are some names missing from your stories?",
    answer:
      "Because consent is theirs to give and theirs to withdraw. Every story carries a consent tier, and the tier decides what we publish, not our judgement on the day.",
  },
];

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

export const VOLUNTEER_PAGE: ProsePage = {
  slug: "volunteer",
  title: "Volunteer with us",
  eyebrow: "Volunteer",
  lede: "Most of what we do cannot be done from a distance, and that is the point. Volunteers here work alongside participants, not on their behalf.",
  draft: true,
  cta: { label: "Ask about volunteering", href: "/contact" },
  sections: [
    {
      id: "roles",
      heading: "Where help is genuinely useful",
      paragraphs: [
        "We list roles only when we have a real need and someone able to supervise. A vague volunteering offer wastes your time and ours.",
      ],
      bullets: [
        "Mentorship for women who have been through re-entry or run a business.",
        "Grant writing and institutional fundraising.",
        "Bookkeeping and data admin.",
        "Photography, design and translation with consent training first.",
        "Professional services: legal, finance, safeguarding training.",
      ],
    },
    {
      id: "safeguarding",
      heading: "Safeguarding applies to volunteers too",
      paragraphs: [
        "Anyone working directly with participants completes reference checks and safeguarding training before their first session, signs a code of conduct, and works under the two-adult rule.",
        "We are not able to accept volunteers for one-off visits to sessions involving minors.",
      ],
    },
    {
      id: "commitment",
      heading: "What we ask of you",
      paragraphs: [
        "Reliability matters more than enthusiasm. A mentor who stops attending damages a girl's trust more than never starting.",
      ],
      bullets: [
        "Commit to at least six months if you are mentoring.",
        "Tell us early if you need to step away, so we can hand over properly.",
        "Accept that safeguarding concerns are handled by our policy, not by informal agreement.",
      ],
    },
  ],
};

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
  volunteer: VOLUNTEER_PAGE,
  "annual-report": ANNUAL_REPORT_PAGE,
  news: NEWS_PAGE,
};
