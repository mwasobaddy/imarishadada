import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AnnouncementBar } from "@/components/site/announcement-bar";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SITE_URL, jsonLdScript, organisationJsonLd, webSiteJsonLd } from "@/lib/seo";

import "./globals.css";

// `display: "optional"` rather than the default "swap".
// On throttled mobile a swap reflows every text node, which Lighthouse scored
// as a 0.153 CLS — the single largest layout shift on the page. With
// "optional" the fallback renders on a cold slow connection and Geist is used
// on subsequent navigations once it is cached. Kenyan traffic is mostly cold
// and metered, so zero layout shift beats a first-visit typeface.
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Imarisha Dada — Empowering Girls and Young Women in Kibera, Nairobi",
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
    url: "/",
    title: "Imarisha Dada — Empowering Girls and Young Women in Kibera, Nairobi",
    description:
      "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imarisha Dada — Empowering Girls and Young Women in Kibera, Nairobi",
    description:
      "Girl-led organisation in Kibera, Nairobi supporting school re-entry, safe spaces and economic empowerment for girls and young mothers.",
  },
  formatDetection: { telephone: false },
};

// themeColor and colorScheme are deprecated inside `metadata` in Next 16.
export const viewport: Viewport = {
  themeColor: "#5B2A86",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-KE"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Site-wide structured data. Fields we do not yet have (registration
            number, postal address, social profiles) are deliberately omitted
            rather than filled with placeholders. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([organisationJsonLd(), webSiteJsonLd()]),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <AnnouncementBar />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}