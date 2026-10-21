import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { getAuthServerClient } from "@/lib/supabase/auth-server";
import { getMyPermissions, getCurrentStaff } from "@/lib/admin/permissions";
import { createServiceClient } from "@/lib/supabase/client";

import { AdminShell } from "@/components/admin/admin-shell";
import { PwaInstallPrompt } from "@/components/admin/pwa-install-prompt";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin shell.
 *
 * ## Why the Suspense boundary is here and not in the locale layout
 *
 * Admin is request-time by definition — every read is scoped to the signed-in
 * staff member, so there is nothing to prerender. The boundary therefore has to
 * exist, and it used to live in `app/[locale]/layout.tsx`. That worked, but a
 * boundary wrapping *every* route also forced every **public** page to render
 * partially (`◐` instead of `○`), because the framework cannot prove a subtree
 * is static when an ancestor might suspend.
 *
 * Moving it here scopes the dynamic hole to the admin routes. The public pages
 * have no boundary above them any more, so with `'use cache'` on every reader
 * they prerender in full.
 *
 * The boundary has to be *above* the auth read, not beside it: pages render
 * before the layout they sit in, so a page's own data fetch would otherwise run
 * outside the boundary and fail the build.
 */

/**
 * The pages shown in the "Pages" workspace nav.
 *
 * Read here rather than in the shell because the shell is a client component
 * and this is a database read. `null` means the caller cannot read pages, in
 * which case the nav item does not render at all.
 */
async function loadPages() {
  const { data } = await createServiceClient()
    .from("site_pages")
    .select("page_key, label, route, sort_order")
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <AdminGate locale={locale}>{children}</AdminGate>;
}

/**
 * Auth gate. Everything that touches cookies or the session lives in here, so
 * it is all inside the boundary above.
 */
async function AdminGate({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const supabase = await getAuthServerClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) {
    redirect(`/${locale}/auth/login?next=/admin`);
  }

  /**
   * The three reads run together.
   *
   * They used to run one after another — the staff record and the permissions
   * together, then the page list, because the page list was only fetched for
   * a staff member who may read pages. That last round trip was on the critical
   * path of every admin screen, including the first one after signing in, and
   * it was the slowest part of it.
   *
   * The page list is now fetched alongside the others and handed to the shell
   * only if the permission is there, so it never reaches a staff member who
   * may not see it.
   */
  const [staff, permissions, allPages] = await Promise.all([
    getCurrentStaff(),
    getMyPermissions(),
    loadPages(),
  ]);

  if (!staff || !staff.is_active) {
    redirect(
      `/${locale}/auth/login?error=${encodeURIComponent(
        "Your account is not active. Contact the developer.",
      )}`,
    );
  }

  const canReadPages = permissions.some(
    (p) => p.resource === "pages" && p.action === "read",
  );
  const pages = canReadPages ? allPages : null;

  return (
    <>
      <AdminShell permissions={permissions} staff={staff} pages={pages}>
        {children}
      </AdminShell>
      <PwaInstallPrompt />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
