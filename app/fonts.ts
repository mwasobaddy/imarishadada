import { Geist, Geist_Mono } from "next/font/google";

/**
 * Font loading, shared by the locale layout.
 *
 * Lives in its own module because `next/font` must be called in a module that
 * both the root and locale layouts can import. While the `<html>` element was
 * in the root layout this was inline; moving the document shell under
 * `[locale]` meant the fonts had to move with it, and duplicating the loader
 * would have downloaded the same two families twice.
 *
 * `display: "optional"` rather than the default "swap".
 *
 * On throttled mobile a swap reflows every text node, which Lighthouse scored as
 * a 0.153 CLS — the single largest layout shift on the page. With "optional"
 * the fallback renders on a cold slow connection and Geist is used on
 * subsequent navigations once it is cached. Kenyan traffic is mostly cold and
 * metered, so zero layout shift beats a first-visit typeface.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
});

/** Classes to apply to `<html>` so both families resolve. */
export const geistClassName = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;
