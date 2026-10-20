import { getStories } from "@/app/[locale]/admin/actions/stories";
import { DataTable, RowAction, StatusBadge } from "@/components/admin/data-table";
import { EmptyState, PageHeader, PrimaryAction } from "@/components/admin/page-header";

export default async function StoriesListPage() {
  const stories = await getStories();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Content"
        title="Stories"
        description="Consent-managed archive. A story without recorded consent never renders on the public site."
        count={`${stories.length} ${stories.length === 1 ? "story" : "stories"}`}
        action={<PrimaryAction href="/admin/content/stories/new">New story</PrimaryAction>}
      />

      {stories.length === 0 ? (
        <EmptyState
          title="No stories yet"
          description="A story is the only place a participant's own words appear. The first one is the hardest."
          action={<PrimaryAction href="/admin/content/stories/new">New story</PrimaryAction>}
        />
      ) : (
        <DataTable
          caption="Stories"
          headers={["Title", "Programme", "Consent", "Status", "Published", ""]}
        >
          {stories.map((story) => (
            <tr key={story.id} className="transition-colors hover:bg-surface-lilac/60">
              <td className="px-4 py-3 font-medium text-ink">{story.title}</td>
              <td className="px-4 py-3 text-ink-muted">
                {story.programmes?.title ?? "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={
                    story.consent_tier === "named_full"
                      ? "active"
                      : story.consent_tier === "named_no_face"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {story.consent_tier.replace(/_/g, " ")}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">
                {story.published ? (
                  <StatusBadge tone="active">Published</StatusBadge>
                ) : story.scheduled_at ? (
                  <StatusBadge tone="info">Scheduled</StatusBadge>
                ) : (
                  <StatusBadge tone="draft">Draft</StatusBadge>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                {story.published_at
                  ? new Date(story.published_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <RowAction href={`/admin/content/stories/${story.id}`}>Edit</RowAction>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
