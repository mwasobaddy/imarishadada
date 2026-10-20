"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { AuthInput } from "@/components/auth/auth-input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email for the sign-in link.");
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
          <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0l7.89-5.26M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-ink">Check your email</h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          We sent a sign-in link to <strong className="text-ink">{email}</strong>.
          Open it on this device to continue.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Sign in
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Welcome back. Enter your details to continue.
      </p>

      {/* OAuth */}
      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => toast.info("Google sign-in is coming soon.")}
          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={() => toast.info("Apple sign-in is coming soon.")}
          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Sign in with Apple
        </button>
      </div>

      {/* OR divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-ink-muted/60">
          Or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={signInWithPassword} className="space-y-4">
        <AuthInput
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
          placeholder="you@example.org"
          icon={<Mail className="h-4 w-4" />}
        />

        <AuthInput
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
          placeholder="Enter password"
          icon={<Lock className="h-4 w-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-ink-muted transition-colors hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          hint={
            <Link
              href="/auth/forgot-password"
              className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Magic link fallback */}
      <div className="mt-6 border-t border-border pt-5 text-center">
        <p className="text-xs text-ink-muted">
          Prefer not to type a password?{" "}
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={loading || !email.trim()}
            className="font-medium text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-50"
          >
            Email me a sign-in link
          </button>
        </p>
      </div>
    </div>
  );
}
