import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

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
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return <LoginForm error={error} />;
}
