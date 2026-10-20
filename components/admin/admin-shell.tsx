"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  ClipboardList,
  Eye,
  FileText,
  Gauge,
  Handshake,
  Heart,
  Image as ImageIcon,
  Languages,
  LayoutGrid,
  LogOut,
  Mail,
  MessageCircle,
  Newspaper,
  Search,
  Settings,
  Shield,
  UserCog,
  Users,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/admin/permissions";

type Staff = { id: string; display_name: string; email: string; is_developer: boolean };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: { resource: string; action: string } | null;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: Gauge, permission: null },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content/stories", label: "Stories", icon: BookOpen, permission: { resource: "stories", action: "read" } },
      { href: "/admin/content/posts", label: "News & posts", icon: Newspaper, permission: { resource: "posts", action: "read" } },
      { href: "/admin/content/events", label: "Events", icon: Calendar, permission: { resource: "events", action: "read" } },
      { href: "/admin/content/programmes", label: "Programmes", icon: LayoutGrid, permission: { resource: "programmes", action: "read" } },
      { href: "/admin/content/faqs", label: "FAQs", icon: FileText, permission: { resource: "faqs", action: "read" } },
      { href: "/admin/content/team", label: "Team", icon: Users, permission: { resource: "team_members", action: "read" } },
      { href: "/admin/content/partners", label: "Partners", icon: Handshake, permission: { resource: "partners", action: "read" } },
      { href: "/admin/content/volunteer-roles", label: "Volunteer roles", icon: UserPlus, permission: { resource: "volunteer_roles", action: "read" } },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/giving-tiers", label: "Giving tiers", icon: Heart, permission: { resource: "giving_tiers", action: "read" } },
      { href: "/admin/impact", label: "Impact stats", icon: BarChart3, permission: { resource: "impact_stats", action: "read" } },
      { href: "/admin/financials", label: "Financials", icon: CircleDollarSign, permission: { resource: "financial_breakdown", action: "read" } },
      { href: "/admin/transparency", label: "Transparency", icon: Eye, permission: { resource: "transparency_gaps", action: "read" } },
      { href: "/admin/media", label: "Media", icon: ImageIcon, permission: { resource: "media", action: "read" } },
      { href: "/admin/enquiries", label: "Enquiries", icon: Mail, permission: { resource: "enquiries", action: "read" } },
      { href: "/admin/partner-enquiries", label: "Partner enquiries", icon: ClipboardList, permission: { resource: "partner_enquiries", action: "read" } },
      { href: "/admin/volunteer-applications", label: "Volunteer apps", icon: UserPlus, permission: { resource: "volunteer_applications", action: "read" } },
      { href: "/admin/chat", label: "Team chat", icon: MessageCircle, permission: { resource: "notifications", action: "read" } },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: { resource: "settings", action: "read" } },
      { href: "/admin/users", label: "Users", icon: UserCog, permission: { resource: "users", action: "read" } },
      { href: "/admin/roles", label: "Roles", icon: Shield, permission: { resource: "roles", action: "read" } },
      { href: "/admin/audit-log", label: "Audit log", icon: FileText, permission: { resource: "audit_log", action: "read" } },
      { href: "/admin/translations", label: "Translations", icon: Languages, permission: { resource: "translations", action: "read" } },
    ],
  },
];

const COLLAPSE_KEY = "admin-sidebar-collapsed";
const COLLAPSE_EVENT = "admin-sidebar-collapsed-change";

/**
 * The collapsed state lives in localStorage, so it is external store state.
 * `useSyncExternalStore` is the right tool: it reads the value during
 * render without a `setState`-in-effect cascade, and it keeps the server
 * snapshot stable so hydration does not mismatch.
 */
function subscribeCollapsed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

function getCollapsedSnapshot() {
  return localStorage.getItem(COLLAPSE_KEY) === "1";
}

function getCollapsedServerSnapshot() {
  return false;
}

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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Collapse preference is remembered — a rail that snaps back every visit is
  // worse than no rail at all.
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  function toggleCollapsed() {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }

  const hasPerm = (p: NavItem["permission"]) =>
    p === null ||
    permissions.some((perm) => perm.resource === p.resource && perm.action === p.action);

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => hasPerm(i.permission)),
  })).filter((g) => g.items.length > 0);

  // The most specific match wins. A plain "starts with" would let the
  // `/admin` Dashboard item match every path beneath it, so the breadcrumb
  // read "Dashboard" on every page.
  const activeItem = groups
    .flatMap((g) => g.items)
    .filter((i) => pathname === i.href || pathname?.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const initials = staff.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    setUserMenuOpen(false);
    const { createAuthBrowserClient } = await import("@/lib/supabase/auth-browser");
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ══ Desktop sidebar ══ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card transition-[width] duration-200 ease-out lg:flex ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {/* Header */}
        <div
          className={`flex h-14 shrink-0 items-center gap-2 border-b border-border ${
            collapsed ? "justify-center px-2" : "px-4"
          }`}
        >
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="" className="h-7 w-auto" />
              <span className="text-sm font-semibold tracking-tight text-brand-600">
                Imarisha Dada
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/admin" aria-label="Imarisha Dada admin" className="flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="Imarisha Dada" className="h-7 w-auto" />
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 pb-6">
          {groups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-muted/50">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="mx-2 mb-2 border-t border-border" />}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${
                          collapsed ? "h-9 w-9 justify-center" : "px-2.5 py-2"
                        } ${
                          active
                            ? "bg-brand-50 text-brand-600"
                            : "text-ink-muted hover:bg-surface-lilac hover:text-ink"
                        }`}
                      >
                        {/* Active accent bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-600" />
                        )}
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer — user */}
        <div className="shrink-0 border-t border-border p-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className={`flex w-full items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-surface-lilac ${
                collapsed ? "h-9 w-9 justify-center" : "px-2.5 py-2"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-brand-50">
                {initials}
              </span>
              {!collapsed && (
                <>
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-xs font-medium text-ink">
                      {staff.display_name}
                    </span>
                    <span className="truncate text-[11px] text-ink-muted">
                      {staff.email}
                    </span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                </>
              )}
            </button>

            {userMenuOpen && !collapsed && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute bottom-full left-0 z-50 mb-1 w-56 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
                >
                  <div className="flex items-center gap-2.5 px-2.5 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-brand-50">
                      {initials}
                    </span>
                    <span className="grid min-w-0 leading-tight">
                      <span className="truncate text-sm font-medium text-ink">
                        {staff.display_name}
                      </span>
                      <span className="truncate text-xs text-ink-muted">
                        {staff.email}
                      </span>
                    </span>
                  </div>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ══ Mobile top bar ══ */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="" className="h-7 w-auto" />
          <span className="text-sm font-semibold text-brand-600">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* ══ Mobile full-screen nav ══ */}
      {menuOpen && (
        <div className="fixed inset-0 top-14 z-30 flex flex-col bg-surface lg:hidden">
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="mx-auto max-w-md space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-muted/50">
                    {group.label}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.href || pathname?.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                              active
                                ? "border-brand-600 bg-brand-50 text-brand-600"
                                : "border-border bg-card text-ink hover:border-brand-600/40"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border bg-card px-4 py-4">
            <div className="mx-auto flex max-w-md items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-brand-50">
                {initials}
              </span>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium text-ink">
                  {staff.display_name}
                </span>
                <span className="truncate text-xs text-ink-muted">{staff.email}</span>
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Main ══ */}
      <div
        className={`transition-[padding] duration-200 ease-out ${
          collapsed ? "lg:pl-[68px]" : "lg:pl-64"
        }`}
      >
        {/* Sticky site header */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink lg:flex"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
          <span className="truncate text-sm font-medium text-ink">
            {activeItem?.label ?? "Admin"}
          </span>
          <span className="hidden text-ink-muted/40 sm:inline">/</span>
          <span className="hidden truncate text-sm text-ink-muted sm:inline">
            Imarisha Dada
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 sm:flex"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted lg:inline">
                ⌘K
              </kbd>
            </button>
            <Link
              href="/admin/chat"
              aria-label="Team chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
