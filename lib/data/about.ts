import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getProgrammes } from "@/lib/data/home";
import { getSection } from "@/lib/data/sections";
import type { CoreValue, SiteSection, TeamMember } from "@/lib/data/types";

/**
 * Mirrors the `core_values` rows in supabase/migrations/0002_phase1_seed.sql
 * so the page renders before Supabase is configured. Same caveat as the home
 * seed: this is a development fallback, not a substitute for the database.
 */
const SEED_VALUES: CoreValue[] = [
  {
    slug: "sisterhood",
    name: "Sisterhood",
    description: "Building supportive communities where girls uplift one another.",
    sortOrder: 1,
  },
  {
    slug: "integrity",
    name: "Integrity",
    description: "Acting with honesty, transparency, and accountability.",
    sortOrder: 2,
  },
  {
    slug: "inclusivity",
    name: "Inclusivity",
    description:
      "Ensuring every girl has an equal opportunity regardless of her background.",
    sortOrder: 3,
  },
  {
    slug: "dignity",
    name: "Dignity",
    description: "Respecting the worth and rights of every individual.",
    sortOrder: 4,
  },
  {
    slug: "authenticity",
    name: "Authenticity",
    description: "Remaining true to our values and the communities we serve.",
    sortOrder: 5,
  },
  {
    slug: "partnership",
    name: "Partnership",
    description:
      "Collaborating with communities, institutions, and partners to maximise impact.",
    sortOrder: 6,
  },
];

/**
 * Team and governance entries. Intentionally empty — no member may be
 * published without a recorded consent on file. See `team_members.consent_recorded`.
 */
const SEED_TEAM: TeamMember[] = [];

export async function getCoreValues(): Promise<CoreValue[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("core-values");

  if (!isSupabaseConfigured()) return SEED_VALUES;

  const { data, error } = await createClient()
    .from("core_values")
    .select("slug, name, description, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] core_values query failed:", error.message);
    return SEED_VALUES;
  }
  if (!data?.length) return SEED_VALUES;

  return data.map((r) => ({
    slug: r.slug as string,
    name: r.name as string,
    description: r.description as string,
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("team-members");

  if (!isSupabaseConfigured()) return SEED_TEAM;

  const { data, error } = await createClient()
    .from("team_members")
    .select("slug, name, role, title, department, bio, photo_path, safeguarding_officer, social_links, sort_order")
    .eq("active", true)
    .eq("consent_recorded", true)
    .order("sort_order");

  if (error) {
    console.error("[data] team_members query failed:", error.message);
    return SEED_TEAM;
  }

  return (data ?? []).map((r) => ({
    slug: r.slug as string,
    name: r.name as string,
    role: r.role as string,
    title: (r.title as string | null) ?? null,
    department: (r.department as string | null) ?? null,
    bio: (r.bio as string | null) ?? null,
    socialLinks: (r.social_links as Record<string, string> | null) ?? null,
    photoPath: (r.photo_path as string | null) ?? null,
    safeguardingOfficer: (r.safeguarding_officer as boolean) ?? false,
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

export async function getAboutSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "about-hero",
    "about-story",
    "about-vision",
    "about-mission",
    "about-values",
    "about-team",
    "about-work",
    "about-approach",
    "about-carousel",
  ];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}

export const getAboutProgrammes = getProgrammes;
