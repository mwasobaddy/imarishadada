import type { Metadata, Viewport } from "next";

import { SITE_URL } from "@/lib/seo";

import "./globals.css";

// `display: "optional"` rather than the default "swap".
// On throttled mobile a swap reflows every text node, which Lighthouse scored
// as a 0.153 CLS — the single largest layout shift on the page. With
// "optional" the fallback renders on a cold slow connection and Geist is used
// on subsequent navigations once it is cached. Kenyan traffic is mostly cold
// and metered, so zero layout shift beats a first-visit typeface.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Empowering Girls in Kibera, Nairobi",
    template: "%s | Imarisha Dada",
  },
  description:
    "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  applicationName: "Imarisha Dada",
  authors: [{ name: "Imarisha Dada" }],
  alternates: {
    canonical: "/",
    languages: {
      "en-KE": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Imarisha Dada",
    locale: "en_KE",
      images: ["/opengraph-image"],
    url: "/",
    title: "Empowering Girls in Kibera, Nairobi | Imarisha Dada",
    description:
      "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Empowering Girls in Kibera, Nairobi | Imarisha Dada",
    description:
      "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

// themeColor and colorScheme are deprecated inside `metadata` in Next 16.
export const viewport: Viewport = {
  themeColor: "#5B2A86",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout — deliberately renders no `<html>`.
 *
 * `<html lang>` has to be set per locale, and a root layout sits above
 * `[locale]`, so it cannot know which language it is wrapping. The document
 * shell therefore lives in `app/[locale]/layout.tsx`, which can read the
 * segment. This layout keeps only what must apply to everything: the fonts, the
 * stylesheet, and the site-wide metadata defaults.
 *
 * @see i18n/routing.ts
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return children;
}