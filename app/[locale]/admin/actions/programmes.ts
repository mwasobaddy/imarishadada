"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";
import { recordAudit } from "@/lib/admin/audit";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

/**
 * An image without alt text is an accessibility defect.
 *
 * The database enforces this too (`programmes_alt_required_with_image`), but a
 * raw constraint violation is a poor error to hand an editor. This runs first
 * so they get a sentence they can act on.
 */
function assertAltWithImage(data: Record<string, unknown>) {
  const path = typeof data.image_path === "string" ? data.image_path.trim() : "";
  const alt = typeof data.image_alt === "string" ? data.image_alt.trim() : "";
  if (path && !alt) {
    throw new Error(
      "An image needs alt text. Describe what the photograph shows, for someone who cannot see it.",
    );
  }
}

export async function getProgrammes() {
  await requirePermission("programmes", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("programmes").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProgramme(id: string) {
  await requirePermission("programmes", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("programmes").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProgramme(data: Insert<"programmes">) {
  await requirePermission("programmes", "create");
  assertAltWithImage(data as Record<string, unknown>);
  const supabase = createServiceClient();
  if (!data.slug && data.title) {
    data.slug = (data.title as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  const { data: row, error } = await supabase.from("programmes").insert(data).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "create", tableName: "programmes", rowId: row.id, after: row as unknown as AuditSnapshot });
  revalidateTag("programmes", "max");
  revalidateTag("sections", "max");
  revalidatePath("/admin/content/programmes");
  return row;
}

export async function updateProgramme(id: string, data: Insert<"programmes">) {
  await requirePermission("programmes", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("programmes").select("*").eq("id", id).single();
  const { data: row, error } = await supabase.from("programmes").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "update", tableName: "programmes", rowId: id, before: before as unknown as AuditSnapshot, after: row as unknown as AuditSnapshot });
  revalidateTag("programmes", "max");
  revalidateTag("sections", "max");
  revalidatePath("/admin/content/programmes");
  revalidateTag("programmes", "max");
  revalidateTag("sections", "max");
  revalidatePath(`/programmes/${row.slug}`);
  return row;
}

export async function deleteProgramme(id: string) {
  await requirePermission("programmes", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("programmes").select("*").eq("id", id).single();
  const { error } = await supabase.from("programmes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({ action: "delete", tableName: "programmes", rowId: id, before: before as unknown as AuditSnapshot });
  revalidateTag("programmes", "max");
  revalidateTag("sections", "max");
  revalidatePath("/admin/content/programmes");
}

export async function toggleProgramme(id: string, active: boolean) {
  await requirePermission("programmes", "publish");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("programmes").select("*").eq("id", id).maybeSingle();
  const { data: row, error } = await supabase.from("programmes").update({ active }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "update", tableName: "programmes", rowId: id, before: before as unknown as AuditSnapshot, after: row as unknown as AuditSnapshot });
  revalidateTag("programmes", "max");
  revalidateTag("sections", "max");
  revalidatePath("/admin/content/programmes");
  return row;
}
