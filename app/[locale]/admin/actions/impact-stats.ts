"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";
import { recordAudit } from "@/lib/admin/audit";

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

export async function createImpactStat(data: Insert<"impact_stats">) {
  await requirePermission("impact_stats", "create");
  const supabase = createServiceClient();
  const { data: stat, error } = await supabase.from("impact_stats").insert(data).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "create", tableName: "impact_stats", rowId: stat.id, after: stat as unknown as AuditSnapshot });
  revalidateTag("impact-stats", "max");
  revalidatePath("/admin/impact");
  return stat;
}

export async function updateImpactStat(id: string, data: Insert<"impact_stats">) {
  await requirePermission("impact_stats", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("impact_stats").select("*").eq("id", id).single();
  const { data: stat, error } = await supabase.from("impact_stats").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "update", tableName: "impact_stats", rowId: id, before: before as unknown as AuditSnapshot, after: stat as unknown as AuditSnapshot });
  revalidateTag("impact-stats", "max");
  revalidatePath("/admin/impact");
  return stat;
}

export async function deleteImpactStat(id: string) {
  await requirePermission("impact_stats", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("impact_stats").select("*").eq("id", id).single();
  const { error } = await supabase.from("impact_stats").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({ action: "delete", tableName: "impact_stats", rowId: id, before: before as unknown as AuditSnapshot });
  revalidateTag("impact-stats", "max");
  revalidatePath("/admin/impact");
}
