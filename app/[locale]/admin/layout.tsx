import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { getMyPermissions, getCurrentStaff } from "@/lib/admin/permissions";
import { createServiceClient } from "@/lib/supabase/client";

import { AdminShell } from "@/components/admin/admin-shell";
import { PwaInstallPrompt } from "@/components/admin/pwa-install-prompt";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * The pages shown in the "Pages" workspace nav.
 *
 * Read here rather than in the shell because the shell is a client component
 * and this is a database read. `null` means the caller cannot read pages, in
 * which case the nav item does not render at all.
 */
async function loadPages(canReadPages: boolean) {
  if (!canReadPages) return null;
  const { data } = await createServiceClient()
    .from("site_pages")
    .select("page_key, label, route, sort_order")
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}

/**
 * Admin shell. Everything under `/[locale]/admin` is protected: an
 * unauthenticated request is bounced to `/auth/login` before any admin
 * component renders, and the nav is filtered by the caller's permissions.
 *
 * The public site chrome (navbar, footer) is deliberately NOT rendered here.
 * Admin pages render their own shell via `AdminShell`.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createAuthServerClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) {
    redirect(`/${locale}/auth/login?next=/admin`);
  }

  const [staff, permissions] = await Promise.all([
    getCurrentStaff(),
    getMyPermissions(),
  ]);

  if (!staff || !staff.is_active) {
    redirect(`/${locale}/auth/login?error=${encodeURIComponent("Your account is not active. Contact the developer.")}`);
  }

  const canReadPages = permissions.some(
    (p) => p.resource === "pages" && p.action === "read",
  );
  const pages = await loadPages(canReadPages);

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
