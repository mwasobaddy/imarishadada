"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateSetting, approveSettingChange } from "@/app/[locale]/admin/actions/settings";

type Setting = {
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
};

type PendingChange = {
  id: string;
  key: string;
  value: unknown;
  change_note: string | null;
  changed_at: string;
};

export function SettingsEditor({
  settings,
  pendingChanges,
}: {
  settings: Setting[];
  pendingChanges: PendingChange[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit(setting: Setting) {
    setEditing(setting.key);
    setJsonText(JSON.stringify(setting.value, null, 2));
  }

  async function save(key: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    startTransition(async () => {
      try {
        const result = await updateSetting(key, parsed, "Edited via admin");
        if (result.status === "pending_approval") {
          toast.info("Change staged for dual approval. A second admin must approve.");
        } else {
          toast.success("Setting updated");
        }
        setEditing(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function approve(versionId: string) {
    startTransition(async () => {
      try {
        await approveSettingChange(versionId);
        toast.success("Change approved and applied");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Approval failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-600">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Site-wide configuration. Financial settings require dual confirmation.
        </p>
      </div>

      {/* Pending changes */}
      {pendingChanges.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800">Pending approval</h2>
          <ul className="mt-2 space-y-2">
            {pendingChanges.map((pc) => (
              <li key={pc.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">
                  <strong>{pc.key}</strong> — {pc.change_note}
                </span>
                <button
                  type="button"
                  onClick={() => approve(pc.id)}
                  disabled={pending}
                  className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Settings list */}
      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">{setting.key}</h3>
                <p className="text-xs text-ink-muted">{setting.description}</p>
              </div>
              {editing !== setting.key && (
                <button
                  type="button"
                  onClick={() => startEdit(setting)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600"
                >
                  Edit
                </button>
              )}
            </div>

            {editing === setting.key ? (
              <div className="mt-3 space-y-3">
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={8}
                  className="block w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => save(setting.key)}
                    disabled={pending}
                    className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50"
                  >
                    {pending ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-surface px-3 py-2 font-mono text-xs text-ink-muted">
                {JSON.stringify(setting.value, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
