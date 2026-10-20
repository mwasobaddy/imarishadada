"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getFaqs() {
  await requirePermission("faqs", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("faqs").select("*").order("category, sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createFaq(data: Record<string, unknown>) {
  await requirePermission("faqs", "create");
  const supabase = createServiceClient();
  const { data: faq, error } = await supabase.from("faqs").insert(data as any).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "faqs", row_id: faq.id, after: faq as any });
  revalidatePath("/admin/content/faqs");
  return faq;
}

export async function updateFaq(id: string, data: Record<string, unknown>) {
  await requirePermission("faqs", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("faqs").select("*").eq("id", id).single();
  const { data: faq, error } = await supabase.from("faqs").update(data as any).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "update", table_name: "faqs", row_id: id, before: before as any, after: faq as any });
  revalidatePath("/admin/content/faqs");
  return faq;
}

export async function deleteFaq(id: string) {
  await requirePermission("faqs", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("faqs").select("*").eq("id", id).single();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "delete", table_name: "faqs", row_id: id, before: before as any });
  revalidatePath("/admin/content/faqs");
}

export async function toggleFaq(id: string, published: boolean) {
  await requirePermission("faqs", "publish");
  const supabase = createServiceClient();
  const { data: faq, error } = await supabase.from("faqs").update({ published }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content/faqs");
  return faq;
}
