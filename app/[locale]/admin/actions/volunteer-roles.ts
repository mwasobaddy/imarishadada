"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";

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
  await supabase.from("audit_log").insert({ action: "create", table_name: "volunteer_roles", row_id: row.id, after: row as unknown as AuditSnapshot });
  revalidatePath("/admin/volunteer-roles");
  return row;
}

export async function updateVolunteerRole(id: string, data: Insert<"volunteer_roles">) {
  await requirePermission("volunteer_roles", "update");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("volunteer_roles").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/volunteer-roles");
  return row;
}

export async function deleteVolunteerRole(id: string) {
  await requirePermission("volunteer_roles", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("volunteer_roles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/volunteer-roles");
}

export async function toggleVolunteerRole(id: string, active: boolean) {
  await requirePermission("volunteer_roles", "publish");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("volunteer_roles").update({ active }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/volunteer-roles");
  return row;
}
