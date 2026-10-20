"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createPartner, updatePartner, deletePartner } from "@/app/[locale]/admin/actions/partners";

type Partner = {
  id: string;
  name: string;
  description: string;
  logo_path: string | null;
  website_url: string | null;
  tier: string;
  is_test: boolean;
  sort_order: number;
  active: boolean;
};

const TIERS = ["community", "corporate", "institutional", "fiscal_sponsor"];

export function PartnersEditor({ partners: initial }: { partners: Partner[] }) {
  const [partners, setPartners] = useState<Partner[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Partner>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ name: "", description: "", logo_path: "", website_url: "", tier: "community", is_test: false, sort_order: partners.length + 1, active: true });
  }

  function startEdit(p: Partner) {
    setEditing(p.id);
    setCreating(false);
    setForm({ ...p });
  }

  function cancel() { setCreating(false); setEditing(null); setForm({}); }

  async function save() {
    if (!form.name) { toast.error("Name is required"); return; }
    startTransition(async () => {
      try {
        const payload = { name: form.name, description: form.description ?? "", logo_path: form.logo_path || null, website_url: form.website_url || null, tier: form.tier, is_test: form.is_test, sort_order: form.sort_order, active: form.active };
        if (creating) {
          const created = await createPartner(payload);
          setPartners((prev) => [...prev, created as Partner]);
          toast.success("Partner created");
        } else if (editing) {
          const updated = await updatePartner(editing, payload);
          setPartners((prev) => prev.map((p) => (p.id === editing ? (updated as Partner) : p)));
          toast.success("Partner updated");
        }
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this partner?")) return;
    startTransition(async () => {
      try {
        await deletePartner(id);
        setPartners((prev) => prev.filter((p) => p.id !== id));
        toast.success("Partner deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Partners</h1>
          <p className="mt-1 text-sm text-ink-muted">{partners.length} partners.</p>
        </div>
        <button type="button" onClick={startCreate} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700">
          New partner
        </button>
      </div>

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">{creating ? "New partner" : "Edit partner"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Name</label>
              <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Tier</label>
              <select value={form.tier ?? "community"} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
                {TIERS.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Website URL</label>
              <input value={form.website_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Logo path</label>
              <input value={form.logo_path ?? ""} onChange={(e) => setForm((f) => ({ ...f, logo_path: e.target.value }))} placeholder="partners/logo.png" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Description</label>
              <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Sort order</label>
              <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.is_test ?? false} onChange={(e) => setForm((f) => ({ ...f, is_test: e.target.checked }))} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600" />
                Test partner
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600" />
                Active
              </label>
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
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Name</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Tier</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Test</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {partners.map((p) => (
              <tr key={p.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-3 text-ink-muted">{p.tier}</td>
                <td className="px-4 py-3">{p.is_test && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Test</span>}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
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
