/**
 * Hero portrait configuration.
 *
 * ⚠️  THE CURRENT IMAGE IS NOT OURS AND IS NOT CONSENTED.
 *
 * `globalgiving.org/pfil/30806/pict_large.jpg` is the GlobalGiving profile
 * picture of organisation #30806. It shows identifiable children belonging to
 * a different organisation, published by them for their own fundraising.
 *
 * It is wired in as a deliberate, time-boxed placeholder with the user's
 * informed consent (2026-10-15). It must be replaced before any real donor,
 * funder or press sees the site.
 *
 * REPLACEMENT CONTRACT — do not remove the fields, only the values:
 *   src:        a photograph Imarisha Dada owns the rights to
 *   consentTier: 'named_full' once a participant (and guardian, if under 18)
 *               has signed a written release on file
 *   credit:     an honest caption. NEVER claim "used with written consent"
 *               unless consentTier is 'named_full' and the paperwork exists.
 *
 * The file is vendored at `public/images/hero-placeholder.jpg` rather than
 * hot-linked. Served through the Next image optimiser, a cold remote fetch of
 * the origin took 2.3 s and pushed LCP from 2.7 s to 3.5 s. Reading from local
 * disk removes the round-trip, and decouples us from GlobalGiving uptime.
 * To swap in real consented photography: overwrite that file (keeping the
 * filename keeps the swap a no-op) or change `src` and drop a new file.
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

/**
 * The blob mask is applied via an SVG `<mask>`, which means the photo is served
 * by an SVG `<image>` element — NOT through next/image. The file is therefore
 * pre-compressed to WebP (106 KB JPEG → 43 KB WebP) so the unoptimised serve
 * stays small.
 *
 * When the real consented photograph lands, prefer routing it back through
 * next/image and applying the same path as a CSS `mask-image` data-URI, rather
 * than shipping a large unoptimised asset.
 */
export const HERO_PORTRAIT: HeroPortrait = {
  src: "/images/hero-placeholder.webp",
  width: 1024,
  height: 731,
  // Describes purpose honestly rather than describing the picture.
  alt: "Girls standing together outdoors",
  credit:
    "Placeholder image — another organisation's photograph, not Imarisha Dada participants. To be replaced with approved photography.",
  isPlaceholder: true,
};

/**
 * Blob mask path, taken verbatim from the Tailwind CSS `mask-type` docs
 * (https://tailwindcss.com/docs/mask-type). Its measured bounding box is
 * x 68, y 1, width 248, height 190.27 — that is the viewBox below, so the
 * blob fills the box exactly rather than sitting inside dead space.
 */
export const BLOB_PATH =
  "M138.25 45.9161c34.504 -4.0384 45.586 -8.2996 69.504 -26.7274c35.516 -27.35568 88.5 -27.47958 103.651 24.8472c11.65 40.2452 0.417 90.1771 -25.438 113.0701c-43.537 38.552 -124.113 45.445 -174.128 15.703c-43.1183 -25.637 -56.9741 -74.9589 -30.0882 -107.1019c9.1187 -10.902 23.4522 -15.924 56.4992 -19.791z";

export const BLOB_VIEWBOX = "68 1 248 190.27";