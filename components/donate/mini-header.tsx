import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";

/**
 * Minimal donation header.
 *
 * **No navbar.** A donor mid-flow must not be able to navigate away from an
 * incomplete gift, and every nav link competes with the Pay button for
 * attention. The only escape is an explicit, labelled back link.
 *
 * A "Secure donation" lock is shown because donors are about to hand over
 * money and a phone number; a plain page with no chrome reads as less careful
 * than it is.
 */
export function MiniHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="flex min-h-16 items-center justify-between gap-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
        >
          <Image
            src="/brand/mark.svg"
            alt=""
            width={32}
            height={32}
            className="size-8"
            priority
          />
          <span className="text-sm font-semibold text-brand-600">Imarisha Dada</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 text-sm text-ink-muted sm:inline-flex">
            {/* Inline SVG, not an emoji — the project's design rules forbid
                emoji as UI icons, and a lock emoji renders differently on
                every platform. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure donation
          </span>

          {/* The only way off the page, and it says where it goes. */}
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-ink-muted underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Leave and come back
          </Link>
        </div>
      </Container>
    </header>
  );
}
