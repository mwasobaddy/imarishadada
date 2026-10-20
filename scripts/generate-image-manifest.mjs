#!/usr/bin/env node
/**
 * Generate the static image manifest.
 *
 * ## Why this exists
 *
 * The `media` table holds images uploaded through the admin. It is empty, and
 * it will stay mostly empty: the 48 real consented photographs that ship with
 * the site live in `public/images/` as static files, reviewed and named in
 * `doc/image-review.md`.
 *
 * A media picker that only listed the database would show an empty grid and be
 * useless. So the picker lists both — the files on disk and anything uploaded —
 * and this script is what makes the disk half available to a Server Component.
 *
 * ## Why a generated file and not a runtime directory read
 *
 * Reading `public/` at request time works locally and is unreliable on Vercel,
 * where the filesystem is a read-only bundle and the working directory is not
 * what you expect. Generating a committed manifest at build time is
 * deterministic, works everywhere, and makes the image list reviewable in a
 * diff — which matters when the list contains photographs of real people.
 *
 * ## Dimensions are read, not guessed
 *
 * `next/image` needs intrinsic width and height or it cannot reserve space, and
 * a layout shift on a photograph of a participant is exactly the CLS the
 * performance rules forbid. `sharp` reads them from the file header.
 *
 * Run via `npm run images:manifest` (also wired into `prebuild`).
 */

import { readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const IMAGES_DIR = join(ROOT, "public", "images");
const OUT = join(ROOT, "lib", "data", "image-manifest.ts");

const EXT = /\.(avif|webp|jpe?g|png)$/i;

/**
 * Turn a filename into a readable label.
 *
 * `about-two-women-classroom-alt.avif` → `About two women classroom alt`.
 * The `-alt` suffix marks a variant frame from the same shoot; it is kept
 * because the two are genuinely different photographs.
 */
function labelFor(name) {
  return name
    .replace(EXT, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (EXT.test(entry.name)) out.push(full);
  }
  return out;
}

const files = (await walk(IMAGES_DIR)).sort();

const images = [];
for (const file of files) {
  const meta = await sharp(file).metadata();
  const stat = await import("node:fs/promises").then((m) => m.stat(file));

  const rel = relative(join(ROOT, "public"), file).split(sep).join("/");
  const segments = rel.split("/");
  // images/<group>/.../<file> — the group is the first segment under images/.
  const group = segments.length > 2 ? segments[1] : "root";

  images.push({
    path: `/${rel}`,
    label: labelFor(segments[segments.length - 1]),
    group,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    sizeBytes: stat.size,
  });
}

const body = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by \`scripts/generate-image-manifest.mjs\` from \`public/images/\`.
 * Regenerate with \`npm run images:manifest\`.
 *
 * ${images.length} photographs, all consented and reviewed in
 * \`doc/image-review.md\`. These are the images the site actually ships; the
 * \`media\` table holds only what has been uploaded through the admin since.
 */

export type StaticImage = {
  /** Public URL, e.g. \`/images/about/about-the-team.avif\`. */
  path: string;
  /** Human label derived from the filename. */
  label: string;
  /** Directory under \`public/images/\`, e.g. \`about\`, \`programmes\`. */
  group: string;
  width: number;
  height: number;
  sizeBytes: number;
};

export const STATIC_IMAGES: StaticImage[] = ${JSON.stringify(images, null, 2)};
`;

await writeFile(OUT, body, "utf8");
console.log(`image manifest: ${images.length} photographs → lib/data/image-manifest.ts`);
