"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { AuthInput } from "@/components/auth/auth-input";

/**
 * The sign-in form.
 *
 * ## Two ways in, one at a time
 *
 * A password is what people expect, so it is what the page shows first: an
 * email, a password, and a sign-in button. Above the fields is a button that
 * says "Log in with magic link" — press it and the password field is gone
 * from the page, and the link takes its place.
 *
 * Only one is shown at a time on purpose. Two forms on one screen make it
 * ambiguous which button does what, and a person in a hurry presses the wrong
 * one and concludes the site is broken.
 *
 * ## Why the link is worth keeping
 *
 * Every member of staff is a named person with a recorded consent tier and a
 * role, and the people who need access to a donor's story are exactly the
 * people a shared password is dangerous for. A link that arrives by email,
 * expires, and cannot be reused is a better fit than a password somebody
 * writes on a sticky note — so it is one click away, not the only way in.
 *
 * ## Why it felt slow
 *
 * Signing in used to push to `/admin` *and* refresh the router — two renders
 * of the whole admin shell, each of which asked the server for the session,
 * the staff record, the permissions and the page list. The link flow has no
 * second render at all, and the admin gate now reads what it needs in one
 * round trip.
 */
export function LoginForm({
  error,
  next = "/admin",
}: {
  error?: string | null;
  /** Where to land after a successful sign-in. A relative path. */
  next?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  /**
   * Switch between the two ways in.
   *
   * The password is dropped on the way to the link, so it is never left
   * sitting in the form for a moment longer than it has to be, and the link
   * panel is dropped on the way back, so a link that was sent an hour ago
   * does not greet someone who has come to type a password.
   */
  function switchMode(next: "password" | "magic-link") {
    setMode(next);
    setSent(false);
    setPassword("");
    setShowPassword(false);
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;

    setBusy(true);
    try {
      const supabase = createAuthBrowserClient();
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (sendError) {
        toast.error(sendError.message);
        return;
      }
      setSent(true);
      toast.success("Sign-in link sent. Check your email.");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "The link could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || busy) return;

    setBusy(true);
    try {
      const supabase = createAuthBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        toast.error(signInError.message);
        return;
      }
      // One navigation. The session is in the cookie by now, so the admin
      // gate reads it on the way in — a second render would ask the server
      // the same questions twice.
      router.replace(next);
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "The sign-in failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const magicLinkMode = mode === "magic-link";

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Sign in
      </h1>
      {sent ? null : (
        <p className="mt-2 text-center text-sm text-ink-muted">
          {magicLinkMode
            ? "Enter your email and we will send you a link to sign in. No password to remember or share."
            : "Welcome back. Enter your details to continue."}
        </p>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {/*
        The other way in, at the top of the form.

        It is a button rather than a link because it changes the form on this
        page — it is a mode, not a destination.
      */}
      <button
        type="button"
        onClick={() => switchMode(magicLinkMode ? "password" : "magic-link")}
        aria-controls="sign-in-form"
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
      >
        {magicLinkMode ? (
          <>
            <Lock className="h-4 w-4" aria-hidden="true" />
            Log in with a password
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Log in with magic link
          </>
        )}
      </button>

      {sent ? (
        <div className="mt-6 space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <svg
              className="h-6 w-6 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-ink">Check your email</h2>
          <p className="text-sm leading-relaxed text-ink-muted">
            We sent a sign-in link to{" "}
            <strong className="text-ink">{email}</strong>. Open it on this
            device to continue. The link works once and then expires.
          </p>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              Use a different email
            </button>
            <button
              type="button"
              onClick={sendMagicLink}
              disabled={busy}
              className="text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send it again"}
            </button>
          </div>
        </div>
      ) : (
        <form
          id="sign-in-form"
          onSubmit={magicLinkMode ? sendMagicLink : signInWithPassword}
          className="mt-4 space-y-4"
        >
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

          {/* The password field is removed from the page, not just hidden. */}
          {magicLinkMode ? null : (
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
          )}

          <button
            type="submit"
            disabled={busy || !email.trim() || (!magicLinkMode && !password)}
            className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? magicLinkMode
                ? "Sending the link…"
                : "Signing in…"
              : magicLinkMode
                ? "Email me a sign-in link"
                : "Sign in"}
          </button>
        </form>
      )}

      <p className="mt-6 border-t border-border pt-5 text-center text-xs text-ink-muted">
        {magicLinkMode
          ? "The link expires after a short time."
          : "Staff accounts only."}{" "}
        <Link
          href="/auth/forgot-password"
          className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Trouble signing in?
        </Link>
      </p>
    </div>
  );
}
