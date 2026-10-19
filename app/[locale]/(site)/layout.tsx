import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { AnnouncementBar } from "@/components/site/announcement-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/**
 * Chrome for the public marketing site.
 *
 * Split out of the root layout so flows that must not carry a navbar can opt
 * out. `/donate` in particular renders its own `MiniHeader`: a donor mid-gift
 * must not be able to wander off, and every nav link competes with the Pay
 * button. With the header in the root layout that was impossible — the donate
 * page inherited the full site nav no matter what it rendered.
 *
 * Route groups do not add a URL segment, so `/` and `/about` are unchanged.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Pins the locale for the whole subtree. `next-intl` otherwise resolves the
  // locale from the request on every call, which is uncached data and fails the
  // `cacheComponents` build. Setting it once at the layout covers every page
  // beneath, including the legal pages that use the locale-aware `Link`.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
