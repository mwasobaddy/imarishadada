export const NAV_ITEMS = [
  { name: "Our work", link: "/programmes" },
  { name: "Impact", link: "/impact" },
  { name: "Stories", link: "/stories" },
  { name: "About", link: "/about" },
  { name: "Contact", link: "/contact" },
] as const;

export const DONATE_LINK = "/donate";

export const LOCALES = [
  { code: "en", label: "English", short: "EN" },
  { code: "sw", label: "Kiswahili", short: "SW" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "pt", label: "Português", short: "PT" },
] as const;

/**
 * `sw`, `fr`, `de` and `pt` are Phase 2–3 (doc/roadmap/localisation.md §5).
 * Until those message files exist we must not advertise a locale that 404s.
 */
export const ROLLOUT_LOCALE_CODES = ["en"] as const;