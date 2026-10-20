"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getTeamMembers() {
  await requirePermission("team_members", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("team_members").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTeamMember(data: Record<string, unknown>) {
  await requirePermission("team_members", "create");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("team_members").insert(data as any).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "team_members", row_id: row.id, after: row as any });
  revalidatePath("/admin/content/team");
  return row;
}

export async function updateTeamMember(id: string, data: Record<string, unknown>) {
  await requirePermission("team_members", "update");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("team_members").update(data as any).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content/team");
  return row;
}

export async function deleteTeamMember(id: string) {
  await requirePermission("team_members", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content/team");
}
