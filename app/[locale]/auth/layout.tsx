import type { Metadata } from "next";

/**
 * Auth shell.
 *
 * ## Why this exists
 *
 * The auth pages sit under `app/[locale]/` so they inherit the document shell
 * (fonts, `<html lang>`, theme tokens). But the locale layout renders a bare
 * `<body>` — it is built for pages that compose their own full-width layout.
 * Without this wrapper the sign-in form stretches edge to edge with no
 * container, no card and no brand mark, which is what it looked like before
 * this file existed.
 *
 * ## Why it is not a shared component
 *
 * `app/[locale]/layout.tsx` owns `<html>` and `<body>`, and the body is a flex
 * column. This layout slots in between them, so it can centre its own card
 * without touching the public site's chrome.
 */

export const metadata: Metadata = {
  // A plain string, not a `{ template }` object. The root layout already
  // applies the "| Imarisha Dada" suffix; setting a template here too would
  // stack them and produce "Sign in | Imarisha Dada | Imarisha Dada".
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-brand-50 shadow-sm">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-semibold tracking-tight text-brand-600">
            Imarisha Dada
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">Admin access</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
          {children}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          Access is limited to invited staff.
          <br />
          If you need an account, contact the organisation.
        </p>
      </div>
    </div>
  );
}
