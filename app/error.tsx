"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary — `app/error.tsx`.
 *
 * **A donation site must never look broken here.** If a server action throws
 * mid-gift, this is what the donor sees. It therefore leads with reassurance
 * that nothing was charged, and gives a way forward that does not depend on the
 * failed code path re-running.
 *
 * Two things are deliberate:
 *
 *   * No error `message` is rendered. A thrown Supabase or payment error can
 *     carry table names, paybill numbers or provider detail. `digest` is safe
 *     to show and is enough to correlate with server logs.
 *   * Retrying is offered but never as the only option. A retry on a donation
 *     could double-submit, so it is framed as "try again" on the page, not as a
 *     button that re-runs the payment blindly.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side detail lands here. Deliberately logged, not displayed.
    console.error("[route error]", error);
  }, [error]);

  return (
    <main id="main" className="bg-surface py-section">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
          Something went wrong
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
          This did not work.
        </h1>

        <p className="measure mt-4 text-lg text-ink-muted">
          Something on our side failed while loading this page. It is not your
          fault, and it is not something you need to fix.
        </p>

        <p className="measure mt-3 font-medium text-ink">
          If you were donating, you have not been charged. A donation only
          completes once our payment provider confirms it, so a page that failed
          to load did not take your money.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-13 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-semibold text-ink transition-colors hover:bg-surface-lilac focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Go to the homepage
          </Link>
        </div>

        <p className="measure mt-10 text-sm text-ink-muted">
          If it keeps happening, please{" "}
          <Link
            href="/contact"
            className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
          >
            let us know
          </Link>
          .
        </p>

        {error.digest ? (
          // Safe to show: an opaque correlation id, not provider or database
          // detail. Lets support match a report to a server log.
          <p className="mt-6 text-xs text-ink-muted tabular">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
