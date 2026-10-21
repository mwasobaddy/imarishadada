"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";
import { createServiceClient } from "@/lib/supabase/client";
import { titleLeaksName } from "@/lib/stories/copy";
import type { AuditSnapshot, Insert, Update, WithOptionalSlug } from "@/lib/supabase/row-types";
import { recordAudit } from "@/lib/admin/audit";


async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

/**
 * Refuse an anonymised story whose title repeats the participant's name.
 *
 * ## The gap this closes
 *
 * The consent tier withholds the *attribution* — `getStories` nulls it for
 * `anonymised` so no card and no page can render a name. But it knows nothing
 * about the **title**, and the roadmap requires that an anonymised story
 * *"never exposes the name in `<title>`, `<meta description>`, OG tags, or
 * JSON-LD"*.
 *
 * So this was reachable, and nothing stopped it: set the tier to `anonymised`,
 * leave the title as "Amina's story", publish. The story's entire promise is
 * that Amina cannot be identified, and her name is in the search result.
 *
 * ## A gate, not a warning
 *
 * The project's rule for safeguards is that they are gates. A warning on a form
 * is dismissed; a rejected write is not. The message names the field and the
 * reason, so it is actionable rather than mysterious.
 *
 * The runtime defence is separate and stronger — `generateMetadata` never uses
 * an anonymised story's title at all — so this is the second layer, not the
 * only one.
 */
function assertAnonymisedTitleSafe(data: {
  consent_tier?: string | null;
  title?: string | null;
  attribution?: string | null;
}) {
  if (data.consent_tier !== "anonymised") return;
  if (!data.title) return;

  if (titleLeaksName(data.title, data.attribution ?? null)) {
    throw new Error(
      "This story is anonymised, but the title contains the participant's name. " +
        "Change the title so it does not identify her, or record her consent to be named " +
        "and move the story to a named tier.",
    );
  }
}

export async function createStory(data: WithOptionalSlug<"stories">) {
  await requirePermission("stories", "create");
  const supabase = createServiceClient();

  assertAnonymisedTitleSafe(data);

  // The slug is NOT NULL in the database, but the editor may leave it blank
  // and expect one to be derived from the title.
  const slug =
    data.slug ||
    (data.title
      ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : "");

  const payload: Insert<"stories"> = { ...data, slug };
  const { data: story, error } = await supabase
    .from("stories")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Audit log
  await recordAudit({
    action: "create",
    tableName: "stories",
    rowId: story.id,
    after: story as unknown as AuditSnapshot,
  });

  revalidateTag("stories", "max");
  revalidatePath("/admin/content/stories");
  return story;
}

export async function updateStory(id: string, data: Update<"stories">) {
  await requirePermission("stories", "update");
  const supabase = createServiceClient();

  // Fetch current for audit
  const { data: before } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  // The patch may carry only some fields, so the check runs against the merged
  // row. Checking the patch alone would let an editor anonymise a story by
  // changing only `consent_tier`, and the title it was already carrying would
  // never be examined.
  assertAnonymisedTitleSafe({
    consent_tier: (data.consent_tier ?? before?.consent_tier) as string | null,
    title: (data.title ?? before?.title) as string | null,
    attribution: (data.attribution ?? before?.attribution) as string | null,
  });

  const { data: story, error } = await supabase
    .from("stories")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({
    action: "update",
    tableName: "stories",
    rowId: id,
    before: before as unknown as AuditSnapshot,
    after: story as unknown as AuditSnapshot,
  });

  revalidateTag("stories", "max");
  revalidatePath("/admin/content/stories");
  revalidateTag("stories", "max");
  revalidatePath(`/admin/content/stories/${story.slug}`);
  return story;
}

export async function deleteStory(id: string) {
  await requirePermission("stories", "delete");
  const supabase = createServiceClient();

  const { data: before } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("stories").delete().eq("id", id);

  if (error) throw new Error(error.message);

  await recordAudit({
    action: "delete",
    tableName: "stories",
    rowId: id,
    before: before as unknown as AuditSnapshot,
  });

  revalidateTag("stories", "max");
  revalidatePath("/admin/content/stories");
}

export async function publishStory(id: string) {
  await requirePermission("stories", "publish");
  const supabase = createServiceClient();

  const { data: story, error } = await supabase
    .from("stories")
    .update({
      published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({
    action: "publish",
    tableName: "stories",
    rowId: id,
    after: story as unknown as AuditSnapshot,
  });

  revalidateTag("stories", "max");
  revalidatePath("/admin/content/stories");
  return story;
}

export async function unpublishStory(id: string) {
  await requirePermission("stories", "publish");
  const supabase = createServiceClient();

  const { data: story, error } = await supabase
    .from("stories")
    .update({ published: false })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({ action: "update", tableName: "stories", rowId: id, after: story as unknown as AuditSnapshot, metadata: { published: false } as unknown as AuditSnapshot });

  revalidateTag("stories", "max");
  revalidatePath("/admin/content/stories");
  return story;
}

export async function scheduleStory(id: string, scheduledAt: string) {
  await requirePermission("stories", "publish");
  const supabase = createServiceClient();

  const { data: story, error } = await supabase
    .from("stories")
    .update({ scheduled_at: scheduledAt })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({ action: "update", tableName: "stories", rowId: id, after: story as unknown as AuditSnapshot, metadata: { scheduled_at: scheduledAt } as unknown as AuditSnapshot });

  revalidateTag("stories", "max");
  revalidatePath("/admin/content/stories");
  return story;
}

export async function getStories() {
  await requirePermission("stories", "read");
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("stories")
    .select("*, programmes(title, slug)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getStory(id: string) {
  await requirePermission("stories", "read");
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("stories")
    .select("*, programmes(title, slug)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
