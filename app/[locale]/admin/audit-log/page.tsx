import { getAuditLog } from "@/app/[locale]/admin/actions/audit-log";

export default async function AuditLogPage() {
  const logs = await getAuditLog(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-600">Audit log</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every admin mutation, in order. Not deletable.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
          <p className="text-sm text-ink-muted">No audit entries yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">When</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Action</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Table</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-lilac/50">
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-lilac px-2 py-0.5 text-xs font-medium text-ink-muted">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{log.table_name}</td>
                  <td className="px-4 py-3 text-ink-muted">{log.actor_email ?? "system"}</td>
                  <td className="px-4 py-3 text-ink-muted max-w-xs truncate">
                    {log.after ? JSON.stringify(log.after).slice(0, 80) : log.before ? JSON.stringify(log.before).slice(0, 80) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
