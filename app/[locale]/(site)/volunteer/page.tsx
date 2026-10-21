import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PageHero } from "@/components/site/page-hero";
import {
  VolunteerApply,
  VolunteerProcess,
  VolunteerRemote,
  VolunteerRoles,
  VolunteerSafeguarding,
} from "@/components/volunteer/sections";
import { getVolunteerRoles, getVolunteerSections } from "@/lib/data/volunteer";
import { isVisible } from "@/lib/data/sections";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * Volunteer — `/volunteer`.
 *
 * ## What was wrong
 *
 * A `ProseRoute` page with `draft: true` rendering a static constant, while two
 * tables sat fully wired on the admin side and unreachable from here:
 *
 *   * `volunteer_roles` — read only by `/admin/volunteer-roles`.
 *   * `volunteer_applications` — an inbox, status transitions and a dashboard
 *     count, with **nothing public that ever wrote a row.** The triage surface
 *     could not fill.
 *
 * Both are now reachable. The form posts to a Server Action which writes with
 * the service role, because the table holds applicant PII and RLS gives `anon`
 * no insert — correct, and the reason the write does not happen from the browser.
 *
 * ## Screening is stated before the form, not after it
 *
 * The roadmap: *"Leading with the screening requirement is unusual and correct.
 * It filters out casual applicants and reassures parents and funders."* It is in
 * the hero, in the process steps, and again as a gate above the form.
 *
 * ## The "no exceptions" line is code, not copy
 *
 * The list of screening requirements is editable. The sentence that says nobody
 * is placed with a child-facing role before all of them are complete is not —
 * same reasoning as `PATHWAY_UNVERIFIED` on `/programmes` and the consent tiers.
 * The roadmap is blunt: *"Never soften the screening step. Removing it to
 * increase application volume is how safeguarding incidents happen."*
 */

const TITLE = "Volunteer with us";
const DESCRIPTION =
  "Volunteer with Imarisha Dada in Kibera, Nairobi: mentors, session facilitators, professional advisors and administrative support. Every volunteer is screened and trained before working with a girl.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/volunteer",
    languages: { "en-KE": "/volunteer", "x-default": "/volunteer" },
  },
  openGraph: {
    type: "website",
    url: "/volunteer",
    locale: "en_KE",
    images: ["/opengraph-image"],
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
};

export default async function VolunteerPage({
  params,
}: PageProps<"/[locale]/volunteer">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [sections, roles] = await Promise.all([
    getVolunteerSections(),
    getVolunteerRoles(),
  ]);

  const hero = sections["volunteer-hero"];
  const rolesSection = sections["volunteer-roles"];
  const rolesEmpty = sections["volunteer-roles-empty"];
  const process = sections["volunteer-process"];
  const safeguarding = sections["volunteer-safeguarding"];
  const form = sections["volunteer-form"];
  const remote = sections["volunteer-remote"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: absoluteUrl("/volunteer"),
    inLanguage: "en-KE",
    description: DESCRIPTION,
    isPartOf: { "@type": "WebSite", name: "Imarisha Dada", url: absoluteUrl("/") },
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body} />
        ) : null}

        {/* ---- Roles --------------------------------------------------- */}
        {isVisible(rolesSection) ? (
          <VolunteerRoles
            section={rolesSection}
            emptySection={rolesEmpty}
            roles={roles}
          />
        ) : null}

        {/* ---- Process ------------------------------------------------- */}
        {isVisible(process) ? (
          <VolunteerProcess section={process} />
        ) : null}

        {/* ---- Safeguarding -------------------------------------------- */}
        {isVisible(safeguarding) ? (
          <VolunteerSafeguarding section={safeguarding} />
        ) : null}

        {/* ---- Application form ---------------------------------------- */}
        {isVisible(form) ? (
          <VolunteerApply section={form} roles={roles} />
        ) : null}

        {/* ---- Remote -------------------------------------------------- */}
        {isVisible(remote) ? (
          <VolunteerRemote section={remote} />
        ) : null}
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Volunteer", path: "/volunteer" },
            ]),
          ]),
        }}
      />
    </>
  );
}
