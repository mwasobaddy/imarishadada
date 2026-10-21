/**
 * What the image picker shows.
 *
 * The type lives here rather than in the picker component because both sides
 * of the boundary need it: the picker builds the list, and the server action
 * that reads the media library returns it. A server action importing a type
 * from a client component would close a loop across the boundary.
 *
 * `path` is a URL the image component can load — not a storage path. A file
 * that cannot be reached by a URL is not in the list.
 */
export type MediaOption = {
  path: string;
  label: string;
  group: string;
  width: number;
  height: number;
  /** Alt text if we have it. Static images do not carry one; uploaded media does. */
  alt?: string;
  /** Present only for uploaded media. */
  consentTier?: string;
  /** `static` = shipped in the repo, `uploaded` = in the media table. */
  source: "static" | "uploaded";
};
