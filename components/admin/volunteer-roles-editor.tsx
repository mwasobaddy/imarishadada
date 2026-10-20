"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createVolunteerRole, updateVolunteerRole, deleteVolunteerRole, toggleVolunteerRole } from "@/app/[locale]/admin/actions/volunteer-roles";

type Role = {
  id: string;
  title: string;
  description: string;
  commitment: string | null;
  requirements: string | null;
  location: string | null;
  time_commitment: string | null;
  skills_needed: string[];
  positions_available: number;
  positions_filled: number;
  active: boolean;
  sort_order: number;
};

export function VolunteerRolesEditor({ roles: initial }: { roles: Role[] }) {
  const [roles, setRoles] = useState<Role[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Role>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ title: "", description: "", commitment: "", requirements: "", location: "", time_commitment: "", skills_needed: [], positions_available: 1, positions_filled: 0, active: true, sort_order: roles.length + 1 });
  }

  function startEdit(r: Role) {
    setEditing(r.id);
    setCreating(false);
    setForm({ ...r, skills_needed: r.skills_needed ?? [] });
  }

  function cancel() { setCreating(false); setEditing(null); setForm({}); }

  async function save() {
    if (!form.title || !form.description) { toast.error("Title and description are required"); return; }
    startTransition(async () => {
      try {
        const payload = {
          title: form.title ?? "",
          description: form.description ?? "", commitment: form.commitment || null, requirements: form.requirements || null, location: form.location || null, time_commitment: form.time_commitment || null, skills_needed: form.skills_needed ?? [], positions_available: form.positions_available ?? 1, positions_filled: form.positions_filled ?? 0, active: form.active ?? true, sort_order: form.sort_order ?? 0 };
        if (creating) {
          const created = await createVolunteerRole(payload);
          setRoles((prev) => [...prev, created as Role]);
          toast.success("Role created");
        } else if (editing) {
          const updated = await updateVolunteerRole(editing, payload);
          setRoles((prev) => prev.map((r) => (r.id === editing ? (updated as Role) : r)));
          toast.success("Role updated");
        }
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this volunteer role?")) return;
    startTransition(async () => {
      try {
        await deleteVolunteerRole(id);
        setRoles((prev) => prev.filter((r) => r.id !== id));
        toast.success("Role deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  async function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      try {
        await toggleVolunteerRole(id, active);
        setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Toggle failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Volunteer roles</h1>
          <p className="mt-1 text-sm text-ink-muted">{roles.length} roles.</p>
        </div>
        <button type="button" onClick={startCreate} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700">
          New role
        </button>
      </div>

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">{creating ? "New role" : "Edit role"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Title</label>
              <input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Location</label>
              <input value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Time commitment</label>
              <input value={form.time_commitment ?? ""} onChange={(e) => setForm((f) => ({ ...f, time_commitment: e.target.value }))} placeholder="e.g. 4 hours/week" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Skills needed (comma-separated)</label>
              <input value={(form.skills_needed ?? []).join(", ")} onChange={(e) => setForm((f) => ({ ...f, skills_needed: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Positions available</label>
              <input type="number" value={form.positions_available ?? 1} onChange={(e) => setForm((f) => ({ ...f, positions_available: parseInt(e.target.value) || 1 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Positions filled</label>
              <input type="number" value={form.positions_filled ?? 0} onChange={(e) => setForm((f) => ({ ...f, positions_filled: parseInt(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Commitment</label>
              <input value={form.commitment ?? ""} onChange={(e) => setForm((f) => ({ ...f, commitment: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Requirements</label>
              <textarea value={form.requirements ?? ""} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink">Description</label>
              <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
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
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Title</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Location</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Positions</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                <td className="px-4 py-3 text-ink-muted">{r.location ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{r.positions_filled}/{r.positions_available}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => handleToggle(r.id, !r.active)} disabled={pending} className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {r.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(r)} className="text-sm font-medium text-brand-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleDelete(r.id)} disabled={pending} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
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
