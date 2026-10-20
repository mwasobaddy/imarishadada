import Link from "next/link";
import { BookOpen, Mail, Newspaper, UserPlus } from "lucide-react";

import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { PageHeader } from "@/components/admin/page-header";

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
    {
      label: "Stories",
      value: storyCount ?? 0,
      href: "/admin/content/stories",
      icon: BookOpen,
      hint: "Published and in draft",
    },
    {
      label: "Posts",
      value: postCount ?? 0,
      href: "/admin/content/posts",
      icon: Newspaper,
      hint: "News and announcements",
    },
    {
      label: "Enquiries",
      value: enquiryCount ?? 0,
      href: "/admin/enquiries",
      icon: Mail,
      hint: "Waiting for a reply",
    },
    {
      label: "Volunteer apps",
      value: volunteerCount ?? 0,
      href: "/admin/volunteer-applications",
      icon: UserPlus,
      hint: "Applications received",
    },
  ];

  const quickActions = [
    { label: "New story", href: "/admin/content/stories/new" },
    { label: "New post", href: "/admin/content/posts/new" },
    { label: "New event", href: "/admin/content/events/new" },
    { label: "Edit giving tiers", href: "/admin/giving-tiers" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of what is published, what is waiting, and what needs a decision."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-brand-600/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-ink-muted">{stat.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-lilac text-ink-muted transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{stat.hint}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
        <p className="mt-1 text-sm text-ink-muted">
          The things an editor reaches for most often.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* What needs attention */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Link
          href="/admin/roles"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-brand-600/30"
        >
          <h2 className="text-sm font-semibold text-ink">Roles and permissions</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Roles are collections of permissions. Create a role, give it exactly
            the access it needs, and assign it to a person.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            Manage roles
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </Link>
        <Link
          href="/admin/audit-log"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-brand-600/30"
        >
          <h2 className="text-sm font-semibold text-ink">Audit log</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Every change made in this panel, with who made it and what the row
            looked like before. It cannot be edited or deleted.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            View the log
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
