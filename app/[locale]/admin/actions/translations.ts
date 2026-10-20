"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getTranslations() {
  await requirePermission("translations", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("translations").select("*").order("table_name, row_id, locale");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTranslation(data: Record<string, unknown>) {
  await requirePermission("translations", "create");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("translations").insert(data as any).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/translations");
  return row;
}

export async function updateTranslation(id: string, data: Record<string, unknown>) {
  await requirePermission("translations", "update");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("translations").update(data as any).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/translations");
  return row;
}

export async function deleteTranslation(id: string) {
  await requirePermission("translations", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("translations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/translations");
}

export async function reviewTranslation(id: string) {
  await requirePermission("translations", "publish");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("translations")
    .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/translations");
  return row;
}
