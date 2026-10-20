import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { TranslationsEditor } from "@/components/admin/translations-editor";

export default async function TranslationsPage() {
  const supabase = await createAuthServerClient();
  const { data: translations } = await supabase.from("translations").select("*").order("table_name, row_id, locale");
  return <TranslationsEditor translations={translations ?? []} />;
}
