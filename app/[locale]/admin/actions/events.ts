"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert, Update, WithOptionalSlug } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getEvents() {
  await requirePermission("events", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEvent(data: WithOptionalSlug<"events">) {
  await requirePermission("events", "create");
  const supabase = createServiceClient();
  // The slug is NOT NULL in the database, but the editor may leave it blank
  // and expect one to be derived from the title.
  const slug =
    data.slug ||
    (data.title
      ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : "");

  const payload: Insert<"events"> = { ...data, slug };
  const { data: event, error } = await supabase.from("events").insert(payload).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "events", row_id: event.id, after: event as unknown as AuditSnapshot });
  revalidateTag("events", "max");
  revalidatePath("/admin/content/events");
  return event;
}

export async function updateEvent(id: string, data: Update<"events">) {
  await requirePermission("events", "update");
  const supabase = createServiceClient();
  const { data: event, error } = await supabase.from("events").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("events", "max");
  revalidatePath("/admin/content/events");
  return event;
}

export async function deleteEvent(id: string) {
  await requirePermission("events", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("events", "max");
  revalidatePath("/admin/content/events");
}

export async function publishEvent(id: string) {
  await requirePermission("events", "publish");
  const supabase = createServiceClient();
  const { data: event, error } = await supabase.from("events").update({ published: true, published_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("events", "max");
  revalidatePath("/admin/content/events");
  return event;
}

export async function unpublishEvent(id: string) {
  await requirePermission("events", "publish");
  const supabase = createServiceClient();
  const { data: event, error } = await supabase.from("events").update({ published: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("events", "max");
  revalidatePath("/admin/content/events");
  return event;
}

export async function getEvent(id: string) {
  await requirePermission("events", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}
