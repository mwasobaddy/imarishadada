"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { Database } from "@/lib/supabase/types";

type Permission = { resource: string; action: string };
type Staff = { id: string; display_name: string; email: string; is_developer: boolean };

type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Permission required to see this item. null = always visible to any staff. */
  permission: { resource: string; action: string } | null;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "layout-dashboard", permission: null },
  { href: "/admin/content/stories", label: "Stories", icon: "book-open", permission: { resource: "stories", action: "read" } },
  { href: "/admin/content/posts", label: "News & posts", icon: "newspaper", permission: { resource: "posts", action: "read" } },
  { href: "/admin/content/events", label: "Events", icon: "calendar", permission: { resource: "events", action: "read" } },
  { href: "/admin/content/programmes", label: "Programmes", icon: "graduation-cap", permission: { resource: "programmes", action: "read" } },
  { href: "/admin/content/faqs", label: "FAQs", icon: "help-circle", permission: { resource: "faqs", action: "read" } },
  { href: "/admin/content/team", label: "Team", icon: "users", permission: { resource: "team_members", action: "read" } },
  { href: "/admin/content/partners", label: "Partners", icon: "handshake", permission: { resource: "partners", action: "read" } },
  { href: "/admin/content/volunteer-roles", label: "Volunteer roles", icon: "user-plus", permission: { resource: "volunteer_roles", action: "read" } },
  { href: "/admin/giving-tiers", label: "Giving tiers", icon: "heart", permission: { resource: "giving_tiers", action: "read" } },
  { href: "/admin/impact", label: "Impact stats", icon: "bar-chart", permission: { resource: "impact_stats", action: "read" } },
  { href: "/admin/financials", label: "Financials", icon: "dollar-sign", permission: { resource: "financial_breakdown", action: "read" } },
  { href: "/admin/transparency", label: "Transparency", icon: "eye", permission: { resource: "transparency_gaps", action: "read" } },
  { href: "/admin/media", label: "Media", icon: "image", permission: { resource: "media", action: "read" } },
  { href: "/admin/enquiries", label: "Enquiries", icon: "mail", permission: { resource: "enquiries", action: "read" } },
  { href: "/admin/partner-enquiries", label: "Partner enquiries", icon: "briefcase", permission: { resource: "partner_enquiries", action: "read" } },
  { href: "/admin/volunteer-applications", label: "Volunteer apps", icon: "clipboard", permission: { resource: "volunteer_applications", action: "read" } },
  { href: "/admin/settings", label: "Settings", icon: "settings", permission: { resource: "settings", action: "read" } },
  { href: "/admin/users", label: "Users", icon: "user-cog", permission: { resource: "users", action: "read" } },
  { href: "/admin/roles", label: "Roles", icon: "shield", permission: { resource: "roles", action: "read" } },
  { href: "/admin/audit-log", label: "Audit log", icon: "file-text", permission: { resource: "audit_log", action: "read" } },
  { href: "/admin/chat", label: "Team chat", icon: "message-circle", permission: { resource: "notifications", action: "read" } },
  { href: "/admin/translations", label: "Translations", icon: "languages", permission: { resource: "translations", action: "read" } },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasPerm = (p: NavItem["permission"]) =>
    p === null || permissions.some((perm) => perm.resource === p.resource && perm.action === p.action);

  const visibleItems = NAV_ITEMS.filter((item) => hasPerm(item.permission));

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-card p-2 shadow-md lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-card border-r border-border transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-4">
            <span className="text-lg font-semibold text-brand-600">Admin</span>
            <span className="text-xs text-ink-muted">Imarisha Dada</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
          </nav>
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs text-ink-muted truncate">{staff.display_name}</p>
            <p className="text-xs text-ink-muted truncate">{staff.email}</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
