"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Mail } from "lucide-react";

import { createAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { AuthInput } from "@/components/auth/auth-input";

/**
 * The sign-in form.
 *
 * ## Magic link, and only a magic link
 *
 * There is no password field and no third-party button. Every member of staff
 * is a named person with a recorded consent tier and a role, and the people
 * who need access to a donor's story are exactly the people a shared password
 * is dangerous for. A link that arrives by email, expires, and cannot be
 * reused is a better fit than a password somebody writes on a sticky note.
 *
 * The Google and Apple buttons that were here did nothing but say they were
 * coming soon. They are gone rather than left as a promise.
 *
 * ## Why it felt slow
 *
 * Signing in with a password meant the browser called Supabase, then pushed
 * to `/admin` *and* refreshed the router — two renders of the whole admin
 * shell, each of which asked the server for the session, the staff record, the
 * permissions and the page list. The link flow has no second render at all,
 * and the admin gate now reads what it needs in one round trip.
 */
export function LoginForm({ error }: { error?: string | null }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || sending) return;

    setSending(true);
    try {
      const supabase = createAuthBrowserClient();
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
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
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
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
          We sent a sign-in link to <strong className="text-ink">{email}</strong>.
          Open it on this device to continue. The link works once and then
          expires.
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
            disabled={sending}
            className="text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send it again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Sign in
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Enter your email and we will send you a link to sign in. No password to
        remember or share.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <form onSubmit={sendMagicLink} className="mt-8 space-y-4">
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
          disabled={sending || !email.trim()}
          className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending the link…" : "Email me a sign-in link"}
        </button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-center text-xs text-ink-muted">
        The link expires after a short time.{" "}
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
