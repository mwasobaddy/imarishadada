import { getUsers } from "@/app/[locale]/admin/actions/roles";
import { DataTable, StatusBadge } from "@/components/admin/data-table";
import { EmptyState, PageHeader } from "@/components/admin/page-header";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="System"
        title="Users"
        description="Staff with access to this panel. Invite someone by email, then give them the roles they need."
        count={`${users.length} ${users.length === 1 ? "person" : "people"}`}
      />

      {users.length === 0 ? (
        <EmptyState
          title="No staff yet"
          description="Invite the first person and assign them a role."
        />
      ) : (
        <DataTable caption="Users" headers={["Name", "Email", "Roles", "Status", "Last login"]}>
          {users.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-surface-lilac/60">
              <td className="px-4 py-3 font-medium text-ink">{user.display_name}</td>
              <td className="px-4 py-3 text-ink-muted">{user.email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(user.roles ?? []).map((r) => (
                    <StatusBadge key={r.id} tone="info">
                      {r.name}
                    </StatusBadge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                {user.is_active ? (
                  <StatusBadge tone="active">Active</StatusBadge>
                ) : (
                  <StatusBadge tone="inactive">Inactive</StatusBadge>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleString()
                  : "Never"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
