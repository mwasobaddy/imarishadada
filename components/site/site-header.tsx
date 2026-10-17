"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DONATE_LINK, LOCALES, NAV_ITEMS, ROLLOUT_LOCALE_CODES } from "@/lib/nav";

/**
 * Custom rather than @aceternity/floating-navbar.
 *
 * The registry pill has no `aria-label`, no skip link, and no mobile sheet —
 * all three are required by .opencode/rules/frontend-design.md. Rebuilding
 * 40 lines was cheaper than shipping a nav that fails the accessibility gate.
 *
 * Hide-on-scroll is Motion, not GSAP: it is driven by scroll *state*, and
 * scroll-linked motion belongs to GSAP (frontend-design.md, hybrid policy).
 */
export function SiteHeader() {
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < last || y < 96);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the sheet when the route changes. Adjusting state during render is
  // React's recommended pattern here; a useEffect would cascade renders.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  // Focus trap + Escape for the mobile sheet.
  useEffect(() => {
    if (!open) return;
    const node = sheetRef.current;
    if (!node) return;
    const selector =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(selector));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.querySelector<HTMLElement>(selector)?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    // `sticky`, not `fixed`: a fixed header sits at viewport top and covers the
    // announcement bar above it in the flow. Sticky keeps that bar visible at
    // rest, then pins the header once it scrolls away.
    <header
      className={`sticky top-0 z-50 transition-transform duration-300 motion-reduce:transition-none ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-inverse"
      >
        Skip to content
      </a>

      <div className="border-b border-brand/20 bg-surface/90 backdrop-blur-md">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
          >
            {/* The logo already carries the wordmark, so the accessible name
                comes from alt and no adjacent text duplicates it. */}
            <Image
              src="/brand/logo.webp"
              alt="Imarisha Dada"
              width={1040}
              height={950}
              priority
              sizes="(max-width: 640px) 44px, (max-width: 1024px) 48px, 52px"
              className="h-10 w-auto sm:h-11 lg:h-12"
            />
            <span className="hidden text-xs text-ink-muted xl:inline">
              Empower a Sister
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.link}>
                <Link
                  href={item.link}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-ink transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <LocaleSwitcher
              open={localeOpen}
              setOpen={setLocaleOpen}
              className="hidden sm:block"
            />

            <Link
              href={DONATE_LINK}
              className="inline-flex min-h-11 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              Donate
            </Link>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="inline-flex size-11 items-center justify-center rounded-lg text-ink hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 lg:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Dismiss menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-brand/20 lg:hidden"
          />
          <div
            ref={sheetRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-x-0 top-[57px] z-50 max-h-[calc(100dvh-57px)] overflow-y-auto border-b border-brand/20 bg-surface px-5 py-6 shadow-lg sm:px-8 lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-base text-ink hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-brand/20 pt-5">
              <LocaleSwitcher open={localeOpen} setOpen={setLocaleOpen} />
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}

function LocaleSwitcher({
  open,
  setOpen,
  className,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  className?: string;
}) {
  const live = LOCALES.filter((l) =>
    (ROLLOUT_LOCALE_CODES as readonly string[]).includes(l.code),
  );

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm text-ink hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
        </svg>
        <span aria-hidden="true">{live[0]?.short}</span>
        <span className="sr-only">Change language</span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-50 mt-1 min-w-40 rounded-lg border border-brand/20 bg-surface py-1 shadow-lg"
        >
          {live.map((locale) => (
            <li key={locale.code} role="option" aria-selected={locale.code === live[0]?.code}>
              <a
                href={locale.code === "en" ? "/" : `/${locale.code}`}
                className="flex min-h-11 items-center px-3 text-sm text-ink hover:bg-brand-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-700"
              >
                {locale.label}
              </a>
            </li>
          ))}
          {live.length === 1 ? (
            <li className="px-3 py-2 text-xs text-ink-muted">
              More languages coming soon
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}