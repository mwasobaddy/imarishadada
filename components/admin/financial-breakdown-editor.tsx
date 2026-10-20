"use client";

import { useState, useTransition } from "react";
import type { Insert } from "@/lib/supabase/row-types";
import { toast } from "sonner";

import {
  createFinancialBreakdown,
  deleteFinancialBreakdown,
} from "@/app/[locale]/admin/actions/financial";

type Row = {
  id: string;
  fiscal_year: string;
  programme_id: string | null;
  category: string;
  amount: number;
  currency: string;
  share_pct: number | null;
  sort_order: number;
  programmes?: { title: string } | null;
};

type Programme = { id: string; title: string };

export function FinancialBreakdownEditor({ breakdown: initial, programmes }: { breakdown: Row[]; programmes: Programme[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Row>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setForm({ fiscal_year: "2025-26", programme_id: null, category: "", amount: 0, currency: "KES", share_pct: null, sort_order: rows.length + 1 });
  }

  function cancel() { setCreating(false); setForm({}); }

  async function save() {
    if (!form.fiscal_year || !form.category) { toast.error("Fiscal year and category are required"); return; }
    startTransition(async () => {
      try {
        const payload: Insert<"financial_breakdown"> = {
          fiscal_year: form.fiscal_year ?? "",
          programme_id: form.programme_id || null,
          category: form.category ?? "",
          amount: form.amount ?? 0,
          currency: form.currency ?? "KES",
          share_pct: form.share_pct ?? null,
          sort_order: form.sort_order ?? 0,
        };
        const created = await createFinancialBreakdown(payload);
        setRows((prev) => [...prev, created as Row]);
        toast.success("Entry created");
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    startTransition(async () => {
      try {
        await deleteFinancialBreakdown(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Entry deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Financial breakdown</h1>
          <p className="mt-1 text-sm text-ink-muted">{rows.length} entries. Published on the transparency page.</p>
        </div>
        <button type="button" onClick={startCreate} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700">
          New entry
        </button>
      </div>

      {creating && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">New entry</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-ink">Fiscal year</label>
              <input value={form.fiscal_year ?? ""} onChange={(e) => setForm((f) => ({ ...f, fiscal_year: e.target.value }))} placeholder="2025-26" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Category</label>
              <input value={form.category ?? ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Amount (KES)</label>
              <input type="number" value={form.amount ?? 0} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Programme</label>
              <select value={form.programme_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, programme_id: e.target.value || null }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
                <option value="">None (overhead)</option>
                {programmes.map((p) => (<option key={p.id} value={p.id}>{p.title}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Share %</label>
              <input type="number" value={form.share_pct ?? ""} onChange={(e) => setForm((f) => ({ ...f, share_pct: e.target.value ? parseFloat(e.target.value) : null }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Sort order</label>
              <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
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
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Year</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Category</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Share %</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Programme</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 text-ink">{r.fiscal_year}</td>
                <td className="px-4 py-3 text-ink">{r.category}</td>
                <td className="px-4 py-3 text-ink-muted">KES {Number(r.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-ink-muted">{r.share_pct ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{r.programmes?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => handleDelete(r.id)} disabled={pending} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
