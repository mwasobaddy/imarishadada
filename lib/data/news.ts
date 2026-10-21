import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSection } from "@/lib/data/sections";
import type { SiteSection } from "@/lib/data/types";
import { categoryLabel, type NewsCategory } from "@/lib/news/vocabulary";
import { pageFrom, readingMinutes } from "@/lib/news/rules";
import { truncateExcerpt } from "@/lib/stories/copy";

/**
 * News readers.
 *
 * ## What the public may see is decided by the database
 *
 * `posts_anon_read` returns only published rows whose `published_at` has passed.
 * Every query here runs as the anonymous client, so an unpublished or
 * future-dated post cannot reach the page however it is filtered. The queries
 * below do not repeat that filter, because repeating a time-based filter inside a
 * cached function would freeze the clock at build time.
 *
 * ## When a scheduled post appears
 *
 * Readers are cached for hours and invalidated by `revalidateTag("posts")` on
 * every write. A post whose `published_at` passes between writes appears at the
 * next cache refresh, not the second it is due. That is the trade for a cached
 * page; the admin says so next to the publish button.
 */

export const NEWS_PAGE_SIZE = 12;

const CARD_COLUMNS =
  "slug, title, excerpt, category, published_at, cover_path, cover_alt, reading_minutes, featured";

export type NewsCard = {
  slug: string;
  title: string;
  /** Truncated to 30 words in this layer, not in CSS. See the roadmap's note on duplicate text. */
  excerpt: string;
  category: NewsCategory;
  categoryLabel: string;
  /** ISO timestamp. Formatted by the component, in Nairobi time. */
  publishedAt: string;
  coverPath: string | null;
  coverAlt: string | null;
  /** The editor's figure, or computed from the body on the article page. Null on cards. */
  readingMinutes: number | null;
  featured: boolean;
};

export type NewsArticle = NewsCard & {
  /** Full text, split into paragraphs by the caller. Plain text, never HTML. */
  body: string;
  readingMinutes: number;
};

type Row = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  published_at: string | null;
  cover_path: string | null;
  cover_alt: string | null;
  reading_minutes: number | null;
  featured: boolean;
};

function toCard(row: Row): NewsCard {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: truncateExcerpt(row.excerpt ?? "", 30),
    category: row.category as NewsCategory,
    categoryLabel: categoryLabel(row.category),
    publishedAt: row.published_at ?? "",
    coverPath: row.cover_path,
    coverAlt: row.cover_alt,
    readingMinutes: row.reading_minutes,
    featured: row.featured,
  };
}

/**
 * One page of the index, newest first, optionally in one category.
 *
 * `before` is the publish time of the last post on the previous page. Passing it
 * as a plain string is the cursor; the caller never builds a page number.
 */
export async function getNewsPage({
  category,
  before,
}: {
  category?: NewsCategory;
  before?: string;
}): Promise<{ posts: NewsCard[]; nextCursor: string | null }> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  if (!isSupabaseConfigured()) return { posts: [], nextCursor: null };

  let query = createClient()
    .from("posts")
    .select(CARD_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(NEWS_PAGE_SIZE + 1);

  if (category) query = query.eq("category", category);
  if (before) query = query.lt("published_at", before);

  const { data, error } = await query;
  if (error) {
    console.error("[data] posts query failed:", error.message);
    return { posts: [], nextCursor: null };
  }

  const cards = (data ?? []).map((row) => toCard(row as Row));
  return pageFrom(cards, NEWS_PAGE_SIZE);
}

/** The newest featured post, if one is marked. */
export async function getFeaturedPost(): Promise<NewsCard | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  if (!isSupabaseConfigured()) return null;

  const { data, error } = await createClient()
    .from("posts")
    .select(CARD_COLUMNS)
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[data] featured post query failed:", error.message);
    return null;
  }

  const row = data?.[0];
  return row ? toCard(row as Row) : null;
}

/**
 * Categories that have at least one published post.
 *
 * The filter offers only these. A filter that leads to an empty page breaks the
 * rule that the grid is never rendered empty, just in a different place.
 */
export async function getNewsCategoriesInUse(): Promise<NewsCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient().from("posts").select("category");
  if (error) {
    console.error("[data] post categories query failed:", error.message);
    return [];
  }

  const seen = new Set((data ?? []).map((r) => r.category as string));
  return (
    ["news", "story", "update", "press_release", "announcement", "event_recap"] as const
  ).filter((c) => seen.has(c));
}

/**
 * One article by slug. Null when there is no such published post, which the
 * caller turns into a 404.
 */
export async function getPostBySlug(slug: string): Promise<NewsArticle | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  if (!isSupabaseConfigured()) return null;

  const { data, error } = await createClient()
    .from("posts")
    .select(`${CARD_COLUMNS}, body`)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[data] post query failed:", error.message);
    return null;
  }
  if (!data) return null;

  const body = (data.body as string) ?? "";
  return {
    ...toCard(data as unknown as Row),
    body,
    readingMinutes: (data.reading_minutes as number | null) ?? readingMinutes(body),
  };
}

/** Slugs for the sitemap. Published posts only, by the same policy as the pages. */
export async function getPublishedPostSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient().from("posts").select("slug");
  if (error) {
    console.error("[data] post slugs query failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.slug as string);
}

/** The index page's sections, keyed. */
export async function getNewsSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = ["news-hero", "news-empty"];
  return Object.fromEntries(
    await Promise.all(keys.map(async (key) => [key, await getSection(key)] as const)),
  );
}
