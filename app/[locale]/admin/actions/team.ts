"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
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

export async function createTeamMember(data: Insert<"team_members">) {
  await requirePermission("team_members", "create");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("team_members").insert(data).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "team_members", row_id: row.id, after: row as unknown as AuditSnapshot });
  revalidateTag("team-members", "max");
  revalidatePath("/admin/content/team");
  return row;
}

export async function updateTeamMember(id: string, data: Insert<"team_members">) {
  await requirePermission("team_members", "update");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("team_members").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("team-members", "max");
  revalidatePath("/admin/content/team");
  return row;
}

export async function deleteTeamMember(id: string) {
  await requirePermission("team_members", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("team-members", "max");
  revalidatePath("/admin/content/team");
}
