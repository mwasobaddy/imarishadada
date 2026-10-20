import Link from "next/link";

import { getEvents } from "@/app/[locale]/admin/actions/events";

export default async function EventsListPage() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Events</h1>
          <p className="mt-1 text-sm text-ink-muted">{events.length} events.</p>
        </div>
        <Link href="/admin/content/events/new" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700">
          New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
          <p className="text-sm text-ink-muted">No events yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Location</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-surface-lilac/50">
                  <td className="px-4 py-3 font-medium text-ink">{e.title}</td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(e.starts_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-muted">{e.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {e.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/content/events/${e.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                      Edit
                    </Link>
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
