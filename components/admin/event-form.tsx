"use client";

import { PageHeader } from "@/components/admin/page-header";
import { useState, useTransition } from "react";

import { MediaPicker } from "@/components/admin/media-picker";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createEvent, updateEvent, publishEvent, unpublishEvent, deleteEvent } from "@/app/[locale]/admin/actions/events";
import type { WithOptionalSlug } from "@/lib/supabase/row-types";

type Event = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  location: string;
  starts_at: string;
  ends_at: string;
  rsvp_enabled: boolean;
  max_attendees: string;
  image_path: string;
  published: boolean;
};

export function EventForm({ initial }: { initial?: Event & { id: string; published: boolean } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<Event>(
    initial
      ? { slug: initial.slug, title: initial.title, description: initial.description ?? "", body: initial.body ?? "", location: initial.location ?? "", starts_at: initial.starts_at ? new Date(initial.starts_at).toISOString().slice(0, 16) : "", ends_at: initial.ends_at ? new Date(initial.ends_at).toISOString().slice(0, 16) : "", rsvp_enabled: initial.rsvp_enabled, max_attendees: initial.max_attendees?.toString() ?? "", image_path: initial.image_path ?? "", published: initial.published }
      : { slug: "", title: "", description: "", body: "", location: "", starts_at: "", ends_at: "", rsvp_enabled: false, max_attendees: "", image_path: "", published: false },
  );

  function set<K extends keyof Event>(key: K, value: Event[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    // `starts_at` is NOT NULL in the database, so the form has to catch a
    // missing date before it reaches the insert.
    if (!form.starts_at) {
      toast.error("A start date is required");
      return;
    }
    startTransition(async () => {
      try {
        const payload: WithOptionalSlug<"events"> = {
          slug: form.slug || undefined,
          title: form.title,
          description: form.description,
          body: form.body || null,
          location: form.location || null,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          rsvp_enabled: form.rsvp_enabled,
          max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
          image_path: form.image_path || null,
        };
        if (initial?.id) {
          await updateEvent(initial.id, payload);
          toast.success("Event updated");
        } else {
          const created = await createEvent(payload);
          toast.success("Event created");
          router.push(`/admin/content/events/${created.id}`);
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handlePublish() {
    if (!initial?.id) return;
    startTransition(async () => {
      try {
        await (initial.published ? unpublishEvent(initial.id!) : publishEvent(initial.id!));
        toast.success(initial.published ? "Unpublished" : "Published");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      try {
        await deleteEvent(initial.id!);
        toast.success("Event deleted");
        router.push("/admin/content/events");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title={initial?.id ? "Edit event" : "New event"}
        description="Events carry a date, a location and an optional RSVP."
        action={(
          <div className="flex flex-wrap gap-2">
            {initial?.id && (
              <>
                <button type="button" onClick={handlePublish} disabled={pending} className={`rounded-lg px-4 py-2 text-sm font-medium ${initial.published ? "border border-border bg-card text-ink-muted hover:border-brand-600 hover:text-brand-600" : "bg-green-600 text-white hover:bg-green-700"}`}>
                  {initial.published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" onClick={handleDelete} disabled={pending} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
                  Delete
                </button>
              </>
            )}
            <button type="button" onClick={save} disabled={pending} className="rounded-full bg-brand-600 px-6 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className="block text-sm font-medium text-ink">Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Slug</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Body</label>
            <textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={8} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Location</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Starts at</label>
            <input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Ends at</label>
            <input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Image path</label>
            <MediaPicker
                id="event-form-image"
                label="Image path"
                value={form.image_path ?? ""}
                onChange={(path) => setForm((f) => ({ ...f, image_path: path }))}
              />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Max attendees</label>
            <input type="number" value={form.max_attendees} onChange={(e) => set("max_attendees", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rsvp" checked={form.rsvp_enabled} onChange={(e) => set("rsvp_enabled", e.target.checked)} className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600" />
            <label htmlFor="rsvp" className="text-sm text-ink">RSVP enabled</label>
          </div>
        </div>
      </div>
    </div>
  );
}
