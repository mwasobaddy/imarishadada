/**
 * The post categories, in one place.
 *
 * These mirror the CHECK constraint on `posts.category` (migration 0007). Every
 * value the database accepts must be listed here, or a post in that category
 * would be stored but never shown in the filter. `tests/unit/news-vocabulary.test.ts`
 * reads the migration and fails if the two drift apart.
 *
 * The labels are interface text for the filter, not editable copy. The roadmap
 * lists "Announcements · Programmes · Events · Thought leadership" as filter
 * labels, but those are not the categories the database stores, and a filter that
 * offered them would match nothing. The stored values win.
 */
export const NEWS_CATEGORIES = [
  { value: "news", label: "News" },
  { value: "story", label: "Stories" },
  { value: "update", label: "Updates" },
  { value: "press_release", label: "Press releases" },
  { value: "announcement", label: "Announcements" },
  { value: "event_recap", label: "Event recaps" },
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]["value"];

export function isNewsCategory(value: unknown): value is NewsCategory {
  return NEWS_CATEGORIES.some((c) => c.value === value);
}

export function categoryLabel(value: string): string {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
