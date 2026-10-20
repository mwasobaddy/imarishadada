"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

// Financial breakdown
export async function getFinancialBreakdown() {
  await requirePermission("financial_breakdown", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("financial_breakdown").select("*, programmes(title, slug)").order("fiscal_year, sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createFinancialBreakdown(data: Insert<"financial_breakdown">) {
  await requirePermission("financial_breakdown", "create");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("financial_breakdown").insert(data).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "financial_breakdown", row_id: row.id, after: row as unknown as AuditSnapshot });
  revalidateTag("financial-breakdown", "max");
  revalidateTag("transparency-gaps", "max");
  revalidatePath("/admin/financials");
  return row;
}

export async function updateFinancialBreakdown(id: string, data: Insert<"financial_breakdown">) {
  await requirePermission("financial_breakdown", "update");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("financial_breakdown").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("financial-breakdown", "max");
  revalidateTag("transparency-gaps", "max");
  revalidatePath("/admin/financials");
  return row;
}

export async function deleteFinancialBreakdown(id: string) {
  await requirePermission("financial_breakdown", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("financial_breakdown").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("financial-breakdown", "max");
  revalidateTag("transparency-gaps", "max");
  revalidatePath("/admin/financials");
}

// Transparency gaps
export async function getTransparencyGaps() {
  await requirePermission("transparency_gaps", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("transparency_gaps").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTransparencyGap(data: Insert<"transparency_gaps">) {
  await requirePermission("transparency_gaps", "create");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("transparency_gaps").insert(data).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "transparency_gaps", row_id: row.id, after: row as unknown as AuditSnapshot });
  revalidateTag("financial-breakdown", "max");
  revalidateTag("transparency-gaps", "max");
  revalidatePath("/admin/transparency");
  return row;
}

export async function updateTransparencyGap(id: string, data: Insert<"transparency_gaps">) {
  await requirePermission("transparency_gaps", "update");
  const supabase = createServiceClient();
  const { data: row, error } = await supabase.from("transparency_gaps").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("financial-breakdown", "max");
  revalidateTag("transparency-gaps", "max");
  revalidatePath("/admin/transparency");
  return row;
}

export async function deleteTransparencyGap(id: string) {
  await requirePermission("transparency_gaps", "delete");
  const supabase = createServiceClient();
  const { error } = await supabase.from("transparency_gaps").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("financial-breakdown", "max");
  revalidateTag("transparency-gaps", "max");
  revalidatePath("/admin/transparency");
}
