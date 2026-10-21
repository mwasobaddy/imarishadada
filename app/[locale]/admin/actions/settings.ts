"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";
import { recordAudit } from "@/lib/admin/audit";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

export async function getSettings() {
  await requirePermission("settings", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("settings").select("*").order("key");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSetting(key: string) {
  await requirePermission("settings", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("settings").select("*").eq("key", key).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSetting(key: string, value: unknown, changeNote?: string) {
  await requirePermission("settings", "update");
  const supabase = createServiceClient();

  const { data: before } = await supabase.from("settings").select("*").eq("key", key).single();

  // Financial settings require dual confirmation — stage the change, don't apply.
  const isFinancial = key === "bank_details" || key === "payment_rails";

  if (isFinancial) {
    // Stage as a pending version for approval
    const { data: version, error: vErr } = await supabase
      .from("settings_versions")
      .insert({
        key,
        value: value as unknown as AuditSnapshot,
        changed_by: null, // filled by RLS context
        change_note: changeNote ?? "Pending approval",
      })
      .select()
      .single();
    if (vErr) throw new Error(vErr.message);

    await recordAudit({
      action: "update",
      tableName: "settings",
      rowId: null,
      before: before as unknown as AuditSnapshot,
      after: { key, value, status: "pending_approval" } as unknown as AuditSnapshot,
    });

    revalidatePath("/admin/settings");
    return { status: "pending_approval", version };
  }

  // Non-financial: apply immediately
  const { data: setting, error } = await supabase
    .from("settings")
    .update({ value: value as unknown as AuditSnapshot })
    .eq("key", key)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({
    action: "update",
    tableName: "settings",
    rowId: null,
    before: before as unknown as AuditSnapshot,
    after: setting as unknown as AuditSnapshot,
  });

  revalidateTag("settings", "max");
  revalidatePath("/admin/settings");
  return { status: "applied", setting };
}

export async function approveSettingChange(versionId: string) {
  await requirePermission("settings", "approve");
  const supabase = createServiceClient();

  const { data: version, error: vErr } = await supabase
    .from("settings_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (vErr || !version) throw new Error("Version not found");

  // Apply the change
  const { data: setting, error } = await supabase
    .from("settings")
    .update({ value: version.value })
    .eq("key", version.key)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({
    action: "approve",
    tableName: "settings",
    rowId: null,
    before: null,
    after: {
      key: version.key,
      value: version.value,
      approved_version: versionId,
    } as unknown as AuditSnapshot,
  });

  revalidateTag("settings", "max");
  revalidatePath("/admin/settings");
  return setting;
}

export async function getPendingSettingChanges() {
  await requirePermission("settings", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings_versions")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSettingsVersions(key: string) {
  await requirePermission("settings", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings_versions")
    .select("*")
    .eq("key", key)
    .order("changed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
