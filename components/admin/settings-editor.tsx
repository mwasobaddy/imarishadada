"use client";

import { PageHeader } from "@/components/admin/page-header";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  updateSetting,
  approveSettingChange,
  rejectSettingChange,
} from "@/app/[locale]/admin/actions/settings";

type Setting = {
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
};

/**
 * A staged change, and how it was decided.
 *
 * `status` is the whole point of the column: pending, approved, rejected or
 * superseded. A change can only be decided once, and the decision says who
 * made it.
 */
type PendingChange = {
  id: string;
  key: string;
  value: unknown;
  change_note: string | null;
  changed_at: string;
  status: string;
  changed_by: string | null;
  decided_at: string | null;
  decided_by: string | null;
};

export function SettingsEditor({
  settings,
  pendingChanges,
  decidedChanges = [],
}: {
  settings: Setting[];
  pendingChanges: PendingChange[];
  /** The changes that have been decided, and the ones a newer one replaced. */
  decidedChanges?: PendingChange[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [channels, setChannels] = useState({ linkedin: "", facebook: "", spotify: "" });
  const [pending, startTransition] = useTransition();

  function startEdit(setting: Setting) {
    setEditing(setting.key);
    setJsonText(JSON.stringify(setting.value, null, 2));

    // The social channels get real fields rather than a JSON textarea. A
    // volunteer who has been asked to fix a Facebook link should not have to
    // know what JSON is.
    if (setting.key === "social_links") {
      const value = (setting.value ?? {}) as Record<string, unknown>;
      setChannels({
        linkedin: typeof value.linkedin === "string" ? value.linkedin : "",
        facebook: typeof value.facebook === "string" ? value.facebook : "",
        spotify: typeof value.spotify === "string" ? value.spotify : "",
      });
    }
  }

  async function save(key: string) {
    let parsed: unknown;
    if (key === "social_links") {
      // An empty field is a channel we are not on, not a link to nowhere.
      parsed = {
        linkedin: channels.linkedin.trim() || null,
        facebook: channels.facebook.trim() || null,
        spotify: channels.spotify.trim() || null,
      };
    } else {
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        toast.error("Invalid JSON");
        return;
      }
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

  async function reject(versionId: string) {
    startTransition(async () => {
      try {
        await rejectSettingChange(versionId);
        toast.success("Change rejected. The setting is unchanged.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Rejection failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Site-wide configuration. Financial settings require dual confirmation."
      />

      {/* Pending changes */}
      {pendingChanges.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800">Pending approval</h2>
          <p className="mt-1 text-xs text-amber-700">
            A financial setting needs two people. The person who staged a change
            cannot approve it, and a change can only be decided once.
          </p>
          <ul className="mt-3 space-y-2">
            {pendingChanges.map((pc) => (
              <li key={pc.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-amber-700">
                  <strong>{pc.key}</strong> — {pc.change_note}
                </span>
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => reject(pc.id)}
                    disabled={pending}
                    className="rounded-lg border border-amber-300 bg-card px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => approve(pc.id)}
                    disabled={pending}
                    className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Approve
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decided changes */}
      {decidedChanges.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-ink">Decided changes</h2>
          <ul className="mt-2 space-y-1">
            {decidedChanges.map((pc) => (
              <li key={pc.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-ink-muted">
                  <strong className="text-ink">{pc.key}</strong> — {pc.change_note}
                </span>
                <span className="shrink-0 rounded-full bg-surface-lilac px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                  {pc.status}
                </span>
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
                {setting.key === "social_links" ? (
                  <div className="space-y-3">
                    {(
                      [
                        ["linkedin", "LinkedIn"],
                        ["facebook", "Facebook"],
                        ["spotify", "Spotify"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label
                          htmlFor={`social-${key}`}
                          className="block text-sm font-medium text-ink"
                        >
                          {label}
                        </label>
                        <input
                          id={`social-${key}`}
                          type="url"
                          inputMode="url"
                          value={channels[key]}
                          onChange={(e) =>
                            setChannels((current) => ({
                              ...current,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder="https://…"
                          className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-ink-muted">
                      Leave a field empty to hide that channel from the site.
                    </p>
                  </div>
                ) : (
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    rows={8}
                    className="block w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  />
                )}
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
            ) : setting.key === "social_links" ? (
              <ul className="mt-3 space-y-1 text-sm text-ink-muted">
                {(["linkedin", "facebook", "spotify"] as const).map((key) => {
                  const value = (setting.value as Record<string, unknown> | null)?.[key];
                  const label = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <li key={key}>
                      <span className="font-medium text-ink">{label}:</span>{" "}
                      {typeof value === "string" && value.trim() ? (
                        <span className="break-all">{value}</span>
                      ) : (
                        <span className="text-ink-muted/70">not listed</span>
                      )}
                    </li>
                  );
                })}
              </ul>
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
