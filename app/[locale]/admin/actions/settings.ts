"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot } from "@/lib/supabase/row-types";
import { getCurrentStaff, hasPermission } from "@/lib/admin/permissions";
import {
  canApprove,
  isNewestWaiting,
  mayApprove,
  type StagedChange,
  type StagedChangeStatus,
} from "@/lib/admin/settings-approval";
import { recordAudit } from "@/lib/admin/audit";

/**
 * A version row as the approval rules want it.
 *
 * The database constrains `status` to the four values, so the cast only says
 * what the check constraint already guarantees.
 */
function asStagedChange(row: {
  id: string;
  key: string;
  status: string;
  changed_by: string | null;
  changed_at: string;
}): StagedChange {
  return { ...row, status: row.status as StagedChangeStatus };
}

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
    // The staff member staging the change. The column used to be null with a
    // comment saying RLS would fill it — it would not, because this write uses
    // the service role, which bypasses RLS. Without it the dual confirmation
    // cannot be enforced: the person who staged a change could approve it
    // themselves.
    const staff = await getCurrentStaff();

    // Stage as a pending version for approval
    const { data: version, error: vErr } = await supabase
      .from("settings_versions")
      .insert({
        key,
        value: value as unknown as AuditSnapshot,
        changed_by: staff?.id ?? null,
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
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Your account is not active.");

  const { data: version, error: vErr } = await supabase
    .from("settings_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (vErr) throw new Error(vErr.message);
  if (!version) throw new Error("That change no longer exists.");

  // A change can only be decided once, and not by the person who staged it.
  // The rules live in `lib/admin/settings-approval.ts` so they can be tested
  // without a database; the database enforces them again.
  const change = asStagedChange(version);

  if (!canApprove(change)) {
    throw new Error(`That change has already been ${change.status}.`);
  }

  if (!mayApprove(change, staff.id)) {
    throw new Error("A change you staged needs a second person to approve it.");
  }

  // Only the newest waiting change for a setting can be approved.
  const { data: waiting } = await supabase
    .from("settings_versions")
    .select("id, key, status, changed_by, changed_at")
    .eq("key", version.key)
    .eq("status", "pending");

  if (!isNewestWaiting(change, (waiting ?? []).map(asStagedChange))) {
    throw new Error("A newer change for this setting is waiting.");
  }

  // Apply the change and record the decision in one transaction, so a crash
  // cannot leave a value applied with no decision recorded, or the reverse.
  const { data, error } = await supabase.rpc("approve_setting_version", {
    p_version_id: versionId,
    p_decided_by: staff.id,
  });

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
  return data;
}

/**
 * Turn a staged change down.
 *
 * The change is not applied, and the decision is recorded. The audit
 * constraint already allows the `reject` action.
 */
export async function rejectSettingChange(versionId: string) {
  await requirePermission("settings", "approve");
  const supabase = createServiceClient();
  const staff = await getCurrentStaff();
  if (!staff) throw new Error("Your account is not active.");

  const { data: version, error: vErr } = await supabase
    .from("settings_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (vErr) throw new Error(vErr.message);
  if (!version) throw new Error("That change no longer exists.");
  if (!canApprove(asStagedChange(version))) {
    throw new Error(`That change has already been ${version.status}.`);
  }

  const { error } = await supabase
    .from("settings_versions")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by: staff.id,
      value: version.value,
    })
    .eq("id", versionId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  await recordAudit({
    action: "reject",
    tableName: "settings",
    rowId: null,
    before: null,
    after: {
      key: version.key,
      rejected_version: versionId,
    } as unknown as AuditSnapshot,
  });

  revalidatePath("/admin/settings");
}

/**
 * The changes waiting for a second person.
 *
 * Only the staged ones. The table also holds the auto-versioned history of
 * every past update, and listing those as "pending" is how an applied change
 * ended up looking like it still needed approving.
 */
export async function getPendingSettingChanges() {
  await requirePermission("settings", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings_versions")
    .select("*")
    .eq("status", "pending")
    .order("changed_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** The changes that have been decided, and the ones a newer change replaced. */
export async function getDecidedSettingChanges() {
  await requirePermission("settings", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings_versions")
    .select("*")
    .in("status", ["approved", "rejected", "superseded"])
    .neq("change_note", "Auto-versioned on update")
    .order("decided_at", { ascending: false })
    .limit(20);
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
