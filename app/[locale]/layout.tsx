import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale, routing } from "@/i18n/routing";
import { geistClassName } from "@/app/fonts";
import { jsonLdScript, organisationJsonLd, webSiteJsonLd } from "@/lib/seo";

/**
 * Per-locale document shell.
 *
 * This is where `<html lang>` is set. It has to be here rather than in the root
 * layout, because the root layout sits above the `[locale]` segment and cannot
 * know which language it is wrapping.
 *
 * ## `lang` is exact, and it is not the same string as the catalogue key
 *
 * The message catalogue is keyed `en`, but `<html lang>` and `hreflang` both
 * use the region form `en-KE`. Those are deliberately different things: the
 * catalogue key is a filename, while `lang` is what a screen reader, a browser
 * translation prompt and a search engine actually match on. Emitting
 * `lang="en"` on a Kenyan English page tells the browser the page is not
 * region-specific and weakens the Kenya targeting the whole SEO strategy rests
 * on.
 *
 * @see doc/roadmap/localisation.md §3
 */

const LOCALE_HTML_LANG: Record<string, string> = {
  en: "en-KE",
  sw: "sw-KE",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
};

/**
 * `openGraph.locale` uses underscores (`en_KE`), while `lang` uses hyphens
 * (`en-KE`). This is not a typo in either — they are two different specs.
 */
const LOCALE_OG: Record<string, string> = {
  en: "en_KE",
  sw: "sw_KE",
  fr: "fr_FR",
  de: "de_DE",
  pt: "pt_BR",
};

export function ogLocale(locale: string): string {
  return LOCALE_OG[locale] ?? LOCALE_OG.en;
}

export function htmlLang(locale: string): string {
  return LOCALE_HTML_LANG[locale] ?? LOCALE_HTML_LANG.en;
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // A request for `/xx/donate` reaches this layout with `xx` as the segment. The
  // proxy should have redirected it already, but this guard means an
  // unrecognised locale produces a clean 404 rather than an attempt to load a
  // message catalogue that does not exist.
  if (!isLocale(locale)) notFound();

  // `setRequestLocale` opts this route into static rendering under
  // `cacheComponents`. Without it every page becomes dynamic and the build
  // fails. It must be called before any `next-intl` server function.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={htmlLang(locale)}
      className={geistClassName}
      suppressHydrationWarning
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
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

/**
 * Locale-aware metadata defaults.
 *
 * Title and description come from the catalogue so a translated page does not
 * ship an English `<title>` — which is a ranking penalty, not a localisation.
 */
export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    openGraph: { locale: ogLocale(locale) },
  };
}