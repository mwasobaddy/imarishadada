"use client";

import { useState, useTransition } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { toast } from "sonner";

import { createRole, updateRolePermissions, deleteRole } from "@/app/[locale]/admin/actions/roles";

type Permission = { id: string; resource: string; action: string; description: string };
type RolePerm = { permission_id: string; permissions: { resource: string; action: string } };
type Role = {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  role_permissions: RolePerm[];
};

export function RolesManager({ roles: initialRoles, permissions }: { roles: Role[]; permissions: Permission[] }) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  // Group permissions by resource
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedPerms(new Set());
  }

  function startEdit(role: Role) {
    setEditing(role.id);
    setCreating(false);
    setName(role.name);
    setDescription(role.description);
    setSelectedPerms(new Set(role.role_permissions.map((rp) => rp.permission_id)));
  }

  function cancel() {
    setCreating(false);
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedPerms(new Set());
  }

  async function save() {
    if (!name.trim()) { toast.error("Role name is required"); return; }
    startTransition(async () => {
      try {
        if (creating) {
          const role = await createRole(name.trim(), description, Array.from(selectedPerms));
          setRoles((prev) => [...prev, { ...role, is_system: false, role_permissions: [] } as Role]);
          toast.success("Role created");
        } else if (editing) {
          await updateRolePermissions(editing, Array.from(selectedPerms));
          toast.success("Permissions updated");
        }
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this role?")) return;
    startTransition(async () => {
      try {
        await deleteRole(id);
        setRoles((prev) => prev.filter((r) => r.id !== id));
        toast.success("Role deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  function togglePerm(id: string) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleResource(resource: string) {
    const perms = grouped[resource] ?? [];
    const allSelected = perms.every((p) => selectedPerms.has(p.id));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const p of perms) {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="System"
        title="Roles & permissions"
        description="Roles are collections of permissions, not fixed job titles."
        action={(
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            New role
          </button>
        )}
      />

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-600">
            {creating ? "New role" : `Edit: ${name}`}
          </h2>
          {creating && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. content_reviewer"
                  className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm font-medium text-ink">Permissions</p>
            <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-surface p-3">
              {Object.entries(grouped).map(([resource, perms]) => (
                <div key={resource} className="mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={perms.every((p) => selectedPerms.has(p.id))}
                      onChange={() => toggleResource(resource)}
                      className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600"
                    />
                    {resource}
                  </label>
                  <div className="ml-6 mt-1 flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-1 text-xs text-ink-muted">
                        <input
                          type="checkbox"
                          checked={selectedPerms.has(p.id)}
                          onChange={() => togglePerm(p.id)}
                          className="h-3 w-3 rounded border-border text-brand-600 focus:ring-brand-600"
                        />
                        {p.action}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Name</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Description</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Permissions</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">System</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 font-medium text-ink">{role.name}</td>
                <td className="px-4 py-3 text-ink-muted">{role.description}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {role.role_permissions?.length ?? 0} permissions
                </td>
                <td className="px-4 py-3">
                  {role.is_system && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                      System
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(role)}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    {!role.is_system && (
                      <button
                        type="button"
                        onClick={() => handleDelete(role.id)}
                        disabled={pending}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
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
