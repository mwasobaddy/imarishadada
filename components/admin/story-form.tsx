"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createStory,
  updateStory,
  publishStory,
  unpublishStory,
  deleteStory,
} from "@/app/[locale]/admin/actions/stories";

type Story = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  quote: string;
  attribution: string;
  consent_tier: string;
  consent_expires_at: string;
  image_path: string;
  reading_minutes: string;
  featured: boolean;
  published: boolean;
  programme_id: string;
};

const CONSENT_TIERS = [
  { value: "named_full", label: "Named + photographed (written consent)" },
  { value: "named_no_face", label: "Named, no photo" },
  { value: "anonymised", label: "Anonymised (no name, no image)" },
];

export function StoryForm({
  initial,
  programmes,
}: {
  initial?: Story;
  programmes: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<Story>(
    initial ?? {
      slug: "",
      title: "",
      excerpt: "",
      body: "",
      quote: "",
      attribution: "",
      consent_tier: "anonymised",
      consent_expires_at: "",
      image_path: "",
      reading_minutes: "",
      featured: false,
      published: false,
      programme_id: "",
    },
  );

  function set<K extends keyof Story>(key: K, value: Story[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    startTransition(async () => {
      try {
        const payload = {
          slug: form.slug || undefined,
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          quote: form.quote || null,
          attribution: form.attribution || null,
          consent_tier: form.consent_tier,
          consent_expires_at: form.consent_expires_at || null,
          image_path: form.image_path || null,
          reading_minutes: form.reading_minutes ? parseInt(form.reading_minutes) : null,
          featured: form.featured,
          published: form.published,
          programme_id: form.programme_id || null,
        };
        if (initial?.id) {
          await updateStory(initial.id, payload as any);
          toast.success("Story updated");
        } else {
          const created = await createStory(payload as any);
          toast.success("Story created");
          router.push(`/admin/content/stories/${created.id}`);
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
        await publishStory(initial.id!);
        toast.success("Story published");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Publish failed");
      }
    });
  }

  async function handleUnpublish() {
    if (!initial?.id) return;
    startTransition(async () => {
      try {
        await unpublishStory(initial.id!);
        toast.success("Story unpublished");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unpublish failed");
      }
    });
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this story permanently?")) return;
    startTransition(async () => {
      try {
        await deleteStory(initial.id!);
        toast.success("Story deleted");
        router.push("/admin/content/stories");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-600">
          {initial?.id ? "Edit story" : "New story"}
        </h1>
        <div className="flex gap-2">
          {initial?.id && (
            <>
              {initial?.published ? (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={pending}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={pending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Publish
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-full bg-brand-600 px-6 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className="block text-sm font-medium text-ink">Title</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto-generated from title"
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={12}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Quote (optional)</label>
            <textarea
              value={form.quote}
              onChange={(e) => set("quote", e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Attribution</label>
            <input
              value={form.attribution}
              onChange={(e) => set("attribution", e.target.value)}
              placeholder="e.g. Amina, 17, Kibera"
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Programme</label>
            <select
              value={form.programme_id}
              onChange={(e) => set("programme_id", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="">None</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Consent tier</label>
            <select
              value={form.consent_tier}
              onChange={(e) => set("consent_tier", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              {CONSENT_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              Changing this requires re-attested consent. Consent expiry
              auto-downgrades to anonymised.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Consent expires</label>
            <input
              type="date"
              value={form.consent_expires_at}
              onChange={(e) => set("consent_expires_at", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Image path</label>
            <input
              value={form.image_path}
              onChange={(e) => set("image_path", e.target.value)}
              placeholder="stories/filename.jpg"
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Reading minutes</label>
            <input
              type="number"
              value={form.reading_minutes}
              onChange={(e) => set("reading_minutes", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600"
            />
            <label htmlFor="featured" className="text-sm text-ink">
              Featured on homepage
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
