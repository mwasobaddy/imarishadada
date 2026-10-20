"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getMedia() {
  await requirePermission("media", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMediaRecord(data: Insert<"media">) {
  await requirePermission("media", "create");
  const supabase = createServiceClient();
  const { data: media, error } = await supabase.from("media").insert(data).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "media", row_id: media.id, after: media as unknown as AuditSnapshot });
  revalidateTag("media", "max");
  revalidatePath("/admin/media");
  return media;
}

export async function updateMedia(id: string, data: Insert<"media">) {
  await requirePermission("media", "update");
  const supabase = createServiceClient();
  const { data: media, error } = await supabase.from("media").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("media", "max");
  revalidatePath("/admin/media");
  return media;
}

export async function deleteMedia(id: string, filePath: string) {
  await requirePermission("media", "delete");
  const supabase = createServiceClient();
  // Delete from storage
  await supabase.storage.from("public-media").remove([filePath]);
  await supabase.storage.from("story-media").remove([filePath]);
  await supabase.storage.from("documents").remove([filePath]);
  // Delete record
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "delete", table_name: "media", row_id: id });
  revalidateTag("media", "max");
  revalidatePath("/admin/media");
}

export async function getSignedUrl(bucket: string, path: string) {
  await requirePermission("media", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) throw new Error(error.message);
  return data?.signedUrl ?? null;
}
