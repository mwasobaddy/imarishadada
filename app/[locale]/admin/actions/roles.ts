"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
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
    after: { name, description, permission_count: permissionIds.length } as any,
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
    before: { permission_ids: (before ?? []).map((r: any) => r.permission_id) } as any,
    after: { permission_ids: permissionIds } as any,
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
    after: { user_id: userId, role_id: roleId } as any,
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
    after: { user_id: userId, role_id: roleId } as any,
  });

  revalidatePath("/admin/users");
}

export async function getUsers() {
  await requirePermission("users", "read");
  const supabase = createServiceClient();

  // Use get_visible_staff to exclude stealth (developer) users
  const { data: claims } = await (await import("@/lib/supabase/auth-server")).createAuthServerClient().then((c) => c.auth.getClaims());
  const requesterId = claims?.claims?.sub ?? "";

  const { data, error } = await supabase.rpc("visible_staff");
  if (error) throw new Error(error.message);

  // Fetch roles for each user
  const users = ((data ?? []) as any[]).map((u: any) => u);
  const userIds = users.map((u: any) => u.user_id);
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role_id, roles(id, name)")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const roleMap: Record<string, any[]> = {};
  for (const r of roles ?? []) {
    if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
    if (r.roles) roleMap[r.user_id].push(r.roles);
  }

  return users.map((u: any) => ({
    ...u,
    roles: roleMap[u.user_id] ?? [],
  }));
}

export async function inviteUser(email: string, displayName: string, roleIds: string[]) {
  await requirePermission("users", "create");
  // This requires the Supabase Auth Admin API — handled via a separate endpoint
  // For now, return a message
  return { message: "User invitation requires the Supabase Auth Admin API. Use the Supabase Dashboard to invite users, then assign roles here." };
}
