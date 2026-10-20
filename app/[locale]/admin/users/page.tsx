import { getUsers } from "@/app/[locale]/admin/actions/roles";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Users</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {users.length} staff members. Invite new users via the Supabase
            Dashboard, then assign roles here.
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
          <p className="text-sm text-ink-muted">No staff users yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Email</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Roles</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Active</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-lilac/50">
                  <td className="px-4 py-3 font-medium text-ink">{user.display_name}</td>
                  <td className="px-4 py-3 text-ink-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.roles ?? []).map((r) => (
                        <span
                          key={r.id}
                          className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600"
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-brand-600">Invite a new user</h2>
        <p className="mt-2 text-sm text-ink-muted">
          1. Go to Supabase Dashboard → Authentication → Users → Invite User
        </p>
        <p className="text-sm text-ink-muted">
          2. Enter the email address. The user will receive a magic link.
        </p>
        <p className="text-sm text-ink-muted">
          3. Once they sign in, assign roles here (coming soon).
        </p>
      </div>
    </div>
  );
}
