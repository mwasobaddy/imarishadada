"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail } from "lucide-react";

import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { AuthInput } from "@/components/auth/auth-input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email for the reset link.");
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
          We sent a password reset link to <strong className="text-ink">{email}</strong>.
          Open it on this device to set a new password.
        </p>
        <Link
          href="/auth/login"
          className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Reset password
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-center text-xs text-ink-muted">
        Remembered it?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
