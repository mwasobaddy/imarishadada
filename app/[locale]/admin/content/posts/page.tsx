import { getPosts } from "@/app/[locale]/admin/actions/posts";
import { DataTable, RowAction, StatusBadge } from "@/components/admin/data-table";
import { EmptyState, PageHeader, PrimaryAction } from "@/components/admin/page-header";

export default async function PostsListPage() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Content"
        title="News & posts"
        description="Announcements, updates and press. A post can be scheduled to publish at a future date."
        count={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
        action={<PrimaryAction href="/admin/content/posts/new">New post</PrimaryAction>}
      />

      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="News, announcements and programme updates live here."
          action={<PrimaryAction href="/admin/content/posts/new">New post</PrimaryAction>}
        />
      ) : (
        <DataTable
          caption="Posts"
          headers={["Title", "Category", "Status", "Published", ""]}
        >
          {posts.map((post) => (
            <tr key={post.id} className="transition-colors hover:bg-surface-lilac/60">
              <td className="px-4 py-3 font-medium text-ink">{post.title}</td>
              <td className="px-4 py-3 text-ink-muted">
                {post.category.replace(/_/g, " ")}
              </td>
              <td className="px-4 py-3">
                {post.published ? (
                  <StatusBadge tone="active">Published</StatusBadge>
                ) : post.scheduled_at ? (
                  <StatusBadge tone="info">Scheduled</StatusBadge>
                ) : (
                  <StatusBadge tone="draft">Draft</StatusBadge>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <RowAction href={`/admin/content/posts/${post.id}`}>Edit</RowAction>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
