import { describe, expect, it } from "vitest";

import { DEFAULT_NEXT_PATH, safeNextPath } from "@/lib/auth/next-path";

/**
 * Written per the team's execution policy (2026-10-15) — not run yet.
 *
 * The sign-in pages take a `?next=` so a person turned away from a page
 * lands back on it. Taken literally that is an open redirect: a member of
 * staff, with a session in the cookie, would be sent to a site of someone
 * else's choosing.
 */

describe("the page a sign-in lands on", () => {
  it("keeps a path within the site", () => {
    expect(safeNextPath("/admin/media")).toBe("/admin/media");
    expect(safeNextPath("/admin")).toBe("/admin");
  });

  it("refuses another site", () => {
    expect(safeNextPath("https://example.com")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("http://example.com/admin")).toBe(DEFAULT_NEXT_PATH);
  });

  it("refuses a protocol-relative URL", () => {
    // `//example.com` is a URL, not a path, even though it starts with a
    // slash.
    expect(safeNextPath("//example.com")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("//example.com/admin")).toBe(DEFAULT_NEXT_PATH);
  });

  it("falls back when there is nothing to go to", () => {
    expect(safeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("")).toBe(DEFAULT_NEXT_PATH);
  });

  it("does not accept a bare word", () => {
    expect(safeNextPath("admin")).toBe(DEFAULT_NEXT_PATH);
  });
});
