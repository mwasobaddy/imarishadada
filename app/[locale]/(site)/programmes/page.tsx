import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { ProgrammeCard } from "@/components/sections/programme-card";
import { getProgrammes } from "@/lib/data/home";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Programmes index — `/programmes`.
 *
 * This is the hub the header nav and the footer both link to, and the
 * breadcrumb parent for every programme detail page. It existed as a link long
 * before it existed as a route, which meant the primary navigation sent visitors
 * to a 404.
 *
 * Prerendered: the programme list is content, not a per-request read.
 */

export const metadata: Metadata = {
  title: "Our programmes",
  description:
    "Three programmes in Kibera, Nairobi: school re-entry for young mothers, economic empowerment, and safe spaces for girls aged 9–16.",
  alternates: {
    canonical: "/programmes",
    languages: { "en-KE": "/programmes", "x-default": "/programmes" },
  },
  openGraph: {
    type: "website",
    url: "/programmes",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Our programmes | Imarisha Dada",
    description:
      "Three programmes in Kibera, Nairobi: school re-entry for young mothers, economic empowerment, and safe spaces for girls aged 9–16.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our programmes | Imarisha Dada",
    description:
      "Three programmes in Kibera, Nairobi: school re-entry for young mothers, economic empowerment, and safe spaces for girls aged 9–16.",
  },
};

/**
 * How the three programmes connect, presented as an intended pathway.
 *
 * ⚠️ UNVERIFIED — needs programme staff sign-off before this is published.
 *
 * The roadmap is explicit that this sequence is a claim, not a description: "If
 * Dada Space participants do not in practice feed into re-entry and economic
 * programmes, do not imply a pipeline. Donors will ask."
 *
 * It is rendered because the section carries real weight on the page, but it is
 * marked with a visible caveat rather than asserted as fact. Confirm how the
 * programmes actually connect, then delete `unverified` and the note below.
 */
const PATHWAY = [
  {
    title: "A girl arrives",
    body: "She joins Dada Space at nine. She learns she is allowed to want things.",
  },
  {
    title: "She leaves school",
    body: "Something happens — pregnancy, cost, or stigma. Without support she stays out.",
  },
  {
    title: "She returns",
    body: "School Re-entry brings her back, and stays with her through the year.",
  },
  {
    title: "She stabilises",
    body: "Savings, psychosocial support, and a mentor who has been through it.",
  },
  {
    title: "She starts earning",
    body: "Economic Empowerment funds her first business.",
  },
  {
    title: "She leads",
    body: "She comes back as a mentor. The cycle restarts, one level up.",
  },
];

const PATHWAY_UNVERIFIED = true;

export default async function ProgrammesPage({
  params,
}: PageProps<"/[locale]/programmes">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const programmes = await getProgrammes();

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Imarisha Dada programmes",
    url: absoluteUrl("/programmes"),
    numberOfItems: programmes.length,
    itemListElement: programmes.map((programme, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/programmes/${programme.slug}`),
      name: programme.title,
    })),
  };

  return (
    <>
      <main id="main">
        <PageHero
          eyebrow="Our work"
          heading="Three programmes, one aim."
          body="A girl in Kibera decides her own future. These are the three programmes that get her there, and the evidence we hold for each."
        />

        <section aria-labelledby="programmes-list-heading" className="py-section bg-surface">
          <Container>
            <h2
              id="programmes-list-heading"
              className="sr-only"
            >
              All programmes
            </h2>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programmes.map((programme) => (
                <li key={programme.slug} className="flex">
                  <ProgrammeCard programme={programme} />
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* ---- How they fit together ------------------------------------ */}
        <section aria-labelledby="pathway-heading" className="bg-surface-lilac py-section">
          <Container>
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
                How they fit together
              </p>
              <h2
                id="pathway-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
              >
                One girl, over years — not three programmes
              </h2>
            </div>

            {PATHWAY_UNVERIFIED ? (
              <p
                role="note"
                className="mt-8 max-w-2xl rounded-xl border-2 border-dashed border-brand-600/40 bg-surface p-5 text-sm leading-relaxed text-ink-muted"
              >
                <span className="font-semibold text-brand-600">
                  Draft — not yet verified.
                </span>{" "}
                This pathway describes how we intend the programmes to connect. It
                has not yet been confirmed against how they operate in practice, so
                please treat it as provisional.
              </p>
            ) : null}

            <ol className="mt-10 space-y-4">
              {PATHWAY.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-5 rounded-card border border-border bg-card p-5 sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-brand-50 tabular"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                    <p className="measure mt-1 text-ink-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* ---- How we measure ------------------------------------------- */}
        <section aria-labelledby="measure-heading" className="bg-brand py-section">
          <Container>
            <div className="max-w-2xl">
              <h2
                id="measure-heading"
                className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl"
              >
                How we measure
              </h2>
              <p className="measure mt-4 text-lg text-brand-100">
                Every figure we publish is dated, and we say how it was counted.
              </p>
              <Link
                href="/impact"
                className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-100 underline decoration-brand-100/40 underline-offset-4 hover:decoration-brand-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-50"
              >
                Our impact and methodology
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </Container>
        </section>

        {/* ---- Support all three ---------------------------------------- */}
        <section aria-labelledby="unrestricted-heading" className="py-section bg-surface">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2
                  id="unrestricted-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  A gift that moves with a girl
                </h2>
                <p className="measure mt-4 text-lg text-ink-muted">
                  Unrestricted giving lets a participant move between programmes as
                  her needs change — which is how the pathway above actually works.
                </p>
              </div>

              <div className="flex flex-col justify-center rounded-2xl border border-brand-600/30 bg-brand-50 p-8">
                <p className="measure text-ink-muted">
                  Restricted funds are easier to raise. Unrestricted funds change more
                  lives, because nobody has to guess the right programme in advance.
                </p>
                <InteractiveHoverButton
                  href="/donate"
                  className="mt-6 min-h-13 rounded-full bg-gold px-8 text-base font-semibold text-gold-ink"
                >
                  Give where it&rsquo;s needed
                </InteractiveHoverButton>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            listJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Programmes", path: "/programmes" },
            ]),
          ]),
        }}
      />
    </>
  );
}
