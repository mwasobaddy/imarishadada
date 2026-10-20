"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Row } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) {
    throw new Error(`Permission denied: ${resource}:${action}`);
  }
}

export async function getRoles() {
  await requirePermission("roles", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*, role_permissions(permission_id, permissions(resource, action))")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPermissions() {
  await requirePermission("permissions", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("permissions").select("*").order("resource, action");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createRole(name: string, description: string, permissionIds: string[]) {
  await requirePermission("roles", "create");
  const supabase = createServiceClient();

  const { data: role, error } = await supabase
    .from("roles")
    .insert({ name, description, is_system: false })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (permissionIds.length > 0) {
    const rows = permissionIds.map((pid) => ({
      role_id: role.id,
      permission_id: pid,
    }));
    const { error: rpErr } = await supabase.from("role_permissions").insert(rows);
    if (rpErr) throw new Error(rpErr.message);
  }

  await supabase.from("audit_log").insert({
    action: "create",
    table_name: "roles",
    row_id: role.id,
    after: { name, description, permission_count: permissionIds.length } as unknown as AuditSnapshot,
  });

  revalidatePath("/admin/roles");
  return role;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  await requirePermission("roles", "update");
  const supabase = createServiceClient();

  // Get current for audit
  const { data: before } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);

  // Replace all permissions
  await supabase.from("role_permissions").delete().eq("role_id", roleId);

  if (permissionIds.length > 0) {
    const rows = permissionIds.map((pid) => ({
      role_id: roleId,
      permission_id: pid,
    }));
    const { error } = await supabase.from("role_permissions").insert(rows);
    if (error) throw new Error(error.message);
  }

  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "roles",
    row_id: roleId,
    before: {
      permission_ids: (before ?? []).map((r) => r.permission_id),
    } as unknown as AuditSnapshot,
    after: { permission_ids: permissionIds } as unknown as AuditSnapshot,
  });

  revalidatePath("/admin/roles");
}

export async function deleteRole(roleId: string) {
  await requirePermission("roles", "delete");
  const supabase = createServiceClient();

  // Check if system role
  const { data: role } = await supabase.from("roles").select("is_system, name").eq("id", roleId).single();
  if (role?.is_system) throw new Error("Cannot delete a system role");

  // Check if any users have this role
  const { data: users } = await supabase.from("user_roles").select("user_id").eq("role_id", roleId);
  if (users && users.length > 0) throw new Error("Cannot delete a role that is assigned to users");

  const { error } = await supabase.from("roles").delete().eq("id", roleId);
  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "delete",
    table_name: "roles",
    row_id: roleId,
  });

  revalidatePath("/admin/roles");
}

export async function assignRole(userId: string, roleId: string) {
  await requirePermission("roles", "assign");
  const supabase = createServiceClient();

  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "update",
    table_name: "user_roles",
    row_id: null,
    after: { user_id: userId, role_id: roleId } as unknown as AuditSnapshot,
  });

  revalidatePath("/admin/users");
}

export async function revokeRole(userId: string, roleId: string) {
  await requirePermission("roles", "assign");
  const supabase = createServiceClient();

  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId);
  if (error) throw new Error(error.message);

  await supabase.from("audit_log").insert({
    action: "delete",
    table_name: "user_roles",
    row_id: null,
    after: { user_id: userId, role_id: roleId } as unknown as AuditSnapshot,
  });

  revalidatePath("/admin/users");
}

export async function getUsers() {
  await requirePermission("users", "read");
  const supabase = createServiceClient();

  // `visible_staff` hides the stealth (developer) accounts from everyone who
  // is not a developer themselves, so the RLS layer does the filtering.
  const { data, error } = await supabase.rpc("visible_staff");
  if (error) throw new Error(error.message);

  // Fetch roles for each user
  const users: Row<"staff">[] = (data ?? []) as Row<"staff">[];
  const userIds = users.map((u) => u.user_id);
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role_id, roles(id, name)")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const roleMap: Record<string, { id: string; name: string }[]> = {};
  for (const r of roles ?? []) {
    if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
    if (r.roles) roleMap[r.user_id].push(r.roles);
  }

  return users.map((u) => ({
    ...u,
    roles: roleMap[u.user_id] ?? [],
  }));
}

/**
 * Invite a staff member.
 *
 * Creates the Supabase Auth user (which sends the invitation email), writes
 * the `staff` record, assigns the roles, and audits the whole thing.
 */
export async function inviteUser(email: string, displayName: string, roleIds: string[]) {
  await requirePermission("users", "create");
  const supabase = createServiceClient();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase is not configured. The service-role key is server-only.");
  }

  const { createAuthServerClient } = await import("@/lib/supabase/auth-server");
  const { data: claims } = await (await createAuthServerClient()).auth.getClaims();
  const inviterId = claims?.claims?.sub ?? null;

  // `invite` creates the user and emails them a link that signs them in.
  const res = await fetch(`${url}/auth/v1/admin/invite`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      data: { display_name: displayName },
      redirect_to: `${url}/auth/callback?next=/admin`,
    }),
  });

  const body = (await res.json()) as {
    id?: string;
    error_description?: string;
    msg?: string;
  };

  if (!res.ok || !body.id) {
    throw new Error(
      body.error_description ?? body.msg ?? "Could not send the invitation",
    );
  }

  const userId = body.id;

  const { error: staffError } = await supabase.from("staff").insert({
    user_id: userId,
    display_name: displayName,
    email,
    is_developer: false,
    is_active: true,
    invited_by: inviterId,
  });
  if (staffError) throw new Error(staffError.message);

  if (roleIds.length > 0) {
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert(roleIds.map((roleId) => ({ user_id: userId, role_id: roleId })));
    if (roleError) throw new Error(roleError.message);
  }

  await supabase.from("audit_log").insert({
    action: "invite",
    table_name: "staff",
    row_id: userId,
    after: { email, display_name: displayName, role_ids: roleIds } as unknown as AuditSnapshot,
  });

  revalidatePath("/admin/users");
  return { id: userId, email };
}
