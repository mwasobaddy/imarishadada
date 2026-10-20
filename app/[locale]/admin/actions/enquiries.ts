"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";
import type { Update } from "@/lib/supabase/row-types";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

export async function getEnquiries() {
  await requirePermission("enquiries", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateEnquiryStatus(id: string, status: string, notes?: string) {
  await requirePermission("enquiries", "update");
  const supabase = createServiceClient();
  const update: Update<"enquiries"> = { status };
  if (notes !== undefined) update.notes = notes;
  if (status === "read") update.read_at = new Date().toISOString();
  if (status === "replied") update.replied_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("enquiries")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "enquiries",
    row_id: id,
    after: data,
  });

  revalidatePath("/admin/enquiries");
  return data;
}

export async function getPartnerEnquiries() {
  await requirePermission("partner_enquiries", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("partner_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updatePartnerEnquiryStatus(id: string, status: string, notes?: string, assignedTo?: string) {
  await requirePermission("partner_enquiries", "update");
  const supabase = createServiceClient();
  const update: Update<"partner_enquiries"> = { status };
  if (notes !== undefined) update.notes = notes;
  if (assignedTo !== undefined) update.assigned_to = assignedTo;
  if (status === "read") update.read_at = new Date().toISOString();
  if (status === "replied") update.replied_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("partner_enquiries")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "partner_enquiries",
    row_id: id,
    after: data,
  });

  revalidatePath("/admin/partner-enquiries");
  return data;
}

export async function getVolunteerApplications() {
  await requirePermission("volunteer_applications", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("volunteer_applications")
    .select("*, volunteer_roles(title)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateVolunteerApplicationStatus(id: string, status: string, notes?: string, assignedTo?: string) {
  await requirePermission("volunteer_applications", "update");
  const supabase = createServiceClient();
  const update: Update<"volunteer_applications"> = { status };
  if (notes !== undefined) update.notes = notes;
  if (assignedTo !== undefined) update.assigned_to = assignedTo;
  if (status === "reviewing") update.read_at = new Date().toISOString();
  if (status === "accepted" || status === "declined") update.replied_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("volunteer_applications")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "volunteer_applications",
    row_id: id,
    after: data,
  });

  revalidatePath("/admin/volunteer-applications");
  return data;
}
