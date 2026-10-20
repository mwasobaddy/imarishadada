import { getEvents } from "@/app/[locale]/admin/actions/events";
import { DataTable, RowAction, StatusBadge } from "@/components/admin/data-table";
import { EmptyState, PageHeader, PrimaryAction } from "@/components/admin/page-header";

export default async function EventsListPage() {
  const events = await getEvents();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Content"
        title="Events"
        description="Events with a date, a location and an optional RSVP. Separate from posts because the data is different."
        count={`${events.length} ${events.length === 1 ? "event" : "events"}`}
        action={<PrimaryAction href="/admin/content/events/new">New event</PrimaryAction>}
      />

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create one and it appears on the public events page with its own URL."
          action={<PrimaryAction href="/admin/content/events/new">New event</PrimaryAction>}
        />
      ) : (
        <DataTable
          caption="Events"
          headers={["Title", "When", "Where", "RSVP", "Status", ""]}
        >
          {events.map((event) => (
            <tr key={event.id} className="transition-colors hover:bg-surface-lilac/60">
              <td className="px-4 py-3 font-medium text-ink">{event.title}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                {new Date(event.starts_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-ink-muted">{event.location ?? "—"}</td>
              <td className="px-4 py-3">
                {event.rsvp_enabled ? (
                  <StatusBadge tone="info">Open</StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">Closed</StatusBadge>
                )}
              </td>
              <td className="px-4 py-3">
                {event.published ? (
                  <StatusBadge tone="active">Published</StatusBadge>
                ) : (
                  <StatusBadge tone="draft">Draft</StatusBadge>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <RowAction href={`/admin/content/events/${event.id}`}>Edit</RowAction>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
