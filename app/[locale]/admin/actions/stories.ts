"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { hasPermission } from "@/lib/admin/permissions";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert, Update, WithOptionalSlug } from "@/lib/supabase/row-types";


async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

export async function createStory(data: WithOptionalSlug<"stories">) {
  await requirePermission("stories", "create");
  const supabase = createServiceClient();

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
  await supabase.from("audit_log").insert({
    action: "create",
    table_name: "stories",
    row_id: story.id,
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

  const { data: story, error } = await supabase
    .from("stories")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "stories",
    row_id: id,
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

  await supabase.from("audit_log").insert({
    action: "delete",
    table_name: "stories",
    row_id: id,
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

  await supabase.from("audit_log").insert({
    action: "publish",
    table_name: "stories",
    row_id: id,
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
