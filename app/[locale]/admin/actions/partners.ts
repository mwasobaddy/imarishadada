"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getPartners() {
  await requirePermission("partners", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("partners").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPartner(data: Insert<"partners">) {
  await requirePermission("partners", "create");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("partners").insert(data).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "partners", row_id: row.id, after: row as unknown as AuditSnapshot });
  revalidateTag("partners", "max");
  revalidatePath("/admin/content/partners");
  return row;
}

export async function updatePartner(id: string, data: Insert<"partners">) {
  await requirePermission("partners", "update");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("partners").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("partners", "max");
  revalidatePath("/admin/content/partners");
  return row;
}

export async function deletePartner(id: string) {
  await requirePermission("partners", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("partners", "max");
  revalidatePath("/admin/content/partners");
}
