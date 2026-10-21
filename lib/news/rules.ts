/**
 * The rules a post must meet, as pure functions.
 *
 * Kept free of database and framework imports so the admin actions, the readers
 * and the unit tests all run the same code.
 */

export type PostFields = {
  title: string | null | undefined;
  excerpt: string | null | undefined;
  body: string | null | undefined;
  cover_path: string | null | undefined;
  cover_alt: string | null | undefined;
};

/**
 * Why a post cannot be saved as it stands, or `null` if it can.
 *
 * A cover needs a description. The database refuses the same write
 * (`posts_cover_alt_required`); this gives the editor a sentence first.
 *
 * Takes a partial because an update may leave both fields out. A field that is
 * not in the update is not being changed, and the database still checks the row.
 */
export function coverAltBlocker(
  post: Partial<Pick<PostFields, "cover_path" | "cover_alt">>,
): string | null {
  if (post.cover_path && !post.cover_alt?.trim()) {
    return "Describe the cover image for screen readers. Every image on the site needs alt text.";
  }
  return null;
}

/**
 * Why a post cannot be published, or `null` if it can.
 *
 * An unpublished draft may be incomplete. A published one appears in the grid and
 * on the homepage feed, so an empty card or an empty article is a page the public
 * sees. The excerpt is what the grid shows, so it is required.
 */
export function publishBlocker(post: PostFields): string | null {
  const missing: string[] = [];
  if (!post.title?.trim()) missing.push("a title");
  if (!post.excerpt?.trim()) missing.push("an excerpt");
  if (!post.body?.trim()) missing.push("a body");

  if (missing.length > 0) {
    return `A post needs ${missing.join(", ")} before it can be published.`;
  }
  return coverAltBlocker(post);
}

/**
 * Pagination by cursor, not offset.
 *
 * The reader fetches `limit + 1` rows. If the extra row exists there is another
 * page, and the cursor is the last row shown: its publish time. An offset would
 * skip or repeat a post whenever someone publishes while a reader is paging.
 */
export function pageFrom<T extends { publishedAt: string }>(
  rows: T[],
  limit: number,
): { posts: T[]; nextCursor: string | null } {
  if (rows.length <= limit) return { posts: rows, nextCursor: null };
  const posts = rows.slice(0, limit);
  return { posts, nextCursor: posts[posts.length - 1]!.publishedAt };
}

/**
 * Reading time in whole minutes, at 200 words a minute, never below one.
 *
 * Used when an editor has not set `reading_minutes`, so a card does not silently
 * drop the figure.
 */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
