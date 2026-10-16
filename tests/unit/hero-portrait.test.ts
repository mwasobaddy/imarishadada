import { describe, expect, it } from "vitest";

import { HERO_PORTRAIT } from "@/lib/data/hero-portrait";

/**
 * Written per the team's execution policy (2026-10-15) — not run yet.
 *
 * These assertions are what stop the placeholder image from quietly becoming
 * permanent, and stop the credit line from regressing into a consent claim the
 * organisation cannot evidence.
 */

describe("hero portrait", () => {
  it("is explicitly flagged as a placeholder", () => {
    expect(HERO_PORTRAIT.isPlaceholder).toBe(true);
  });

  it("serves from the repository rather than hot-linking a third party", () => {
    // A remote origin adds a cold-fetch round trip to the LCP path and
    // couples our hero to another organisation's uptime.
    expect(HERO_PORTRAIT.src.startsWith("/")).toBe(true);
    expect(HERO_PORTRAIT.src).not.toMatch(/^https?:/);
  });

  it("declares intrinsic dimensions so the layout is reserved before load", () => {
    expect(HERO_PORTRAIT.width).toBeGreaterThan(0);
    expect(HERO_PORTRAIT.height).toBeGreaterThan(0);
  });

  it("discloses the placeholder status in the visible credit", () => {
    expect(HERO_PORTRAIT.credit.toLowerCase()).toContain("placeholder");
  });

  it("does not claim consent it does not have", () => {
    // This is the assertion that matters most. The page must never assert
    // "used with written consent" while pointing at another organisation's
    // photograph.
    expect(HERO_PORTRAIT.credit.toLowerCase()).not.toContain("written consent");
    expect(HERO_PORTRAIT.credit.toLowerCase()).not.toContain("consented");
  });

  it("names whose photograph it is", () => {
    expect(HERO_PORTRAIT.credit).toContain("another organisation");
  });

  it("has non-empty alt text that is not a filename", () => {
    expect(HERO_PORTRAIT.alt.trim().length).toBeGreaterThan(0);
    expect(HERO_PORTRAIT.alt).not.toMatch(/\.(jpg|jpeg|png|webp)$/i);
  });

  // When the real consented photograph lands, flip isPlaceholder to false and
  // this suite should then FAIL on the two "discloses"/"names" cases until the
  // credit line is rewritten. That failure is the intended reminder.
});