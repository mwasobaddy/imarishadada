import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { GivingTiersEditor } from "@/components/admin/giving-tiers-editor";

export default async function GivingTiersPage() {
  const supabase = await createAuthServerClient();
  const [{ data: tiers }, { data: programmes }] = await Promise.all([
    supabase.from("giving_tiers").select("*, programmes(title, slug)").order("sort_order"),
    supabase.from("programmes").select("id, title").eq("active", true).order("sort_order"),
  ]);

  return (
    <GivingTiersEditor
      tiers={tiers ?? []}
      programmes={programmes ?? []}
    />
  );
}
