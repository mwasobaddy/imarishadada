"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createPost, updatePost, publishPost, unpublishPost, deletePost } from "@/app/[locale]/admin/actions/posts";

type Post = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string;
  cover_path: string;
  reading_minutes: string;
};

const CATEGORIES = ["news", "story", "update", "press_release", "announcement", "event_recap"];

export function PostForm({ initial }: { initial?: Post & { id: string; published: boolean } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<Post>(
    initial
      ? { slug: initial.slug, title: initial.title, excerpt: initial.excerpt ?? "", body: initial.body ?? "", category: initial.category, tags: initial.tags ?? "", cover_path: initial.cover_path ?? "", reading_minutes: initial.reading_minutes?.toString() ?? "" }
      : { slug: "", title: "", excerpt: "", body: "", category: "news", tags: "", cover_path: "", reading_minutes: "" },
  );

  function set<K extends keyof Post>(key: K, value: Post[K]) {
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
          category: form.category,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          cover_path: form.cover_path || null,
          reading_minutes: form.reading_minutes ? parseInt(form.reading_minutes) : null,
        };
        if (initial?.id) {
          await updatePost(initial.id, payload as any);
          toast.success("Post updated");
        } else {
          const created = await createPost(payload as any);
          toast.success("Post created");
          router.push(`/admin/content/posts/${created.id}`);
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
        await (initial.published ? unpublishPost(initial.id!) : publishPost(initial.id!));
        toast.success(initial.published ? "Unpublished" : "Published");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this post?")) return;
    startTransition(async () => {
      try {
        await deletePost(initial.id!);
        toast.success("Post deleted");
        router.push("/admin/content/posts");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-600">{initial?.id ? "Edit post" : "New post"}</h1>
        <div className="flex gap-2">
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
      </div>

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
            <label className="block text-sm font-medium text-ink">Excerpt</label>
            <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Body</label>
            <textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={12} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Cover image path</label>
            <input value={form.cover_path} onChange={(e) => set("cover_path", e.target.value)} placeholder="posts/filename.jpg" className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Reading minutes</label>
            <input type="number" value={form.reading_minutes} onChange={(e) => set("reading_minutes", e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
