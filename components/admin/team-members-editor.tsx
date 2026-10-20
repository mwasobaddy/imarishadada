"use client";

import { useState, useTransition } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { toast } from "sonner";

import { createTeamMember, updateTeamMember, deleteTeamMember } from "@/app/[locale]/admin/actions/team";

type Member = {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string | null;
  photo_path: string | null;
  safeguarding_officer: boolean;
  consent_recorded: boolean;
  title: string | null;
  department: string | null;
  social_links: Record<string, string> | null;
  sort_order: number;
  active: boolean;
};

export function TeamMembersEditor({ members: initial }: { members: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Member>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ slug: "", name: "", role: "", bio: "", photo_path: "", safeguarding_officer: false, consent_recorded: false, title: "", department: "", sort_order: members.length + 1, active: true });
  }

  function startEdit(m: Member) {
    setEditing(m.id);
    setCreating(false);
    setForm({ ...m });
  }

  function cancel() { setCreating(false); setEditing(null); setForm({}); }

  async function save() {
    if (!form.name || !form.slug || !form.role) { toast.error("Name, slug, and role are required"); return; }
    startTransition(async () => {
      try {
        const payload = {
          slug: form.slug ?? "",
          name: form.name ?? "",
          role: form.role ?? "",
          bio: form.bio || null,
          photo_path: form.photo_path || null,
          safeguarding_officer: form.safeguarding_officer ?? false,
          consent_recorded: form.consent_recorded ?? false,
          title: form.title || null,
          department: form.department || null,
          sort_order: form.sort_order ?? 0,
          active: form.active ?? true,
        };
        if (creating) {
          const created = await createTeamMember(payload);
          setMembers((prev) => [...prev, created as Member]);
          toast.success("Team member created");
        } else if (editing) {
          const updated = await updateTeamMember(editing, payload);
          setMembers((prev) => prev.map((m) => (m.id === editing ? (updated as Member) : m)));
          toast.success("Team member updated");
        }
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this team member?")) return;
    startTransition(async () => {
      try {
        await deleteTeamMember(id);
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast.success("Team member deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Team members"
        description="A member without recorded consent will not render on the public site."
        action={(
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            New member
          </button>
        )}
      />

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">{creating ? "New member" : "Edit member"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Name</label>
              <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Slug</label>
              <input value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Role</label>
              <input value={form.role ?? ""} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Title</label>
              <input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Department</label>
              <input value={form.department ?? ""} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Photo path</label>
              <input value={form.photo_path ?? ""} onChange={(e) => setForm((f) => ({ ...f, photo_path: e.target.value }))} placeholder="team/filename.jpg" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Bio</label>
              <textarea value={form.bio ?? ""} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Sort order</label>
              <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.consent_recorded ?? false} onChange={(e) => setForm((f) => ({ ...f, consent_recorded: e.target.checked }))} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600" />
                Consent recorded
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.safeguarding_officer ?? false} onChange={(e) => setForm((f) => ({ ...f, safeguarding_officer: e.target.checked }))} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600" />
                Safeguarding officer
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
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Role</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Consent</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                <td className="px-4 py-3 text-ink-muted">{m.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.consent_recorded ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {m.consent_recorded ? "Recorded" : "Missing"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(m)} className="text-sm font-medium text-brand-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleDelete(m.id)} disabled={pending} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
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
