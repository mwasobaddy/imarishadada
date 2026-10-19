"use client";

import Image from "next/image";
import Link from "next/link";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { DONATE_LINK, LOCALE_LABELS, NAV_ITEMS } from "@/lib/nav";
import { PUBLISHED_LOCALES } from "@/lib/seo";

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

/**
 * Is this nav item the page the visitor is on?
 *
 * `href` matches the path exactly, and also matches its descendants — so
 * "Our work" stays active on `/programmes/school-reentry`, which is what a
 * visitor expects from a section link. The home link only matches the root,
 * or every page would highlight it.
 *
 * The pathname comes from `@/i18n/navigation`, which strips the locale
 * prefix. Using `next/navigation` instead would leave `/sw/donate` in the
 * string and every active state would silently break the day a second locale
 * ships.
 */
function isCurrentPath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
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
        {tc("skipToContent")}
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
            {/* The new logo is a mark only — no wordmark — so the name
                sits beside it as text. Text scales, translates and re-themes
                better than a raster wordmark, and keeps the header readable
                even if the mark fails to load. */}
            <Image
              src="/brand/logo.svg"
              alt=""
              width={1200}
              height={1200}
              priority
              sizes="(max-width: 640px) 44px, (max-width: 1024px) 48px, 52px"
              className="h-10 w-auto sm:h-11 lg:h-12"
            />
            <span className="text-base font-semibold tracking-tight text-brand-600 sm:text-lg">
              Imarisha Dada
            </span>
            <span className="hidden text-xs text-ink-muted xl:inline">
              Empower a Sister
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isCurrentPath(pathname, item.link);
              return (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                      // No background on the active item — the weight, the
                      // colour and the underline marker carry it. A filled pill
                      // behind one word in a row of five reads as a button
                      // rather than as "you are here".
                      active
                        ? "font-semibold text-brand-600"
                        : "text-ink hover:text-brand-600"
                    }`}
                  >
                    {t(item.labelKey)}
                    {/* The active marker is a shape as well as a colour, so
                        the current page is still obvious to a visitor who
                        cannot distinguish the brand tint from the body text.
                        The rules are explicit: never use colour alone. */}
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <LocaleSwitcher
              open={localeOpen}
              setOpen={setLocaleOpen}
              className="hidden sm:block"
            />

            <InteractiveHoverButton
              href={DONATE_LINK}
              className="min-h-11 rounded-full bg-gold px-5 text-sm font-semibold text-gold-ink"
            >
              {tc("donate")}
            </InteractiveHoverButton>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="inline-flex size-11 items-center justify-center rounded-lg text-ink hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 lg:hidden"
            >
              <span className="sr-only">{open ? tc("closeMenu") : tc("openMenu")}</span>
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

      {open
        ? createPortal(
            <>
          {/* Scrim. Tapping it dismisses, and the blur keeps the page behind
              legible enough to show where you will land. */}
          <button
            type="button"
            aria-label={tc("dismissMenu")}
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="scrim-in fixed inset-0 z-[55] cursor-default bg-brand/30 backdrop-blur-sm lg:hidden"
          />

          <div
            ref={sheetRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={tc("menu")}
            className="sheet-up fixed inset-x-0 bottom-0 z-[60] max-h-[88dvh] overflow-y-auto rounded-t-3xl border-t border-brand/20 bg-surface shadow-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            {/* Grab handle. Swipe-to-dismiss is not discoverable and cannot be
                performed precisely, so it is decoration — the close button
                below is the real affordance. */}
            <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-brand/20" />

            {/* Title row. A visible close button, not just a swipe target —
                NN/g is explicit that the grab handle is easy to ignore and
                that relying on it excludes people who cannot swipe precisely. */}
            <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-2 sm:px-8">
              <h2 className="text-lg font-semibold tracking-tight text-brand-600">
                {tc("menu")}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                className="inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-brand-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <span className="sr-only">{tc("close")}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <ul className="flex flex-col gap-1 px-3 pt-1 sm:px-6">
              {NAV_ITEMS.map((item) => {
                const active = isCurrentPath(pathname, item.link);
                return (
                  <li key={item.link}>
                    <Link
                      href={item.link}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center justify-between gap-3 px-5 text-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                        // Here the background is kept — a full-width row needs
                        // a filled state to read as selected — but it is fully
                        // rounded, so the row reads as a pill rather than a
                        // rectangle inside a rounded sheet.
                        active
                          ? "rounded-full bg-brand-50 font-semibold text-brand-600"
                          : "rounded-full text-ink hover:bg-surface-lilac"
                      }`}
                    >
                      <span>{t(item.labelKey)}</span>
                      {/* Active marker: a shape, not just a colour. */}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="size-2 shrink-0 rounded-full bg-brand-600"
                        />
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="size-4 shrink-0 text-ink-muted/40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* The primary action belongs in the sheet, not only in the header
                bar. On a phone the header's donate button is the easiest thing
                to miss, and this is the single most important control on the
                site. */}
            <div className="px-5 pt-5 sm:px-8">
              <InteractiveHoverButton
                href={DONATE_LINK}
                className="min-h-14 w-full justify-center rounded-full bg-gold px-8 text-base font-semibold text-gold-ink"
              >
                {tc("donate")}
              </InteractiveHoverButton>
            </div>

            {/* The switcher renders nothing while only one locale is
                published, so the divider is hidden with it — otherwise the
                sheet ends in an empty ruled strip. */}
            {PUBLISHED_LOCALES.length > 1 ? (
              <div className="mt-5 border-t border-brand/20 px-5 pt-5 sm:px-8">
                <LocaleSwitcher open={localeOpen} setOpen={setLocaleOpen} />
              </div>
            ) : null}
          </div>
            </>,
            document.body,
          )
        : null}
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
  const tc = useTranslations("common");
  // Display metadata for locales that actually resolve. `PUBLISHED_LOCALES` is
  // the same flag the sitemap uses for hreflang, so the switcher can never offer
  // a language that 404s.
  const live = PUBLISHED_LOCALES.map((code) => ({
    code,
    ...LOCALE_LABELS[code],
  }));

  // With one locale there is nothing to switch to, so render nothing rather than
  // a globe button that opens a single-item menu. Once `sw` ships this becomes
  // interactive again with no change here.
  if (live.length < 2) return null;

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
        <span className="sr-only">{tc("changeLanguage")}</span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={tc("language")}
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
        </ul>
      ) : null}
    </div>
    );
}