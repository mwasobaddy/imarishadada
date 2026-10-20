"use client";

import { useState, useTransition } from "react";

import { MediaPicker } from "@/components/admin/media-picker";

import { PageHeader } from "@/components/admin/page-header";
import { toast } from "sonner";

import { createProgramme, updateProgramme, deleteProgramme, toggleProgramme } from "@/app/[locale]/admin/actions/programmes";
import type { Insert } from "@/lib/supabase/row-types";

type Programme = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  icon: string;
  stat: string | null;
  image_path: string | null;
  image_alt: string | null;
  stat_label: string | null;
  outcomes: unknown;
  sort_order: number;
  active: boolean;
};

export function ProgrammesEditor({ programmes: initial }: { programmes: Programme[] }) {
  const [programmes, setProgrammes] = useState<Programme[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Programme>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ slug: "", title: "", summary: "", body: "", icon: "heart", stat: "", sort_order: programmes.length + 1, active: true });
  }

  function startEdit(p: Programme) {
    setEditing(p.id);
    setCreating(false);
    setForm({ ...p, outcomes: p.outcomes ? JSON.stringify(p.outcomes, null, 2) : "" });
  }

  function cancel() { setCreating(false); setEditing(null); setForm({}); }

  async function save() {
    if (!form.title || !form.slug) { toast.error("Title and slug are required"); return; }
    startTransition(async () => {
      try {
        const payload: Insert<"programmes"> = {
          slug: form.slug ?? "",
          title: form.title ?? "",
          summary: form.summary ?? "",
          body: form.body ?? "",
          icon: form.icon ?? "heart",
          stat: form.stat || null,
          image_path: form.image_path || null,
          image_alt: form.image_alt || null,
          stat_label: form.stat_label || null,
          sort_order: form.sort_order ?? 0,
          active: form.active ?? true,
        };
        if (form.outcomes && typeof form.outcomes === "string" && form.outcomes.trim()) {
          try {
            payload.outcomes = JSON.parse(form.outcomes) as Insert<"programmes">["outcomes"];
          } catch { toast.error("Outcomes must be valid JSON"); return; }
        }
        if (creating) {
          const created = await createProgramme(payload);
          setProgrammes((prev) => [...prev, created as Programme]);
          toast.success("Programme created");
        } else if (editing) {
          const updated = await updateProgramme(editing, payload);
          setProgrammes((prev) => prev.map((p) => (p.id === editing ? (updated as Programme) : p)));
          toast.success("Programme updated");
        }
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this programme?")) return;
    startTransition(async () => {
      try {
        await deleteProgramme(id);
        setProgrammes((prev) => prev.filter((p) => p.id !== id));
        toast.success("Programme deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  async function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      try {
        await toggleProgramme(id, active);
        setProgrammes((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Toggle failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Programmes"
        description="{programmes.length} programmes."
        action={(
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            New programme
          </button>
        )}
      />

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">{creating ? "New programme" : "Edit programme"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Title</label>
              <input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Slug</label>
              <input value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Icon</label>
              <input value={form.icon ?? "heart"} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Stat</label>
              <input value={form.stat ?? ""} onChange={(e) => setForm((f) => ({ ...f, stat: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Image path</label>
              <MediaPicker
                id="programmes-editor-image"
                label="Image path"
                value={form.image_path ?? ""}
                onChange={(path) => setForm((f) => ({ ...f, image_path: path }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Sort order</label>
              <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Summary</label>
              <textarea value={form.summary ?? ""} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Body</label>
              <textarea value={form.body ?? ""} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={8} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Outcomes (JSON array)</label>
              <textarea value={typeof form.outcomes === "string" ? form.outcomes : JSON.stringify(form.outcomes ?? [], null, 2)} onChange={(e) => setForm((f) => ({ ...f, outcomes: e.target.value }))} rows={6} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active ?? true} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600" />
              <label htmlFor="active" className="text-sm text-ink">Active</label>
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
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Title</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Stat</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {programmes.map((p) => (
              <tr key={p.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 font-medium text-ink">{p.title}</td>
                <td className="px-4 py-3 text-ink-muted">{p.slug}</td>
                <td className="px-4 py-3 text-ink-muted">{p.stat ?? "—"}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => handleToggle(p.id, !p.active)} disabled={pending} className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(p)} className="text-sm font-medium text-brand-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleDelete(p.id)} disabled={pending} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
