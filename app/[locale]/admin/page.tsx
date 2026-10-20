import { createAuthServerClient } from "@/lib/supabase/auth-server";

export default async function AdminDashboardPage() {
  const supabase = await createAuthServerClient();

  const [
    { count: storyCount },
    { count: postCount },
    { count: enquiryCount },
    { count: volunteerCount },
  ] = await Promise.all([
    supabase.from("stories").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("enquiries").select("*", { count: "exact", head: true }),
    supabase.from("volunteer_applications").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Stories", value: storyCount ?? 0, href: "/admin/content/stories" },
    { label: "Posts", value: postCount ?? 0, href: "/admin/content/posts" },
    { label: "Enquiries", value: enquiryCount ?? 0, href: "/admin/enquiries" },
    { label: "Volunteer apps", value: volunteerCount ?? 0, href: "/admin/volunteer-applications" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-600">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Welcome back. Here is a snapshot of your content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-ink-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-600">{stat.value}</p>
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-brand-600">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/admin/content/stories/new"
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700"
          >
            New story
          </a>
          <a
            href="/admin/content/posts/new"
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700"
          >
            New post
          </a>
          <a
            href="/admin/content/events/new"
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700"
          >
            New event
          </a>
          <a
            href="/admin/giving-tiers"
            className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600"
          >
            Edit giving tiers
          </a>
        </div>
      </div>
    </div>
  );
}
