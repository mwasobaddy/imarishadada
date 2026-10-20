"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createImpactStat,
  updateImpactStat,
  deleteImpactStat,
} from "@/app/[locale]/admin/actions/impact-stats";

type Stat = {
  id: string;
  slug: string;
  programme_id: string | null;
  value: number;
  unit: string | null;
  label: string;
  period: string;
  display_value: string | null;
  sort_order: number;
  active: boolean;
  programmes?: { title: string } | null;
};

type Programme = { id: string; title: string };

export function ImpactStatsEditor({ stats: initial, programmes }: { stats: Stat[]; programmes: Programme[] }) {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Stat>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ slug: "", value: 0, unit: "", label: "", period: "", sort_order: stats.length + 1, active: true, programme_id: null });
  }

  function startEdit(s: Stat) {
    setEditing(s.id);
    setCreating(false);
    setForm({ ...s });
  }

  function cancel() {
    setCreating(false);
    setEditing(null);
    setForm({});
  }

  async function save() {
    if (!form.slug || !form.label || !form.period) {
      toast.error("Slug, label, and period are required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          slug: form.slug,
          value: form.value ?? 0,
          unit: form.unit || null,
          label: form.label,
          period: form.period,
          display_value: form.display_value || null,
          sort_order: form.sort_order ?? 0,
          active: form.active ?? true,
          programme_id: form.programme_id || null,
        };
        if (creating) {
          const created = await createImpactStat(payload);
          setStats((prev) => [...prev, created as Stat]);
          toast.success("Stat created");
        } else if (editing) {
          const updated = await updateImpactStat(editing, payload);
          setStats((prev) => prev.map((s) => (s.id === editing ? (updated as Stat) : s)));
          toast.success("Stat updated");
        }
        cancel();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this stat?")) return;
    startTransition(async () => {
      try {
        await deleteImpactStat(id);
        setStats((prev) => prev.filter((s) => s.id !== id));
        toast.success("Stat deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Impact stats</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {stats.length} stats. Period is mandatory — an undated number is an unverifiable claim.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700"
        >
          New stat
        </button>
      </div>

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">{creating ? "New stat" : "Edit stat"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-ink">Slug</label>
              <input value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Value</label>
              <input type="number" value={form.value ?? 0} onChange={(e) => setForm((f) => ({ ...f, value: parseFloat(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Unit</label>
              <input value={form.unit ?? ""} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="e.g. KSh" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Label</label>
              <input value={form.label ?? ""} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Period (required)</label>
              <input value={form.period ?? ""} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. 2025–26" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Programme</label>
              <select value={form.programme_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, programme_id: e.target.value || null }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
                <option value="">None (site-wide)</option>
                {programmes.map((p) => (<option key={p.id} value={p.id}>{p.title}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Sort order</label>
              <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
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
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Label</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Value</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Period</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Programme</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map((s) => (
              <tr key={s.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 font-medium text-ink">{s.label}</td>
                <td className="px-4 py-3 text-ink-muted">{s.display_value ?? `${s.value} ${s.unit ?? ""}`}</td>
                <td className="px-4 py-3 text-ink-muted">{s.period}</td>
                <td className="px-4 py-3 text-ink-muted">{s.programmes?.title ?? "— (site-wide)"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(s)} className="text-sm font-medium text-brand-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleDelete(s.id)} disabled={pending} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
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
