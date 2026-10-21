/**
 * Where a sign-in lands.
 *
 * ## Why this is guarded
 *
 * The sign-in pages take a `?next=` so a person turned away from a page lands
 * back on it. Taken literally, that is an open redirect: `?next=https://
 * example.com` would send a member of staff — with a session in the cookie —
 * to a site of someone else's choosing, and the address bar would look like
 * ours right up until it did not.
 *
 * ## The rule
 *
 * Only a path within this site is allowed: it starts with a single slash and
 * does not start with two. `//evil.example` is a protocol-relative URL, so
 * it is refused along with everything else that is not a local path.
 */
export const DEFAULT_NEXT_PATH = "/admin";

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_NEXT_PATH;
  if (!value.startsWith("/")) return DEFAULT_NEXT_PATH;
  if (value.startsWith("//")) return DEFAULT_NEXT_PATH;
  return value;
}
