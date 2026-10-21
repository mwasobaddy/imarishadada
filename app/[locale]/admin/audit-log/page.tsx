import { getAuditLog } from "@/app/[locale]/admin/actions/audit-log";
import { DataTable, StatusBadge } from "@/components/admin/data-table";
import { EmptyState, PageHeader } from "@/components/admin/page-header";

export default async function AuditLogPage() {
  const logs = await getAuditLog(200);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="System"
        title="Audit log"
        description="Every change made in this panel, in order, with who made it and what the row looked like before. It cannot be edited or deleted."
        count={`${logs.length} entries`}
      />

      {logs.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          description="The first content change will appear here."
        />
      ) : (
        <DataTable
          caption="Audit log"
          headers={["When", "Action", "Table", "Actor", "Details"]}
        >
          {logs.map((log) => (
            <tr key={log.id} className="transition-colors hover:bg-surface-lilac/60">
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={
                    log.action === "delete"
                      ? "warning"
                      : log.action === "create"
                        ? "active"
                        : "neutral"
                  }
                >
                  {log.action}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-ink-muted">{log.table_name}</td>
              <td className="px-4 py-3 text-ink-muted">
                {log.actor_email ?? "unknown"}
              </td>
              <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-ink-muted">
                {log.metadata
                  ? JSON.stringify(log.metadata).slice(0, 80)
                  : log.after
                    ? JSON.stringify(log.after).slice(0, 80)
                    : log.before
                      ? JSON.stringify(log.before).slice(0, 80)
                      : "—"}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
