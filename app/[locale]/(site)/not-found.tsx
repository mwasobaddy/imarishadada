import type { Metadata } from "next";

import { NotFoundBody } from "@/components/site/not-found-body";

/**
 * In-group 404 — `notFound()` called from a page inside `(site)`.
 *
 * This one *does* inherit the site header and footer, so it renders the same
 * body inside the normal chrome. The wordmark `NotFoundBody` carries is then
 * redundant with the header, but duplicating the component to drop one element
 * would mean two 404s to keep in sync.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function SiteNotFound() {
  return <NotFoundBody />;
}
