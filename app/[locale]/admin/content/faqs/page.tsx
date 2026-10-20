import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { FaqsEditor } from "@/components/admin/faqs-editor";

export default async function FaqsPage() {
  const supabase = await createAuthServerClient();
  const { data: faqs } = await supabase.from("faqs").select("*").order("category, sort_order");
  return <FaqsEditor faqs={faqs ?? []} />;
}
