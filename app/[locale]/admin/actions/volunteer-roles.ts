"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";
import { recordAudit } from "@/lib/admin/audit";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getVolunteerRoles() {
  await requirePermission("volunteer_roles", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("volunteer_roles").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createVolunteerRole(data: Insert<"volunteer_roles">) {
  await requirePermission("volunteer_roles", "create");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("volunteer_roles").insert(data).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "create", tableName: "volunteer_roles", rowId: row.id, after: row as unknown as AuditSnapshot });
  revalidateTag("volunteer-roles", "max");
  revalidatePath("/admin/volunteer-roles");
  return row;
}

export async function updateVolunteerRole(id: string, data: Insert<"volunteer_roles">) {
  await requirePermission("volunteer_roles", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("volunteer_roles").select("*").eq("id", id).maybeSingle();
  const { data: row, error } = await supabase.from("volunteer_roles").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "update", tableName: "volunteer_roles", rowId: id, before: before as unknown as AuditSnapshot, after: row as unknown as AuditSnapshot });
  revalidateTag("volunteer-roles", "max");
  revalidatePath("/admin/volunteer-roles");
  return row;
}

export async function deleteVolunteerRole(id: string) {
  await requirePermission("volunteer_roles", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("volunteer_roles").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("volunteer_roles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({ action: "delete", tableName: "volunteer_roles", rowId: id, before: before as unknown as AuditSnapshot });
  revalidateTag("volunteer-roles", "max");
  revalidatePath("/admin/volunteer-roles");
}

export async function toggleVolunteerRole(id: string, active: boolean) {
  await requirePermission("volunteer_roles", "publish");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("volunteer_roles").select("*").eq("id", id).maybeSingle();
  const { data: row, error } = await supabase.from("volunteer_roles").update({ active }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "update", tableName: "volunteer_roles", rowId: id, before: before as unknown as AuditSnapshot, after: row as unknown as AuditSnapshot });
  revalidateTag("volunteer-roles", "max");
  revalidatePath("/admin/volunteer-roles");
  return row;
}
