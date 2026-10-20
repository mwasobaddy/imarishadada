"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { AuthInput } from "@/components/auth/auth-input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase's recovery link lands here with a session in the URL hash. We
  // wait for the client to pick it up before allowing the password update —
  // calling updateUser() without a session silently does nothing.
  useEffect(() => {
    const supabase = createAuthBrowserClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      setError(error.message);
      return;
    }
    toast.success("Password updated. Signing you in…");
    router.push("/admin");
    router.refresh();
  }

  if (error) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-ink">Link expired</h2>
        <p className="text-sm leading-relaxed text-ink-muted">{error}</p>
        <Link
          href="/auth/forgot-password"
          className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <h2 className="text-xl font-semibold text-ink">Verifying your link</h2>
        <p className="text-sm text-ink-muted">One moment…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Set new password
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Choose a strong password you&apos;ll remember.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <AuthInput
          id="password"
          label="New password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
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
        />

        <AuthInput
          id="confirm"
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat the password"
          icon={<Lock className="h-4 w-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="text-ink-muted transition-colors hover:text-ink"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}
