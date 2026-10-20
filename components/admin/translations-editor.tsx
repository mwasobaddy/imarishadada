"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createTranslation, deleteTranslation, reviewTranslation } from "@/app/[locale]/admin/actions/translations";
import type { Insert } from "@/lib/supabase/row-types";

type Translation = {
  id: string;
  table_name: string;
  row_id: string;
  locale: string;
  field_name: string;
  value: string;
  is_reviewed: boolean;
  reviewed_at: string | null;
  created_at: string;
};

const LOCALES = ["en", "sw", "fr", "de", "pt"];

export function TranslationsEditor({ translations: initial }: { translations: Translation[] }) {
  const [translations, setTranslations] = useState<Translation[]>(initial);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Translation>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setForm({ table_name: "", row_id: "", locale: "sw", field_name: "", value: "", is_reviewed: false });
  }

  function cancel() { setCreating(false); setForm({}); }

  async function save() {
    if (!form.table_name || !form.row_id || !form.field_name || !form.value) {
      toast.error("Table, row ID, field, and value are required");
      return;
    }
    startTransition(async () => {
      try {
        const payload: Insert<"translations"> = {
          table_name: form.table_name ?? "",
          row_id: form.row_id ?? "",
          locale: form.locale ?? "sw",
          field_name: form.field_name ?? "",
          value: form.value ?? "",
          is_reviewed: form.is_reviewed ?? false,
        };
        const created = await createTranslation(payload);
        setTranslations((prev) => [...prev, created as Translation]);
        toast.success("Translation created");
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleReview(id: string) {
    startTransition(async () => {
      try {
        const updated = await reviewTranslation(id);
        setTranslations((prev) => prev.map((t) => (t.id === id ? (updated as Translation) : t)));
        toast.success("Translation reviewed and approved");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Review failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this translation?")) return;
    startTransition(async () => {
      try {
        await deleteTranslation(id);
        setTranslations((prev) => prev.filter((t) => t.id !== id));
        toast.success("Translation deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Translations</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {translations.length} overrides. Machine translation is prohibited on
            safeguarding, SRHR, financial, tax, and personal testimony content.
          </p>
        </div>
        <button type="button" onClick={startCreate} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700">
          New translation
        </button>
      </div>

      {creating && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">New translation</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Table name</label>
              <input value={form.table_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, table_name: e.target.value }))} placeholder="e.g. programmes" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Row ID (UUID)</label>
              <input value={form.row_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, row_id: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Locale</label>
              <select value={form.locale ?? "sw"} onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
                {LOCALES.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Field name</label>
              <input value={form.field_name ?? ""} onChange={(e) => setForm((f) => ({ ...f, field_name: e.target.value }))} placeholder="e.g. title" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Translated value</label>
              <textarea value={form.value ?? ""} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} rows={3} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={save} disabled={pending} className="rounded-full bg-brand-600 px-6 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancel} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Table</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Field</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Locale</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Value</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Reviewed</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {translations.map((t) => (
              <tr key={t.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 text-ink-muted">{t.table_name}</td>
                <td className="px-4 py-3 text-ink-muted">{t.field_name}</td>
                <td className="px-4 py-3 text-ink-muted">{t.locale}</td>
                <td className="px-4 py-3 text-ink max-w-xs truncate">{t.value}</td>
                <td className="px-4 py-3">
                  {t.is_reviewed ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Reviewed</span>
                  ) : (
                    <button type="button" onClick={() => handleReview(t.id)} disabled={pending} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200">
                      Review
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => handleDelete(t.id)} disabled={pending} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
