/**
 * Programme photography.
 *
 * ## What used to be here
 *
 * A hardcoded `PROGRAMME_IMAGE_FALLBACK` map, keyed by slug, with three
 * photographs and their alt text. It existed because `programmes.image_path`
 * was null on every row while the database was being provisioned, and a card
 * with no photograph renders a brand-tinted field — which reads as "generated,
 * not designed".
 *
 * ## Why it is gone
 *
 * Migration `0016` copied those three values into the rows. Keeping the map
 * afterwards would have turned a stopgap into a hidden override, with a
 * consequence that was actively confusing:
 *
 *   Clearing the image in the admin did not clear the image. It revealed a
 *   different one, from code, that the editor could neither see nor change.
 *
 * So the database is now the only source. An empty `image_path` means the card
 * renders its brand-tinted field, which is the honest result and the one an
 * editor expects.
 *
 * A CHECK constraint (`programmes_alt_required_with_image`) now rejects an
 * image with no alt text, so the pairing cannot drift.
 *
 * @see doc/image-review.md §Programmes
 */

/**
 * Resolve a programme's photograph.
 *
 * Kept as a named function rather than inlined at the two call sites
 * (`lib/data/home.ts` and `lib/data/programmes.ts`) so the pairing of path and
 * alt stays in one place — the two layers previously disagreed, and the index
 * showed a gradient while the detail page showed a photograph.
 */
export function resolveProgrammeImage(
  _slug: string,
  dbPath: string | null | undefined,
  dbAlt: string | null | undefined,
): { imagePath: string | null; imageAlt: string | null } {
  const path = dbPath?.trim() ?? "";
  const alt = dbAlt?.trim() ?? "";
  // An image without alt text is rejected at the database, so this can only be
  // reached by a row written before the constraint existed.
  return { imagePath: path || null, imageAlt: alt || null };
}
