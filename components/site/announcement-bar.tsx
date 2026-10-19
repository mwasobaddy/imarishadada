import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Announcement bar.
 *
 * Renders a server-side fallback. Swapping this for a CMS value must not
 * shift layout or flash.
 *
 * Two strings, not one: the desktop version is longer, and a single string
 * either truncates on mobile or leaves an awkward gap on desktop. The split is
 * done with responsive visibility so the bar keeps its height at 320px.
 */
export async function AnnouncementBar() {
  // The locale is already pinned by the `(site)` layout, so this reads the
  // pinned value rather than making a fresh request read.
  const locale = await getLocale();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "announcement" });

  return (
    <div className="bg-brand px-5 py-2.5 text-center text-xs font-medium tracking-wide text-ink-inverse sm:px-8">
      <p className="mx-auto max-w-6xl">
        {/* Split so the bar stays on one line at 320px. */}
        <span className="sm:hidden">{t("short")}</span>
        <span className="hidden sm:inline">{t("long")}</span>
      </p>
    </div>
  );
}
