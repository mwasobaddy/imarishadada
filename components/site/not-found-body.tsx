import Image from "next/image";
import Link from "next/link";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

import { Container } from "@/components/site/container";
import { NAV_ITEMS } from "@/lib/nav";

/**
 * Shared body for both 404 surfaces.
 *
 * Two Next.js 404 surfaces render this: the global one (`app/not-found.tsx`,
 * for a URL matching no route) and the in-group one
 * (`app/(site)/not-found.tsx`, for `notFound()` from a page that did render).
 * The global one gets no site chrome — the root layout has no header — so this
 * component carries its own wordmark rather than assuming one exists above it.
 *
 * ## Why this is not the Next.js default
 *
 * The default 404 is a bare "404 / This page could not be found" with no
 * navigation, no branding and no route out. On a charity site the most likely
 * arrival is an old link from a social post or a funder's PDF, so the visitor
 * arrived intending to do something. Leaving them at a dead end is the one
 * outcome worth spending effort to avoid — hence the site map and the donate
 * path rather than an apology alone.
 */
export function NotFoundBody() {
  return (
    <main id="main" className="bg-surface">
      {/* Wordmark. Present because the global 404 renders without a header. */}
      <Container className="pt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
        >
          <Image
            src="/brand/logo.svg"
            alt="Imarisha Dada"
            width={5000}
            height={5000}
            sizes="200px"
            className="h-11 w-auto"
          />
        </Link>
      </Container>

      <Container className="py-section">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
            404
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
            Page not found
          </h1>
          <p className="measure mt-4 text-lg text-ink-muted">
            We could not find that page. It may have moved, or the link that sent
            you here may be out of date.
          </p>
          <p className="measure mt-3 text-ink-muted">
            Nothing is wrong with your gift or your account. If you were trying to
            donate, the link below will take you straight there.
          </p>
        </div>

        {/* Primary route out. Donate is listed first because the most common
            reason to arrive deep in a site is mid-donation. */}
        <nav aria-label="Main pages" className="mt-12">
          <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
            Where to go instead
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.link}>
                <Link
                  href={item.link}
                  className="flex min-h-13 items-center rounded-card border border-border bg-card px-5 py-3 font-medium text-brand-600 transition-colors hover:border-brand-600/40 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  {item.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/donate"
                className="flex min-h-13 items-center rounded-card border border-brand-600/30 bg-brand-50 px-5 py-3 font-medium text-brand-600 transition-colors hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                Donate
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-10 flex flex-wrap gap-4">
          <InteractiveHoverButton
            href="/donate"
            className="min-h-13 rounded-full bg-gold px-8 text-base font-semibold text-gold-ink"
          >
            Give now
          </InteractiveHoverButton>
          <Link
            href="/contact"
            className="inline-flex min-h-13 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-semibold text-ink transition-colors hover:bg-surface-lilac focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Contact us
          </Link>
        </div>

        {/* A stale link is usually our fault, so ask them to tell us. */}
        <p className="measure mt-10 text-sm text-ink-muted">
          If you arrived here from a link we published, please{" "}
          <Link
            href="/contact"
            className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
          >
            tell us which one
          </Link>{" "}
          so we can fix it.
        </p>
      </Container>
    </main>
  );
}