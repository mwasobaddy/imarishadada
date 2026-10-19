/**
 * Primary navigation.
 *
 * `labelKey` is the key into the `nav` namespace of the message catalogue.
 * `name` is the English string and is a *fallback*, used only where there is
 * no locale context — specifically the global 404, which Next renders outside
 * the `[locale]` tree and therefore outside any message catalogue.
 *
 * Inside the locale tree the catalogue always wins, so a Swahili visitor
 * never sees an English nav bar.
 */
export const NAV_ITEMS = [
  { name: "Our work", labelKey: "ourWork", link: "/programmes" },
  { name: "Impact", labelKey: "impact", link: "/impact" },
  { name: "Stories", labelKey: "stories", link: "/stories" },
  { name: "About", labelKey: "about", link: "/about" },
  { name: "Contact", labelKey: "contact", link: "/contact" },
] as const;

export const DONATE_LINK = "/donate";

/**
 * Display names for each locale.
 *
 * The list of locales and which ones are live live in `lib/seo.ts`
 * (`LOCALES` / `PUBLISHED_LOCALES`). They are deliberately not duplicated
 * here: two rollout lists drift, and a locale that is live in SEO but not in
 * the switcher — or the reverse — is a 404 either way.
 */
export const LOCALE_LABELS: Record<string, { label: string; short: string }> = {
  en: { label: "English", short: "EN" },
  sw: { label: "Kiswahili", short: "SW" },
  fr: { label: "Français", short: "FR" },
  de: { label: "Deutsch", short: "DE" },
  pt: { label: "Português", short: "PT" },
};