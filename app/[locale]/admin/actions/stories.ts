"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { hasPermission } from "@/lib/admin/permissions";
import { createServiceClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type StoryInsert = Database["public"]["Tables"]["stories"]["Insert"];
type StoryUpdate = Database["public"]["Tables"]["stories"]["Update"];

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

export async function createStory(data: StoryInsert) {
  await requirePermission("stories", "create");
  const supabase = createServiceClient();

  // Auto-slug if not provided
  if (!data.slug && data.title) {
    data.slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  const { data: story, error } = await supabase
    .from("stories")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Audit log
  await supabase.from("audit_log").insert({
    action: "create",
    table_name: "stories",
    row_id: story.id,
    after: story as any,
  });

  revalidatePath("/admin/content/stories");
  return story;
}

export async function updateStory(id: string, data: StoryUpdate) {
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
    before: before as any,
    after: story as any,
  });

  revalidatePath("/admin/content/stories");
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
    before: before as any,
  });

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
    after: story as any,
  });

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
