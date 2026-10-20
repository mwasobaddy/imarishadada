import { notFound } from "next/navigation";

import { getEvent } from "@/app/[locale]/admin/actions/events";
import { EventForm } from "@/components/admin/event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <EventForm
      initial={{
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description ?? "",
        body: event.body ?? "",
        location: event.location ?? "",
        starts_at: event.starts_at,
        ends_at: event.ends_at ?? "",
        rsvp_enabled: event.rsvp_enabled,
        max_attendees: event.max_attendees?.toString() ?? "",
        image_path: event.image_path ?? "",
        published: event.published,
      }}
    />
  );
}
