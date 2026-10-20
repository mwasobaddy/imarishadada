import type { Metadata } from "next";

import { BrandIllustration } from "@/components/auth/brand-illustration";

/**
 * Auth shell — floating card on a coloured page.
 *
 * ## The reference
 *
 * Modelled on a Dribbble login shot: a deep-coloured page, one large
 * rounded cream card floating in the middle, and the card split into two
 * columns — form on the left, a pull-quote and a line-art illustration on
 * the right. The illustration bleeds off the bottom edge of the card.
 *
 * ## Why the card is cream and the page is purple
 *
 * The brand purple is the loudest colour we have, so it goes on the page
 * rather than the card. A cream card on a purple field also keeps the form
 * legible: the inputs are near-white on cream, which is the contrast
 * direction that works, rather than white-on-white.
 *
 * ## Why the logo, not the mark
 *
 * `/brand/logo.svg` is the identity the public site header and footer use.
 * Using it here means the sign-in screen is unmistakably the same product.
 *
 * ## The quote
 *
 * The organisation's own words, from the about page. It is not a testimonial
 * attributed to a named person — inventing one would be fabricating a voice
 * for a real organisation.
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
    <div className="relative min-h-screen overflow-hidden bg-brand-600">
      {/* Page texture — a soft radial wash so the flat purple has depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-100/10 blur-3xl"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-pink-600/20 blur-3xl"
      />

      {/* The card */}
      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-surface shadow-2xl shadow-brand-900/25">
          <div className="grid lg:grid-cols-2">
            {/* ── Left: brand + form ── */}
            <div className="flex flex-col px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo.svg"
                  alt=""
                  width={1200}
                  height={1200}
                  className="h-9 w-auto sm:h-10"
                />
                <span className="text-base font-semibold tracking-tight text-brand-600 sm:text-lg">
                  Imarisha Dada
                </span>
              </div>

              {/* Form */}
              <div className="mt-10 flex-1 sm:mt-12">
                <div className="w-full max-w-sm">{children}</div>
              </div>
            </div>

            {/* ── Right: quote + illustration ── */}
            <div className="relative hidden flex-col justify-between overflow-hidden border-l border-border/60 bg-surface-lilac/40 px-10 py-12 lg:flex xl:px-14">
              {/* Quote mark */}
              <svg
                className="h-9 w-9 text-brand-600/40"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10 7H6a3 3 0 00-3 3v7h7v-7H6a1 1 0 011-1V7h3V3H6a6 6 0 00-6 6v7a3 3 0 003 3h4a3 3 0 003-3V7zm12 0h-4a3 3 0 00-3 3v7h7v-7h-4a1 1 0 011-1V7h3V3h-4a6 6 0 00-6 6v7a3 3 0 003 3h4a3 3 0 003-3V7z" />
              </svg>

              {/* Quote */}
              <div className="mt-5">
                <p className="text-lg font-medium leading-relaxed text-ink xl:text-xl">
                  The girls who fell out of school here were not girls who had
                  stopped learning. They were girls who had been pushed out.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-brand-50">
                    ID
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">Imarisha Dada</p>
                    <p className="text-xs text-ink-muted">Our story</p>
                  </div>
                </div>
              </div>

              {/* Illustration — bleeds off the bottom edge */}
              <BrandIllustration className="-mb-10 -mt-10 w-full max-w-md self-end opacity-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
