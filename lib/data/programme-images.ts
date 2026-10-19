/**
 * Consented photography per programme.
 *
 * The `programmes.image_path` column is the source of truth, but the database
 * is not provisioned yet, so the cards would render a brand-tinted field with
 * no photograph — which is exactly the "generated, not designed" signal the
 * project rules call out.
 *
 * This map is the fallback, keyed by programme slug. An editor overwrites it
 * with a real `image_path` later; the two agree.
 *
 * It lives in its own module because **two** data layers resolve programmes —
 * `lib/data/home.ts` (the index page) and `lib/data/programmes.ts` (the detail
 * page) — and a fallback defined in only one of them means the index shows a
 * gradient while the detail page shows a photograph. That inconsistency was
 * visible on screen before this was extracted.
 *
 * @see doc/image-review.md §Programmes
 */
export const PROGRAMME_IMAGE_FALLBACK: Record<
  string,
  { path: string; alt: string }
> = {
  "school-reentry": {
    path: "/images/programmes/re-entry/re-entry-mother-writing.avif",
    alt: "A young mother holding her baby writes with a pen during a school re-entry session",
  },
  "economic-empowerment": {
    // Deliberately empty. The gallery contains no photograph of a business, a
    // market stall or start-up capital being put to work, and using a
    // classroom photograph to illustrate money would misrepresent the
    // programme. This programme needs its own shoot.
    path: "",
    alt: "",
  },
  "dada-space": {
    path: "/images/programmes/dada-space/dada-space-hand-raised.avif",
    alt: "A girl raises her hand during a Dada Space session",
  },
};

/**
 * Resolve a programme's photograph.
 *
 * The database column wins; the fallback covers rows created before the
 * photography was selected. An empty path means "no consented photograph
 * exists" and the card renders its brand-tinted field rather than a stock
 * image of unrelated children.
 */
export function resolveProgrammeImage(
  slug: string,
  dbPath: string | null | undefined,
  dbAlt: string | null | undefined,
): { imagePath: string | null; imageAlt: string | null } {
  const fallback = PROGRAMME_IMAGE_FALLBACK[slug];
  const path = dbPath || fallback?.path || "";
  const alt = dbAlt || fallback?.alt || "";
  return { imagePath: path || null, imageAlt: alt || null };
}
