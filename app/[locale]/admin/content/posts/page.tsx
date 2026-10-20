import Link from "next/link";

import { getPosts } from "@/app/[locale]/admin/actions/posts";

export default async function PostsListPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">News & posts</h1>
          <p className="mt-1 text-sm text-ink-muted">{posts.length} posts.</p>
        </div>
        <Link href="/admin/content/posts/new" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700">
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
          <p className="text-sm text-ink-muted">No posts yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Category</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Published</th>
                <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-lilac/50">
                  <td className="px-4 py-3 font-medium text-ink">{post.title}</td>
                  <td className="px-4 py-3 text-ink-muted">{post.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/content/posts/${post.id}`} className="text-sm font-medium text-brand-600 hover:underline">
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
