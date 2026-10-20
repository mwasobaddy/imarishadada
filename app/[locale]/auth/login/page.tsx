"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
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
      <div className="space-y-4 text-center">
        <p className="text-sm text-ink-muted">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this
          device to continue.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm font-medium text-brand-600 underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg bg-surface-lilac p-1">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "magic"
              ? "bg-card text-brand-600 shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Magic link
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "password"
              ? "bg-card text-brand-600 shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Password
        </button>
      </div>

      <form onSubmit={mode === "magic" ? sendMagicLink : signInWithPassword} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>

        {mode === "password" && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-brand-50 transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {loading
            ? "Working…"
            : mode === "magic"
              ? "Send magic link"
              : "Sign in"}
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-center text-xs text-ink-muted">Or continue with</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => toast.info("Google sign-in is coming soon.")}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => toast.info("Apple sign-in is coming soon.")}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            Apple
          </button>
        </div>
      </div>
    </div>
  );
}
