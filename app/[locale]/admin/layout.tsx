import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { getMyPermissions, getCurrentStaff } from "@/lib/admin/permissions";

import { AdminShell } from "@/components/admin/admin-shell";
import { PwaInstallPrompt } from "@/components/admin/pwa-install-prompt";

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

  return (
    <>
      <AdminShell permissions={permissions} staff={staff}>
        {children}
      </AdminShell>
      <PwaInstallPrompt />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
