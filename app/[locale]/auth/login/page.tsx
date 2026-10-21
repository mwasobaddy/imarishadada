import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/**
 * Sign in.
 *
 * The page is a Server Component so it can read the `?error=` the admin gate
 * sends when it turns someone away — "Your account is not active" — and show
 * that sentence instead of a form that appears to work and then bounces
 * again.
 *
 * It also reads `?next=`, so a person who was turned away from a page lands
 * back on it once they are signed in. The path is checked here rather than in
 * the form: only a relative path is allowed, so `?next=` cannot be used to
 * send someone to another site after they sign in.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  const next = safeNextPath(
    typeof params.next === "string" ? params.next : null,
  );

  return <LoginForm error={error} next={next} />;
}
