import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type { Database } from "@/lib/supabase/types";

type Permission = { resource: string; action: string };

/**
 * Server-side: get the current user's permissions.
 * Returns an empty array if not authenticated.
 */
export async function getMyPermissions(): Promise<Permission[]> {
  const supabase = await createAuthServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return [];

  const { data, error } = await supabase.rpc("my_permissions");
  if (error || !data) return [];
  return data as Permission[];
}

/**
 * Server-side: check if the current user has a specific permission.
 */
export async function hasPermission(resource: string, action: string): Promise<boolean> {
  const perms = await getMyPermissions();
  return perms.some((p) => p.resource === resource && p.action === action);
}

/**
 * Server-side: get the current user's staff record.
 * Returns null if not authenticated or not staff.
 */
export async function getCurrentStaff() {
  const supabase = await createAuthServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return null;

  const { data, error } = await supabase
    .from("staff")
    .select("id, display_name, email, is_developer, is_active")
    .eq("user_id", claims.claims.sub)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Server-side: get the current user's roles.
 */
export async function getMyRoles(): Promise<{ id: string; name: string }[]> {
  const supabase = await createAuthServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("role_id, roles(id, name)")
    .eq("user_id", claims.claims.sub);

  if (error || !data) return [];
  return data.flatMap((r: any) => (r.roles ? [r.roles] : []));
}

/**
 * Check if the current user is a developer (stealth).
 */
export async function isDeveloper(): Promise<boolean> {
  const supabase = await createAuthServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return false;

  const { data } = await supabase.rpc("is_developer");
  return data === true;
}

/**
 * Client-side: check if the current user has a permission.
 * Uses the browser client. Cache the result for the session.
 */
export async function clientHasPermission(resource: string, action: string): Promise<boolean> {
  const supabase = createAuthBrowserClient();
  const { data, error } = await supabase.rpc("has_permission", {
    p_resource: resource,
    p_action: action,
  });
  if (error) return false;
  return data === true;
}

/**
 * Client-side: get all permissions for the current user.
 */
export async function clientGetPermissions(): Promise<Permission[]> {
  const supabase = createAuthBrowserClient();
  const { data, error } = await supabase.rpc("my_permissions");
  if (error || !data) return [];
  return data as Permission[];
}
