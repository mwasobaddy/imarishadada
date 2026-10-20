import type { Metadata } from "next";

/**
 * Auth shell — split-screen layout.
 *
 * ## Why split-screen
 *
 * A centred card on a blank canvas is the default every auth page ships with.
 * It works, but it wastes the left half of a wide screen and gives the eye
 * nothing to rest on. A split layout puts the brand and a short value
 * proposition on the left and the form on the right, which is the pattern
 * Linear, Vercel and Stripe all use for their own sign-in surfaces.
 *
 * ## Left panel
 *
 * Warm brand wash (purple → deeper purple) with the brand mark, the
 * organisation name, and a one-line value statement. No photography — the
 * consented images are for the public site, not the admin chrome.
 *
 * ## Right panel
 *
 * The form, vertically centred, on the page surface. On mobile the left
 * panel collapses to a compact brand header so the form stays above the fold.
 *
 * ## Why the brand mark, not a heart
 *
 * The previous icon was a generic lucide heart. The brand mark
 * (`/brand/mark.svg`) is the actual Imarisha Dada identity and is what
 * appears on the public site header. Using a different icon here made the
 * auth page feel like a different product.
 */

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Left panel — brand ── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-600 px-10 py-12 text-brand-50 lg:flex xl:px-16">
        {/* Subtle pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top: brand mark + name */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/mark.svg"
              alt="Imarisha Dada"
              className="h-10 w-10"
            />
            <span className="text-xl font-semibold tracking-tight">
              Imarisha Dada
            </span>
          </div>
        </div>

        {/* Middle: value proposition */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Empowering girls and young women in Kibera
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-100/80">
            Staff access only. Every action is audited, every consent is
            recorded, and every change to financial settings requires two
            people to approve.
          </p>
        </div>

        {/* Bottom: footer note */}
        <div className="relative z-10 text-xs text-brand-100/60">
          <p>© 2026 Imarisha Dada. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12 sm:px-8 lg:px-12">
        {/* Mobile brand header (hidden on lg) */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mark.svg"
            alt="Imarisha Dada"
            className="h-9 w-9"
          />
          <span className="text-lg font-semibold tracking-tight text-brand-600">
            Imarisha Dada
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
            {children}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
            Access is limited to invited staff.
            <br />
            If you need an account, contact the organisation.
          </p>
        </div>
      </div>
    </div>
  );
}
