import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { getRoles, getPermissions } from "@/app/[locale]/admin/actions/roles";
import { RolesManager } from "@/components/admin/roles-manager";

export default async function RolesPage() {
  const [roles, permissions] = await Promise.all([getRoles(), getPermissions()]);
  return <RolesManager roles={roles} permissions={permissions} />;
}
