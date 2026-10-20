"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Update, WithOptionalSlug } from "@/lib/supabase/row-types";
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

export async function createGivingTier(data: WithOptionalSlug<"giving_tiers">) {
  await requirePermission("giving_tiers", "create");
  const supabase = createServiceClient();

  // The slug is NOT NULL in the database; the editor may leave it blank and
  // expect one to be derived from the outcome label.
  const slug =
    data.slug ||
    (data.outcome_label
      ? data.outcome_label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      : "");

  const { data: tier, error } = await supabase
    .from("giving_tiers")
    .insert({ ...data, slug })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    action: "create",
    table_name: "giving_tiers",
    row_id: tier.id,
    after: tier as unknown as AuditSnapshot,
  });
  revalidateTag("giving-tiers", "max");
  revalidatePath("/admin/giving-tiers");
  return tier;
}

export async function updateGivingTier(id: string, data: Update<"giving_tiers">) {
  await requirePermission("giving_tiers", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("giving_tiers").select("*").eq("id", id).single();
  const { data: tier, error } = await supabase
    .from("giving_tiers")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "giving_tiers",
    row_id: id,
    before: before as unknown as AuditSnapshot,
    after: tier as unknown as AuditSnapshot,
  });
  revalidateTag("giving-tiers", "max");
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
    before: before as unknown as AuditSnapshot,
  });
  revalidateTag("giving-tiers", "max");
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
  revalidateTag("giving-tiers", "max");
  revalidatePath("/admin/giving-tiers");
  return tier;
}
