import Image from "next/image";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { WHATSAPP_LINK, PHONE_DISPLAY } from "@/lib/contact/channels";
// Evaluated once at module load, not per render. Calling `new Date()` inside
// the component body is an unstable value under `cacheComponents` and fails
// prerendering. Update the start year when the org is founded/renamed.
const COPYRIGHT_YEAR = new Date().getFullYear();

/**
 * Site footer.
 *
 * Every visible string comes from the message catalogue rather than being
 * written inline. That is what makes the footer translatable at all: a footer
 * hardcoded in English would have to be rewritten in code to be localised, and
 * would silently stay English on a Swahili page.
 *
 * Programme *names* are brands or database content, not copy — "Dada Space"
 * stays "Dada Space" in every locale (doc/roadmap/localisation.md §4.2). They
 * are still routed through the catalogue so a locale can record the
 * transliterated form if the team ever decides on one, but the English
 * catalogue carries the same string as the programme title.
 */
export async function SiteFooter() {
  // The locale comes from the request, which the `(site)` layout has already
  // pinned via `setRequestLocale`. `getLocale()` therefore reads the pinned
  // value rather than making a fresh request read — which is what keeps this
  // a static render rather than a dynamic one.
  //
  // It is NOT hardcoded to "en": that would pin English and defeat the point
  // of the catalogue.
  const locale = await getLocale();
  setRequestLocale(locale);

  const t = await getTranslations("footer");

  const programmes = [
    { label: t("programmes.schoolReentry"), href: "/programmes/school-reentry" },
    { label: t("programmes.economicEmpowerment"), href: "/programmes/economic-empowerment" },
    { label: t("programmes.dadaSpace"), href: "/programmes/dada-space" },
  ];

  const organisation = [
    { label: t("organisation.aboutUs"), href: "/about" },
    { label: t("organisation.ourImpact"), href: "/impact" },
    { label: t("organisation.transparency"), href: "/transparency" },
    { label: t("organisation.annualReport"), href: "/annual-report" },
    { label: t("organisation.news"), href: "/news" },
  ];

  const support = [
    { label: t("support.waysToGive"), href: "/ways-to-give" },
    { label: t("support.partnerWithUs"), href: "/partner" },
    { label: t("support.volunteer"), href: "/volunteer" },
    { label: t("support.contact"), href: "/contact" },
    { label: t("support.faq"), href: "/faq" },
  ];

  const legal = [
    { label: t("legal.safeguarding"), href: "/legal/safeguarding" },
    { label: t("legal.privacy"), href: "/legal/privacy" },
    { label: t("legal.terms"), href: "/legal/terms" },
    { label: t("legal.raiseConcern"), href: "/transparency#complaints" },
  ];

  return (
    <footer className="border-t border-brand/20 bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Image
              src="/brand/logo.webp"
              alt="Imarisha Dada"
              width={1040}
              height={950}
              sizes="80px"
              className="h-20 w-auto"
            />
            <p className="mt-3 text-sm text-ink-muted">{t("tagline")}</p>
            <p className="measure mt-4 text-sm leading-relaxed text-ink-muted">
              {t("description")}
            </p>
          </div>

          <nav aria-labelledby="footer-programmes">
            <h2
              id="footer-programmes"
              className="text-sm font-semibold tracking-wide text-brand-600 uppercase"
            >
              {t("programmes.heading")}
            </h2>
            <ul className="mt-4 space-y-1">
              {programmes.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-organisation">
            <h2
              id="footer-organisation"
              className="text-sm font-semibold tracking-wide text-brand-600 uppercase"
            >
              {t("organisation.heading")}
            </h2>
            <ul className="mt-4 space-y-1">
              {organisation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-support">
            <h2
              id="footer-support"
              className="text-sm font-semibold tracking-wide text-brand-600 uppercase"
            >
              {t("support.heading")}
            </h2>
            <ul className="mt-4 space-y-1">
              {support.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-brand/20 pt-8">
          {/* Safeguarding is a first-class footer link for an organisation
              working with girls aged 9–16, not a legal footnote. */}
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {legal.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-ink-muted">
            {t("location")} ·{" "}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              WhatsApp {PHONE_DISPLAY}
            </a>
          </p>

          <p className="mt-2 text-xs text-ink-muted">
            {t("copyright", { year: COPYRIGHT_YEAR })}
          </p>
        </div>
      </div>
    </footer>
  );
}
