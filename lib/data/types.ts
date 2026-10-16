export type Programme = {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  stat: string | null;
  sortOrder: number;
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