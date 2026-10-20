"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Permission = { resource: string; action: string };
type Staff = { id: string; display_name: string; email: string; is_developer: boolean };

type NavItem = {
  href: string;
  label: string;
  permission: { resource: string; action: string } | null;
  /** Group for the mobile overlay. */
  group: "content" | "operations" | "system";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", permission: null, group: "operations" },
  // Content
  { href: "/admin/content/stories", label: "Stories", permission: { resource: "stories", action: "read" }, group: "content" },
  { href: "/admin/content/posts", label: "News & posts", permission: { resource: "posts", action: "read" }, group: "content" },
  { href: "/admin/content/events", label: "Events", permission: { resource: "events", action: "read" }, group: "content" },
  { href: "/admin/content/programmes", label: "Programmes", permission: { resource: "programmes", action: "read" }, group: "content" },
  { href: "/admin/content/faqs", label: "FAQs", permission: { resource: "faqs", action: "read" }, group: "content" },
  { href: "/admin/content/team", label: "Team", permission: { resource: "team_members", action: "read" }, group: "content" },
  { href: "/admin/content/partners", label: "Partners", permission: { resource: "partners", action: "read" }, group: "content" },
  { href: "/admin/content/volunteer-roles", label: "Volunteer roles", permission: { resource: "volunteer_roles", action: "read" }, group: "content" },
  // Operations
  { href: "/admin/giving-tiers", label: "Giving tiers", permission: { resource: "giving_tiers", action: "read" }, group: "operations" },
  { href: "/admin/impact", label: "Impact stats", permission: { resource: "impact_stats", action: "read" }, group: "operations" },
  { href: "/admin/financials", label: "Financials", permission: { resource: "financial_breakdown", action: "read" }, group: "operations" },
  { href: "/admin/transparency", label: "Transparency", permission: { resource: "transparency_gaps", action: "read" }, group: "operations" },
  { href: "/admin/media", label: "Media", permission: { resource: "media", action: "read" }, group: "operations" },
  { href: "/admin/enquiries", label: "Enquiries", permission: { resource: "enquiries", action: "read" }, group: "operations" },
  { href: "/admin/partner-enquiries", label: "Partner enquiries", permission: { resource: "partner_enquiries", action: "read" }, group: "operations" },
  { href: "/admin/volunteer-applications", label: "Volunteer apps", permission: { resource: "volunteer_applications", action: "read" }, group: "operations" },
  { href: "/admin/chat", label: "Team chat", permission: { resource: "notifications", action: "read" }, group: "operations" },
  // System
  { href: "/admin/settings", label: "Settings", permission: { resource: "settings", action: "read" }, group: "system" },
  { href: "/admin/users", label: "Users", permission: { resource: "users", action: "read" }, group: "system" },
  { href: "/admin/roles", label: "Roles", permission: { resource: "roles", action: "read" }, group: "system" },
  { href: "/admin/audit-log", label: "Audit log", permission: { resource: "audit_log", action: "read" }, group: "system" },
  { href: "/admin/translations", label: "Translations", permission: { resource: "translations", action: "read" }, group: "system" },
];

const GROUP_LABELS: Record<NavItem["group"], string> = {
  content: "Content",
  operations: "Operations",
  system: "System",
};

export function AdminShell({
  children,
  permissions,
  staff,
}: {
  children: React.ReactNode;
  permissions: Permission[];
  staff: Staff;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const hasPerm = (p: NavItem["permission"]) =>
    p === null || permissions.some((perm) => perm.resource === p.resource && perm.action === p.action);

  const visibleItems = NAV_ITEMS.filter((item) => hasPerm(item.permission));

  // Group items for the mobile overlay.
  const grouped = visibleItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  async function handleSignOut() {
    const { createAuthBrowserClient } = await import("@/lib/supabase/auth-browser");
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="text-lg font-semibold tracking-tight text-brand-600">
            Admin
          </span>
          <span className="text-xs text-ink-muted">Imarisha Dada</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {(["operations", "content", "system"] as const).map((group) => {
            const items = visibleItems.filter((i) => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-4">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-muted/60">
                  {GROUP_LABELS[group]}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            active
                              ? "bg-brand-50 text-brand-600"
                              : "text-ink-muted hover:bg-surface-lilac hover:text-ink"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-3">
          <p className="truncate text-xs font-medium text-ink">{staff.display_name}</p>
          <p className="truncate text-xs text-ink-muted">{staff.email}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar + full-screen overlay (no slide-in sheet) ── */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <span className="text-sm font-semibold text-brand-600">Admin</span>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card"
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-30 flex flex-col bg-surface lg:hidden">
          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-20">
            <div className="mx-auto max-w-md space-y-6">
              {(["operations", "content", "system"] as const).map((group) => {
                const items = grouped[group] ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-muted/60">
                      {GROUP_LABELS[group]}
                    </p>
                    <ul className="space-y-1">
                      {items.map((item) => {
                        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className={`block rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                                active
                                  ? "border-brand-600 bg-brand-50 text-brand-600"
                                  : "border-border bg-card text-ink hover:border-brand-600/40"
                              }`}
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border-t border-border bg-card px-4 py-4">
            <p className="text-xs font-medium text-ink">{staff.display_name}</p>
            <p className="text-xs text-ink-muted">{staff.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-64">
        <div className="px-6 pb-6 pt-20 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
