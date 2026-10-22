/**
 * Hero portrait configuration.
 *
 * **This is now our own photography.** The previous image was a GlobalGiving
 * profile picture belonging to a different organisation, used as a disclosed
 * placeholder until real consented photography arrived. It has been replaced.
 *
 * ## Consent
 *
 * `consentTier: 'named_full'` — the participant (and her guardian, where
 * applicable) gave written consent for publication, on file with the
 * organisation. The gallery this came from is `images/` in the repo, and the
 * selection and placement decisions are recorded in `doc/image-review.md`.
 *
 * ## Serving
 *
 * The blob mask is applied via an SVG `<mask>`, so the photo is served by an
 * SVG `<image>` element — NOT through next/image. The file is therefore
 * pre-compressed to WebP (a 2.4 MB source JPEG becomes a 63 KB WebP) so the
 * unoptimised serve stays small and the page keeps its LCP budget.
 *
 * The file is cropped to a square with the subject's face in the upper-middle,
 * which is where the blob mask needs it: the blob is a 1800x1800 viewBox and
 * the image is drawn with `preserveAspectRatio="xMidYMid slice"`.
 *
 * @see doc/image-review.md
 */

export type HeroPortrait = {
  src: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
  /** True while the image is stand-in content rather than our own photography. */
  isPlaceholder: boolean;
};

export const HERO_PORTRAIT: HeroPortrait = {
  src: "/images/hero/hero-speaker-pink-wall.webp",
  width: 1200,
  height: 1200,
  // Describes purpose, not the picture. The subject is a participant speaking
  // during a Dada Space session.
  alt: "A young woman speaking during a Dada Space session",
  credit:
    "Participant at a Dada Space session, Kibera. Photographed by Suma. Published with written consent.",
  isPlaceholder: false,
};


export const BLOB_VIEWBOX = "0 0 1800 1800";

/**
 * The portrait the hero shows.
 *
 * ## Why an editor can replace it
 *
 * The photograph is ours and consented, and it is also the single most
 * changeable thing on the homepage: a new speaker, a new session, a new
 * season. Leaving it in code meant the person who owns the page could not
 * change the face on it.
 *
 * ## Why the credit goes with it
 *
 * The caption names a photographer and a session. It is a claim about a
 * specific picture, and it would be false about a different one. So an
 * editor's image carries no credit, and the caption is not rendered.
 *
 * ## Why the alt text is not borrowed
 *
 * The shipped alt text describes the shipped photograph. Falling back to it
 * for a different picture would describe the wrong face. An image with no alt
 * text of its own is refused by the action, so there is nothing to borrow.
 */
export function heroPortraitFor(
  imagePath?: string | null,
  imageAlt?: string | null,
): HeroPortrait {
  const path = imagePath?.trim();
  if (!path) return HERO_PORTRAIT;

  return {
    ...HERO_PORTRAIT,
    src: path,
    alt: imageAlt?.trim() ?? "",
    credit: "",
    isPlaceholder: false,
  };
}
