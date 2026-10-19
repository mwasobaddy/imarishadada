import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

import { geistClassName } from "@/app/fonts";

/**
 * Global 404 — an unmatched URL, anywhere in the app.
 *
 * ## Why this file exists at all
 *
 * `app/not-found.tsx` handles `notFound()` thrown from a page. It does not
 * handle a URL that matches no route. That case needs `global-not-found.tsx`,
 * which requires `experimental.globalNotFound`.
 *
 * ## Why it is hand-rolled rather than reusing the styled 404
 *
 * This file **bypasses the app's normal rendering entirely** — it does not go
 * through the root layout or the `[locale]` layout. That means it must supply
 * its own `<html>`, its own `lang`, its own font classes, and its own
 * stylesheet import. The Next.js docs are explicit: "you'll need to import any
 * global styles, fonts, or other dependencies that your 404 page requires.
 * This includes your theme."
 *
 * The alternative — the auto-generated `<html>` with no `lang` and no theme —
 * is a real defect: a screen reader does not know the page is English, and the
 * page renders with the wrong background and the wrong font in dark mode.
 *
 * ## Why the styles are inline here
 *
 * The stylesheet *is* imported, so the Tailwind classes below work normally.
 * The only inline styling is the fallback background colour on `<body>`, which
 * must be present before the stylesheet loads, otherwise a dark-mode visitor
 * sees a white flash on a page that is about to be dark purple.
 */
export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist.",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="en-KE" className={geistClassName}>
      <body
        className="flex min-h-screen flex-col items-center justify-center bg-surface px-5 text-center text-ink"
        style={{ backgroundColor: "#FFFAF7" }}
      >
        <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
          Page not found
        </h1>
        <p className="measure mx-auto mt-4 text-lg text-ink-muted">
          We could not find that page. It may have moved, or the link that sent
          you here may be out of date.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/"
            className="inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
          >
            Go to the homepage
          </Link>
          <Link href="/donate"
            className="inline-flex min-h-13 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-semibold text-ink transition-colors hover:bg-surface-lilac focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Donate
          </Link>
        </div>

        <p className="measure mx-auto mt-10 text-sm text-ink-muted">
          If you arrived here from a link we published, please{" "}
          <Link href="/contact"
            className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
          >
            tell us which one
          </Link>{" "}
          so we can fix it.
        </p>
      </body>
    </html>
  );
}
