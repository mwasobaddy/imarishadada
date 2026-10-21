import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSection } from "@/lib/data/sections";
import type { SiteSection } from "@/lib/data/types";

/**
 * Partner page readers.
 *
 * ## Why the list is filtered twice
 *
 * The anonymous role can only read `partners` rows that are active, not test, and
 * carry written permission (`partners_anon_read`, migration 0027). The query below
 * also says so. The database policy is the boundary; repeating the filter here
 * means a future change to the policy cannot silently widen what this page shows.
 *
 * ## Why there is no placeholder for an empty list
 *
 * The programme pages show labelled empty slots for partner schools. That is a
 * separate decision, flagged for review. Here an empty list hides the whole
 * section, because a row of empty logo boxes on a funder's page reads as a claim
 * that partners exist.
 */

export type PublicPartner = {
  id: string;
  name: string;
  description: string;
  logoPath: string | null;
  logoAlt: string | null;
  websiteUrl: string | null;
};

export async function getPublicPartners(): Promise<PublicPartner[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("partners");

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient()
    .from("partners")
    .select("id, name, description, logo_path, logo_alt, website_url")
    .eq("active", true)
    .eq("is_test", false)
    .not("permission_confirmed_at", "is", null)
    .order("sort_order");

  if (error) {
    console.error("[data] partners query failed:", error.message);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    description: (p.description as string) ?? "",
    logoPath: (p.logo_path as string | null) ?? null,
    logoAlt: (p.logo_alt as string | null) ?? null,
    websiteUrl: (p.website_url as string | null) ?? null,
  }));
}

/** The page's sections, keyed. */
export async function getPartnerSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "partner-hero",
    "partner-need",
    "partner-cannot",
    "partner-dd",
    "partner-partners",
    "partner-form",
    "partner-direct",
  ];
  return Object.fromEntries(
    await Promise.all(keys.map(async (key) => [key, await getSection(key)] as const)),
  );
}
