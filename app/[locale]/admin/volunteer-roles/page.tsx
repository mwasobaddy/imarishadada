import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { VolunteerRolesEditor } from "@/components/admin/volunteer-roles-editor";

export default async function VolunteerRolesPage() {
  const supabase = await createAuthServerClient();
  const { data: roles } = await supabase.from("volunteer_roles").select("*").order("sort_order");
  return <VolunteerRolesEditor roles={roles ?? []} />;
}
