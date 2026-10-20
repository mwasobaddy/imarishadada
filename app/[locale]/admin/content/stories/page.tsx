import Link from "next/link";

import { getStories } from "@/app/[locale]/admin/actions/stories";

export default async function StoriesListPage() {
  const stories = await getStories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Stories</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Consent-managed archive. {stories.length} stories total.
          </p>
        </div>
        <Link
          href="/admin/content/stories/new"
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700"
        >
          New story
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
          <p className="text-lg font-semibold text-brand-600">No stories yet</p>
          <p className="mt-2 text-sm text-ink-muted">
            Create your first story to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Programme</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Consent</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Published</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-surface-lilac/50">
                  <td className="px-4 py-3 font-medium text-ink">{story.title}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {story.programmes?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-lilac px-2 py-0.5 text-xs font-medium text-ink-muted">
                      {story.consent_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {story.published ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Published
                      </span>
                    ) : story.scheduled_at ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Scheduled
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {story.published_at
                      ? new Date(story.published_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/content/stories/${story.id}`}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
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
