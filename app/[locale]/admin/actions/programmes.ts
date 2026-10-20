"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getProgrammes() {
  await requirePermission("programmes", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("programmes").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProgramme(id: string) {
  await requirePermission("programmes", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("programmes").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProgramme(data: Insert<"programmes">) {
  await requirePermission("programmes", "create");
  const supabase = createServiceClient();
  if (!data.slug && data.title) {
    data.slug = (data.title as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  const { data: row, error } = await supabase.from("programmes").insert(data).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "programmes", row_id: row.id, after: row as unknown as AuditSnapshot });
  revalidatePath("/admin/content/programmes");
  return row;
}

export async function updateProgramme(id: string, data: Insert<"programmes">) {
  await requirePermission("programmes", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("programmes").select("*").eq("id", id).single();
  const { data: row, error } = await supabase.from("programmes").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "update", table_name: "programmes", row_id: id, before: before as unknown as AuditSnapshot, after: row as unknown as AuditSnapshot });
  revalidatePath("/admin/content/programmes");
  revalidatePath(`/programmes/${row.slug}`);
  return row;
}

export async function deleteProgramme(id: string) {
  await requirePermission("programmes", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("programmes").select("*").eq("id", id).single();
  const { error } = await supabase.from("programmes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "delete", table_name: "programmes", row_id: id, before: before as unknown as AuditSnapshot });
  revalidatePath("/admin/content/programmes");
}

export async function toggleProgramme(id: string, active: boolean) {
  await requirePermission("programmes", "publish");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("programmes").update({ active }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content/programmes");
  return row;
}
