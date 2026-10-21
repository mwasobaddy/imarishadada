import {
  getDecidedSettingChanges,
  getPendingSettingChanges,
  getSettings,
} from "@/app/[locale]/admin/actions/settings";
import { SettingsEditor } from "@/components/admin/settings-editor";

export default async function SettingsPage() {
  /**
   * The pending list is only the staged changes — the ones waiting for a
   * second person. The table also holds the auto-versioned history of every
   * past update, and listing those as pending is how an applied change ended
   * up looking like it still needed approving.
   */
  const [settings, pending, decided] = await Promise.all([
    getSettings(),
    getPendingSettingChanges(),
    getDecidedSettingChanges(),
  ]);

  return (
    <SettingsEditor
      settings={settings}
      pendingChanges={pending}
      decidedChanges={decided}
    />
  );
}
