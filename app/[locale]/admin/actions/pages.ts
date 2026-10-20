"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";
import { SECTIONS_TAG, sectionTag } from "@/lib/data/sections";
import type { AuditSnapshot, Update } from "@/lib/supabase/row-types";

/**
 * Page and section copy.
 *
 * ## The one rule that matters here
 *
 * Every write revalidates the tags the public reader assigned. If a write lands
 * without a matching `revalidateTag`, the editor sees their change "not save" —
 * the database is correct but the page keeps serving the old copy. That is the
 * single most likely bug in this feature, so it is centralised in
 * `revalidateSection()` and never inlined.
 *
 * ## Why the reads are not cached
 *
 * The public reader in `lib/data/sections.ts` is `'use cache'`. The editor must
 * see its own writes immediately, so admin reads go straight to the service
 * client instead. Two readers, two jobs.
 */

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

/**
 * Bust the cache for one section.
 *
 * `'max'` means stale content may be served for as long as the profile allows
 * while the cache revalidates in the background. That is the recommended value
 * and it keeps the page static — the alternative blocks a visitor while the
 * cache refills.
 */
function revalidateSection(sectionKey: string, pageKey: string | null) {
  revalidateTag(sectionTag(sectionKey), "max");
  revalidateTag(SECTIONS_TAG, "max");
  if (pageKey) revalidateTag(`page:${pageKey}`, "max");
}

const SELECT =
  "section_key, page_key, eyebrow, heading, body, body_secondary, steps, images, cta_label, cta_href, cta_secondary_label, cta_secondary_href, stat_line, image_path, image_alt, seo_title, seo_description, sort_order, active";

// ---------------------------------------------------------------------------
// Reads — uncached, service client, for the editor
// ---------------------------------------------------------------------------

export async function getPages() {
  await requirePermission("pages", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPageWithSections(pageKey: string) {
  await requirePermission("pages", "read");
  const supabase = createServiceClient();

  const [{ data: page, error: pageError }, { data: sections, error: sectionError }] =
    await Promise.all([
      supabase.from("site_pages").select("*").eq("page_key", pageKey).maybeSingle(),
      supabase
        .from("site_sections")
        .select(SELECT)
        .eq("page_key", pageKey)
        .order("sort_order"),
    ]);

  if (pageError) throw new Error(pageError.message);
  if (sectionError) throw new Error(sectionError.message);

  return { page, sections: sections ?? [] };
}

/** Every section key that exists, for the "unassigned" bucket. */
export async function getOrphanSections() {
  await requirePermission("pages", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("site_sections")
    .select(SELECT)
    .is("page_key", null)
    .order("section_key");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Counts per page, for the page list. */
export async function getSectionCounts(): Promise<Record<string, number>> {
  await requirePermission("pages", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("site_sections").select("page_key");
  if (error) throw new Error(error.message);

  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = row.page_key ?? "__unassigned";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type SectionPatch = {
  eyebrow?: string | null;
  heading?: string;
  body?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_href?: string | null;
  stat_line?: string | null;
  body_secondary?: string | null;
  steps?: { title: string; description: string }[] | null;
  images?: { path: string; alt: string }[] | null;
  image_path?: string | null;
  image_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  active?: boolean;
};

export async function updateSection(sectionKey: string, patch: SectionPatch) {
  await requirePermission("pages", "update");
  const supabase = createServiceClient();

  // A section with no heading renders an empty element in the outline. That is
  // an accessibility defect, so it is rejected here rather than in the form —
  // a form can be bypassed, an action cannot.
  if (patch.heading !== undefined && !patch.heading.trim()) {
    throw new Error("A section needs a heading. An empty heading breaks the page outline.");
  }

  // Alt text is required whenever an image is set. Same reasoning: a missing
  // alt is a defect, not a warning.
  if (patch.image_path && !patch.image_alt?.trim()) {
    throw new Error("Alt text is required when a section has an image.");
  }

  // Same rule for a list of photographs. Checked here rather than in the form
  // because a form can be bypassed; an action cannot.
  if (
    patch.images?.some((image) => !image.path?.trim() || !image.alt?.trim())
  ) {
    throw new Error(
      "Every photograph needs an image and alt text. Remove the empty row or fill it in.",
    );
  }

  // Metadata is a separate permission — a careless title costs rankings.
  const touchesSeo = patch.seo_title !== undefined || patch.seo_description !== undefined;
  if (touchesSeo && !(await hasPermission("pages", "seo"))) {
    throw new Error("Permission denied: pages:seo");
  }

  const { data: before, error: readError } = await supabase
    .from("site_sections")
    .select(SELECT)
    .eq("section_key", sectionKey)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!before) throw new Error(`No section named "${sectionKey}"`);

  const { data: after, error } = await supabase
    .from("site_sections")
    .update(patch as Update<"site_sections">)
    .eq("section_key", sectionKey)
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "site_sections",
    row_id: null,
    before: before as unknown as AuditSnapshot,
    after: after as unknown as AuditSnapshot,
  });

  revalidateSection(sectionKey, before.page_key);
  revalidatePath("/admin/pages");

  return after;
}

export async function toggleSection(sectionKey: string, active: boolean) {
  await requirePermission("pages", "publish");
  const supabase = createServiceClient();

  const { data: before, error: readError } = await supabase
    .from("site_sections")
    .select("page_key")
    .eq("section_key", sectionKey)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!before) throw new Error(`No section named "${sectionKey}"`);

  const { error } = await supabase
    .from("site_sections")
    .update({ active })
    .eq("section_key", sectionKey);

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: active ? "publish" : "update",
    table_name: "site_sections",
    row_id: null,
    after: { section_key: sectionKey, active } as unknown as AuditSnapshot,
  });

  revalidateSection(sectionKey, before.page_key);
  revalidatePath("/admin/pages");

  return { sectionKey, active };
}
