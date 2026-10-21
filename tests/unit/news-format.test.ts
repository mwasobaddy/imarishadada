import { describe, expect, it } from "vitest";

import { formatPostDate, postDateTime } from "@/lib/news/format";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * The site is pinned to Nairobi time (UTC+3). A post published late in the evening
 * in Nairobi must read as that day, not the previous one, whatever timezone the
 * server or the browser is in.
 */

describe("formatPostDate", () => {
  it("reads a late-evening UTC instant as the next day in Nairobi", () => {
    // 22:30 UTC on the 21st is 01:30 on the 22nd in Nairobi.
    expect(formatPostDate("2026-10-21T22:30:00Z")).toBe("22 October 2026");
  });

  it("returns an empty string for an unreadable date rather than 'Invalid Date'", () => {
    expect(formatPostDate("not a date")).toBe("");
  });
});

describe("postDateTime", () => {
  it("gives the machine-readable Nairobi date for a <time> element", () => {
    expect(postDateTime("2026-10-21T22:30:00Z")).toBe("2026-10-22");
  });
});
