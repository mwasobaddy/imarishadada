import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { NEWS_CATEGORIES, categoryLabel, isNewsCategory } from "@/lib/news/vocabulary";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * The filter offers the categories in `NEWS_CATEGORIES`. The database accepts the
 * values in its CHECK constraint. If the two drift, a post can be stored in a
 * category that is never shown, so this test reads the migration and compares.
 */

const MIGRATION = join(import.meta.dirname, "..", "..", "supabase", "migrations", "0007_phase5_admin.sql");

describe("news categories", () => {
  it("lists exactly the values the database CHECK accepts", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    const check = sql.match(/category\s+text[^;]*?check \(category in \(([^)]+)\)\)/);
    expect(check, "the posts.category CHECK constraint was not found").not.toBeNull();

    const dbValues = [...check![1]!.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    const ours = NEWS_CATEGORIES.map((c) => c.value).sort();
    expect(ours).toEqual(dbValues);
  });

  it("has a distinct, non-empty label for every category", () => {
    const labels = NEWS_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) expect(label.trim().length).toBeGreaterThan(0);
  });

  it("accepts a known category and rejects anything else", () => {
    expect(isNewsCategory("announcement")).toBe(true);
    expect(isNewsCategory("events")).toBe(false);
    expect(isNewsCategory(undefined)).toBe(false);
    expect(isNewsCategory(["news"])).toBe(false);
  });

  it("falls back to the raw value for an unknown label rather than blanking it", () => {
    expect(categoryLabel("press_release")).toBe("Press releases");
    expect(categoryLabel("mystery")).toBe("mystery");
  });
});
