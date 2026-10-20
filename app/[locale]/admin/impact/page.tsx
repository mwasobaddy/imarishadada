import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { ImpactStatsEditor } from "@/components/admin/impact-stats-editor";

export default async function ImpactStatsPage() {
  const supabase = await createAuthServerClient();
  const [{ data: stats }, { data: programmes }] = await Promise.all([
    supabase.from("impact_stats").select("*, programmes(title, slug)").order("sort_order"),
    supabase.from("programmes").select("id, title").eq("active", true).order("sort_order"),
  ]);
  return <ImpactStatsEditor stats={stats ?? []} programmes={programmes ?? []} />;
}
