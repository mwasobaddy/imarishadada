import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { FinancialBreakdownEditor } from "@/components/admin/financial-breakdown-editor";

export default async function TransparencyPage() {
  const supabase = await createAuthServerClient();
  const [{ data: breakdown }, { data: programmes }] = await Promise.all([
    supabase.from("financial_breakdown").select("*, programmes(title, slug)").order("fiscal_year, sort_order"),
    supabase.from("programmes").select("id, title").eq("active", true).order("sort_order"),
  ]);
  return <FinancialBreakdownEditor breakdown={breakdown ?? []} programmes={programmes ?? []} />;
}
