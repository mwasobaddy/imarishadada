import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { SettingsEditor } from "@/components/admin/settings-editor";

export default async function SettingsPage() {
  const supabase = await createAuthServerClient();
  const [{ data: settings }, { data: pending }] = await Promise.all([
    supabase.from("settings").select("*").order("key"),
    supabase.from("settings_versions").select("*").order("changed_at", { ascending: false }).limit(20),
  ]);

  return <SettingsEditor settings={settings ?? []} pendingChanges={pending ?? []} />;
}
