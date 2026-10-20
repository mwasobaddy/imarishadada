import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Container } from "@/components/site/container";
import { WHATSAPP_LINK } from "@/lib/contact/channels";

export const metadata: Metadata = {
  title: "Payment not completed",
  description: "Your donation was not completed. Nothing has been charged.",
  robots: { index: false, follow: false },
};

/**
 * The reason a payment failed arrives in `searchParams`, which under
 * `cacheComponents` cannot be read during prerender. Only this small fragment
 * needs it, so it sits behind its own `<Suspense>` and the rest of the page —
 * the part a worried donor actually needs to see — streams immediately.
 */
async function FailureReason({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reason =
    typeof params.reason === "string" && params.reason.length <= 200
      ? params.reason
      : null;

  if (!reason) return null;

  return (
    <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-ink">{reason}</p>
  );
}

/**
 * Failure page.
 *
 * No blame, and never an apology that suggests the donor did something wrong.
 * The spec's own words: M-Pesa-specific hints, clear retry.
 *
 * This page states plainly that nothing was charged. A donor who abandons
 * because they think they were billed twice does not come back.
 */
export default async function DonateFailurePage({
  params,
  searchParams,
}: PageProps<"/[locale]/donate/failure">) {
  const { locale } = await params;

  // Pins the locale for static rendering. `next-intl` otherwise reads it from
  // the request, which is uncached data and fails the `cacheComponents` build.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "donate" });

  return (
    <>
      <main id="main" className="flex min-h-[70vh] items-center bg-surface">
        <Container>
          <div className="measure mx-auto max-w-xl">
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              Not completed
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl">
              {t("failure.title")}
            </h1>

            <p className="mt-4 text-lg text-ink-muted">{t("failure.body")}</p>

            <Suspense fallback={null}>
              <FailureReason searchParams={searchParams} />
            </Suspense>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/donate"
                className="inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-inverse"
              >
                {t("failure.tryAgain")}
              </Link>
              {/* External `wa.me` link: an <a>, not <Link>. Client-side routing
                  has no meaning for a URL on another origin. */}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex min-h-13 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-medium text-brand-600 transition-colors hover:border-brand-600/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
              >
                WhatsApp us
              </a>
            </div>

            <p className="mt-8 text-sm text-ink-muted">
              If M-Pesa sent you a prompt, you can safely ignore it, as we never ask you to
              approve a prompt we did not send. This will never charges you, and we never ask you to
              type a paybill number.
            </p>
          </div>
        </Container>
      </main>
    </>
  );
}
