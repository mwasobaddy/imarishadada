/**
 * Where a media file lives, and the URL that reaches it.
 *
 * ## The problem this solves
 *
 * `media.file_path` is the path *inside* a storage bucket, and the bucket
 * itself used to be unrecorded. A path on its own is not a URL, so an uploaded
 * photograph could not be loaded by anything: the picker handed the raw path to
 * the image component and the page showed a broken image. The 48 shipped
 * photographs in `public/images` worked, and nothing else did.
 *
 * ## Why only one bucket can be published
 *
 * `public-media` is publicly readable. `story-media` and `documents` are staff
 * only, reached through a signed URL that expires — and an image in a page
 * needs a URL that still works next month. So a private file cannot be used in
 * a published image, and the picker only offers the public ones.
 */

/** The buckets the library can upload to. */
export const MEDIA_BUCKETS = ["public-media", "story-media", "documents"] as const;

export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

/** The only bucket a published image can point at. */
export const PUBLIC_BUCKET: MediaBucket = "public-media";

/** Whether a string names one of the buckets. */
export function isMediaBucket(value: string): value is MediaBucket {
  return (MEDIA_BUCKETS as readonly string[]).includes(value);
}

/**
 * The public URL for a file, or null when there is not one.
 *
 * A file in a private bucket has no public URL: it is reached through a signed
 * URL that expires, which is no use in a page that has to keep working. The
 * caller gets null and leaves the file out.
 */
export function publicMediaUrl(
  filePath: string,
  bucket: string,
  projectUrl: string,
): string | null {
  if (bucket !== PUBLIC_BUCKET) return null;
  if (!filePath) return null;
  const base = projectUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${PUBLIC_BUCKET}/${filePath.replace(/^\/+/, "")}`;
}
