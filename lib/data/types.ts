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
  bio: string | null;
  photoPath: string | null;
  safeguardingOfficer: boolean;
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
