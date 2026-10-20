"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

export async function getGivingTiers() {
  await requirePermission("giving_tiers", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("giving_tiers")
    .select("*, programmes(title, slug)")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createGivingTier(data: Record<string, unknown>) {
  await requirePermission("giving_tiers", "create");
  const supabase = createServiceClient();
  const { data: tier, error } = await supabase
    .from("giving_tiers")
    .insert(data as any)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    action: "create",
    table_name: "giving_tiers",
    row_id: tier.id,
    after: tier as any,
  });
  revalidatePath("/admin/giving-tiers");
  return tier;
}

export async function updateGivingTier(id: string, data: Record<string, unknown>) {
  await requirePermission("giving_tiers", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("giving_tiers").select("*").eq("id", id).single();
  const { data: tier, error } = await supabase
    .from("giving_tiers")
    .update(data as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "giving_tiers",
    row_id: id,
    before: before as any,
    after: tier as any,
  });
  revalidatePath("/admin/giving-tiers");
  return tier;
}

export async function deleteGivingTier(id: string) {
  await requirePermission("giving_tiers", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("giving_tiers").select("*").eq("id", id).single();
  const { error } = await supabase.from("giving_tiers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    action: "delete",
    table_name: "giving_tiers",
    row_id: id,
    before: before as any,
  });
  revalidatePath("/admin/giving-tiers");
}

export async function toggleGivingTier(id: string, active: boolean) {
  await requirePermission("giving_tiers", "publish");
  const supabase = createServiceClient();
  const { data: tier, error } = await supabase
    .from("giving_tiers")
    .update({ active })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/giving-tiers");
  return tier;
}
