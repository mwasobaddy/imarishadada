import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { ProgrammesEditor } from "@/components/admin/programmes-editor";

export default async function ProgrammesAdminPage() {
  const supabase = await createAuthServerClient();
  const { data: programmes } = await supabase.from("programmes").select("*").order("sort_order");
  return <ProgrammesEditor programmes={programmes ?? []} />;
}
