import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { PartnersEditor } from "@/components/admin/partners-editor";

export default async function PartnersPage() {
  const supabase = await createAuthServerClient();
  const { data: partners } = await supabase.from("partners").select("*").order("sort_order");
  return <PartnersEditor partners={partners ?? []} />;
}
