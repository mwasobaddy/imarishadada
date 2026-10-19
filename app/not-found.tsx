import type { Metadata } from "next";

import { NotFoundBody } from "@/components/site/not-found-body";

/**
 * Global 404 — any URL that matches no route.
 *
 * Renders inside the root layout, which has no header or footer: the site
 * chrome lives in `app/(site)/layout.tsx`. `NotFoundBody` therefore carries its
 * own wordmark and page map so this is a usable dead end rather than a bare
 * error.
 *
 * A not-found page must not be indexed. `robots: { index: false }` plus the
 * lack of a canonical keeps a soft-404 out of the index.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundBody />;
}
