import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSection } from "@/lib/data/sections";
import type { SiteSection } from "@/lib/data/types";

/**
 * Volunteer roles.
 *
 * ## Why this reader is new
 *
 * `volunteer_roles` has existed since migration 0007 with a working admin editor
 * at `/admin/volunteer-roles`, and **nothing public ever read it.** The page
 * rendered a static constant. Same shape as `faqs`, `home-giving`, the donate
 * settings and `getProgrammeStories`.
 *
 * The table carries `positions_available` and `positions_filled`, so a role can
 * be full without being closed — that is worth showing rather than hiding,
 * because "we have four mentors and one place left" is a more honest and more
 * persuasive sentence than "Mentor".
 */

export type VolunteerRole = {
  id: string;
  title: string;
  description: string;
  commitment: string | null;
  requirements: string | null;
  location: string | null;
  timeCommitment: string | null;
  skillsNeeded: string[];
  positionsAvailable: number;
  positionsFilled: number;
  sortOrder: number;
};

/** Places still open on a role. Never negative, whatever the database says. */
export function placesRemaining(role: {
  positionsAvailable: number;
  positionsFilled: number;
}): number {
  return Math.max(0, role.positionsAvailable - role.positionsFilled);
}

/**
 * Open roles, in editorial order.
 *
 * A role with no places left is still returned: it is full, not closed, and the
 * page says so. Filtering it out would make the list silently shorter and give
 * an applicant no way to tell "we do not need mentors" from "we need four more".
 */
export async function getVolunteerRoles(): Promise<VolunteerRole[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("volunteer-roles");

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient()
    .from("volunteer_roles")
    .select(
      "id, title, description, commitment, requirements, location, time_commitment, skills_needed, positions_available, positions_filled, sort_order",
    )
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] volunteer_roles query failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? "",
    commitment: (r.commitment as string | null) ?? null,
    requirements: (r.requirements as string | null) ?? null,
    location: (r.location as string | null) ?? null,
    timeCommitment: (r.time_commitment as string | null) ?? null,
    skillsNeeded: (r.skills_needed as string[] | null) ?? [],
    positionsAvailable: (r.positions_available as number) ?? 0,
    positionsFilled: (r.positions_filled as number) ?? 0,
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

/** The page's sections, keyed. */
export async function getVolunteerSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "volunteer-hero",
    "volunteer-roles",
    "volunteer-roles-empty",
    "volunteer-process",
    "volunteer-safeguarding",
    "volunteer-form",
    "volunteer-remote",
  ];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}
