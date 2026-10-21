"use server";

import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

/**
 * The columns the audit page shows.
 *
 * Named rather than `*`, so a column added to the table later does not change
 * the shape of the page's data by accident.
 */
const AUDIT_COLUMNS =
  "id, created_at, action, table_name, row_id, actor_email, metadata, before, after";

export async function getAuditLog(limit = 100) {
  await requirePermission("audit_log", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select(AUDIT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function exportAuditLog() {
  await requirePermission("audit_log", "export");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, created_at, action, table_name, row_id, actor_email, actor_id, metadata, before, after")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
