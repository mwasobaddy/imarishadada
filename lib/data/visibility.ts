import type { SiteSection } from "@/lib/data/types";

/**
 * Whether a section should render.
 *
 * Every page that composes editor-managed sections guards with this. A hidden
 * section arrives as `hidden(key)` — an empty heading with `active: false` —
 * rather than being filtered out, so the caller decides what to omit and the
 * page's structure stays readable.
 *
 * ## Why it lives on its own
 *
 * The admin's live preview renders the *real* public components, and some of
 * those components are shared with the pages. If they had to reach this
 * function through `lib/data/sections.ts` they would pull `next/cache` into
 * the client bundle, which the browser cannot resolve. A two-line module that
 * depends on nothing is the whole fix.
 */
export function isVisible(section: SiteSection | undefined | null): boolean {
  return section?.active === true;
}
