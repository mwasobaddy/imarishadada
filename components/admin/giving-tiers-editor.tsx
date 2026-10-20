"use client";

import { useState, useTransition } from "react";

import { PageHeader } from "@/components/admin/page-header";
import type { Update, WithOptionalSlug } from "@/lib/supabase/row-types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createGivingTier,
  updateGivingTier,
  deleteGivingTier,
  toggleGivingTier,
} from "@/app/[locale]/admin/actions/giving-tiers";

type Tier = {
  id: string;
  slug: string;
  programme_id: string | null;
  tier_type: string;
  cadence: string;
  amount: number;
  currency: string;
  outcome_label: string;
  sort_order: number;
  active: boolean;
  display_label: string | null;
  rail_note: string | null;
  programmes?: { title: string; slug: string } | null;
};

type Programme = { id: string; title: string };

export function GivingTiersEditor({
  tiers: initialTiers,
  programmes,
}: {
  tiers: Tier[];
  programmes: Programme[];
}) {
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState<Partial<Tier>>({});

  function startEdit(tier: Tier) {
    setEditing(tier.id);
    setForm({ ...tier });
  }

  function startCreate() {
    setCreating(true);
    setForm({
      slug: "",
      tier_type: "one_time",
      cadence: "one_time",
      amount: 0,
      currency: "KES",
      outcome_label: "",
      sort_order: tiers.length + 1,
      active: true,
      programme_id: null,
    });
  }

  function cancel() {
    setEditing(null);
    setCreating(false);
    setForm({});
  }

  async function save() {
    startTransition(async () => {
      try {
        if (creating) {
          const payload: WithOptionalSlug<"giving_tiers"> = {
            slug: form.slug || undefined,
            tier_type: form.tier_type ?? "one_time",
            cadence: form.cadence ?? "one_time",
            amount: form.amount ?? 0,
            currency: form.currency ?? "KES",
            outcome_label: form.outcome_label ?? "",
            sort_order: form.sort_order ?? 0,
            active: form.active ?? true,
            programme_id: form.programme_id || null,
          };
          const created = await createGivingTier(payload);
          setTiers((prev) => [...prev, created as Tier]);
          toast.success("Tier created");
        } else if (editing) {
          const payload: Update<"giving_tiers"> = {
            slug: form.slug || undefined,
            tier_type: form.tier_type ?? "one_time",
            cadence: form.cadence ?? "one_time",
            amount: form.amount ?? 0,
            currency: form.currency ?? "KES",
            outcome_label: form.outcome_label ?? "",
            sort_order: form.sort_order ?? 0,
            active: form.active ?? true,
            programme_id: form.programme_id || null,
          };
          const updated = await updateGivingTier(editing, payload);
          setTiers((prev) => prev.map((t) => (t.id === editing ? (updated as Tier) : t)));
          toast.success("Tier updated");
        }
        cancel();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function toggle(id: string, active: boolean) {
    startTransition(async () => {
      try {
        await toggleGivingTier(id, active);
        setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));
        toast.success(active ? "Tier activated" : "Tier deactivated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Toggle failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this giving tier?")) return;
    startTransition(async () => {
      try {
        await deleteGivingTier(id);
        setTiers((prev) => prev.filter((t) => t.id !== id));
        toast.success("Tier deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Giving tiers"
        description="Donation amounts and outcome labels. Editing here takes effect immediately — no deploy needed."
        action={(
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            New tier
          </button>
        )}
      />

      {/* Create/Edit form */}
      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">
            {creating ? "New tier" : "Edit tier"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-ink">Slug</label>
              <input
                value={form.slug ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Amount</label>
              <input
                type="number"
                value={form.amount ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Currency</label>
              <input
                value={form.currency ?? "KES"}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Cadence</label>
              <select
                value={form.cadence ?? "one_time"}
                onChange={(e) => setForm((f) => ({ ...f, cadence: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Programme</label>
              <select
                value={form.programme_id ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, programme_id: e.target.value || null }))}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                <option value="">None</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Sort order</label>
              <input
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-ink">Outcome label</label>
              <input
                value={form.outcome_label ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, outcome_label: e.target.value }))}
                placeholder="e.g. a full re-entry package for one girl"
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-ink">Display label (optional)</label>
              <input
                value={form.display_label ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, display_label: e.target.value }))}
                placeholder="Override for the card label"
                className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-full bg-brand-600 px-6 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tiers table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Outcome</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Cadence</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Programme</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tiers.map((tier) => (
              <tr key={tier.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 font-medium text-ink">
                  {tier.currency} {Number(tier.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-ink-muted">{tier.outcome_label}</td>
                <td className="px-4 py-3 text-ink-muted">{tier.cadence}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {tier.programmes?.title ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(tier.id, !tier.active)}
                    disabled={pending}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      tier.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tier.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(tier)}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tier.id)}
                      disabled={pending}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
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
