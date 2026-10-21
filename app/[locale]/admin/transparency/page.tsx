import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { FinancialBreakdownEditor } from "@/components/admin/financial-breakdown-editor";
import { TransparencyGapsEditor } from "@/components/admin/transparency-gaps-editor";

/**
 * The two lists behind `/transparency`.
 *
 * The gaps editor was missing. The Server Actions for `transparency_gaps` have
 * existed since migration 0007 — create, update, delete, all permission-gated
 * and audited — but nothing rendered them, so the roadmap's "most important
 * section on this page" could not be edited without SQL.
 */
export default async function TransparencyPage() {
  const supabase = await createAuthServerClient();
  const [{ data: breakdown }, { data: programmes }, { data: gaps }] = await Promise.all([
    supabase
      .from("financial_breakdown")
      .select("*, programmes(title, slug)")
      .order("fiscal_year, sort_order"),
    supabase.from("programmes").select("id, title").eq("active", true).order("sort_order"),
    supabase
      .from("transparency_gaps")
      .select("id, item, kind, status, target_label, notes, sort_order")
      .order("sort_order"),
  ]);

  return (
    <div className="space-y-14">
      <TransparencyGapsEditor gaps={gaps ?? []} />
      <FinancialBreakdownEditor breakdown={breakdown ?? []} programmes={programmes ?? []} />
    </div>
  );
}
