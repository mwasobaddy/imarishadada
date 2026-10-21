export type Programme = {
  slug: string;
  title: string;
  summary: string;
  /** Stable key, unused for rendering now that cards are image-based. */
  icon: string;
  stat: string | null;
  statLabel: string | null;
  /** Null until a consented photograph exists. */
  imagePath: string | null;
  imageAlt: string | null;
  sortOrder: number;
};

/**
 * Editorial copy for a page section. Managed in `site_sections`, so a heading
 * can change without a deploy — see the rationale on that table.
 */
export type SiteSection = {
  key: string;
  eyebrow: string | null;
  heading: string;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  /** Second CTA — the hero has "Donate" and "See our impact". */
  ctaSecondaryLabel?: string | null;
  ctaSecondaryHref?: string | null;
  /** Optional single line of figures shown with the section. */
  statLine?: string | null;
  /** Optional second paragraph, for two-column sections. */
  bodySecondary?: string | null;
  /** Ordered steps inside a section. Same shape as `ProgrammeOutcome[]`. */
  steps?: ProgrammeOutcome[] | null;
  /** Ordered photographs for a carousel or gallery. */
  images?: { path: string; alt: string; caption?: string }[] | null;
  imagePath?: string | null;
  imageAlt?: string | null;
  /**
   * Whether the editor has this section switched on.
   *
   * Carried on the resolved section rather than filtered in the query, because
   * "the row is hidden" and "the row does not exist yet" are different states
   * and only one of them should fall back to code. Filtering in SQL collapsed
   * them, so hiding a section silently restored the hardcoded copy instead of
   * removing the section — the opposite of what the button says.
   */
  active: boolean;
};

export type ImpactStat = {
  slug: string;
  value: number;
  label: string;
  /** Mandatory. An undated figure is a claim we cannot defend. */
  period: string;
  programmeSlug: string | null;
  sortOrder: number;
};

export type GivingTier = {
  /** Null in the development seed fallback; real rows always have one. */
  id: string | null;
  slug: string;
  amount: number;
  currency: string;
  cadence: "one_time" | "monthly";
  outcomeLabel: string;
  programmeSlug: string | null;
  sortOrder: number;
};

/**
 * A safeguarding control, not a content field.
 * See doc/roadmap/story-detail.md §5.
 */
export type ConsentTier = "named_full" | "named_no_face" | "anonymised";

export type FeaturedStory = {
  slug: string;
  /**
   * The story's own headline.
   *
   * Added because the homepage featured block was deriving its heading from the
   * slug — `"she-went-back-at-nineteen"` rendered as "she went back at
   * nineteen" on the live site, which is a placeholder that reads like a bug.
   */
  title: string;
  quote: string;
  attribution: string | null;
  consentTier: ConsentTier;
  imagePath: string | null;
};

/**
 * Expired consent is treated as anonymised. A girl consented at 11 is a
 * different situation from the same person at 19.
 */
export function effectiveConsentTier(
  tier: ConsentTier,
  consentExpiresAt: string | null,
  now: Date = new Date(),
): ConsentTier {
  if (tier === "anonymised") return "anonymised";
  if (consentExpiresAt && new Date(consentExpiresAt) <= now) return "anonymised";
  return tier;
}

/** Only `named_full` may render a photograph. Everything else must request nothing. */
export function mayRenderImage(tier: ConsentTier, consentExpiresAt: string | null, now?: Date): boolean {
  return effectiveConsentTier(tier, consentExpiresAt, now) === "named_full";
}

/** `anonymised` must not leak a name into title, meta, OG, or JSON-LD. */
export function mayRenderName(tier: ConsentTier, consentExpiresAt: string | null, now?: Date): boolean {
  return effectiveConsentTier(tier, consentExpiresAt, now) !== "anonymised";
}
/** A stated organisational commitment. Managed in `core_values`. */
export type CoreValue = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

/**
 * A public team or governance entry.
 *
 * `consentRecorded` is a publishing gate, not a content field — a member
 * without recorded consent must never render. The About page omits the team
 * section entirely when the table is empty rather than showing placeholders.
 */
export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  /** Optional honorific or qualification, e.g. "MSc". */
  title: string | null;
  department: string | null;
  bio: string | null;
  photoPath: string | null;
  safeguardingOfficer: boolean;
  /**
   * Social profiles. Keys are the fixed set in
   * `components/about/social-icon.tsx`, mirrored by a CHECK constraint on
   * `team_members.social_links`.
   */
  socialLinks: Record<string, string> | null;
  sortOrder: number;
};

/** One step of a programme's structure. Rendered in array order. */
export type ProgrammeOutcome = {
  title: string;
  description: string;
};

/**
 * A programme detail page.
 *
 * `body` is the long-form "why it matters" copy; `outcomes` is the ordered
 * step list. Both are admin-editable — a step can be reworded without a deploy.
 */
export type ProgrammePage = {
  /** Null in the development fallback that predates the database. */
  id: string | null;
  slug: string;
  title: string;
  summary: string;
  /** Long-form "why it matters" copy. Blank paragraphs are split on "\n\n". */
  body: string;
  /** Stable key, unused now that cards are image-based. */
  icon: string;
  stat: string | null;
  statLabel: string | null;
  /** Null until a consented photograph exists. */
  imagePath: string | null;
  imageAlt: string | null;
  outcomes: ProgrammeOutcome[];
  sortOrder: number;
};
