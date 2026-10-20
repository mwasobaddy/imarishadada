"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getImpactStats() {
  await requirePermission("impact_stats", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("impact_stats")
    .select("*, programmes(title, slug)")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createImpactStat(data: Record<string, unknown>) {
  await requirePermission("impact_stats", "create");
  const supabase = createServiceClient();
  const { data: stat, error } = await supabase.from("impact_stats").insert(data as any).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "impact_stats", row_id: stat.id, after: stat as any });
  revalidatePath("/admin/impact");
  return stat;
}

export async function updateImpactStat(id: string, data: Record<string, unknown>) {
  await requirePermission("impact_stats", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("impact_stats").select("*").eq("id", id).single();
  const { data: stat, error } = await supabase.from("impact_stats").update(data as any).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "update", table_name: "impact_stats", row_id: id, before: before as any, after: stat as any });
  revalidatePath("/admin/impact");
  return stat;
}

export async function deleteImpactStat(id: string) {
  await requirePermission("impact_stats", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("impact_stats").select("*").eq("id", id).single();
  const { error } = await supabase.from("impact_stats").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "delete", table_name: "impact_stats", row_id: id, before: before as any });
  revalidatePath("/admin/impact");
}
