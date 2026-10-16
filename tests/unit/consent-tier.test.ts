import { describe, expect, it } from "vitest";

import { effectiveConsentTier, mayRenderImage, mayRenderName } from "@/lib/data/types";

/**
 * Safeguarding control, so TDD applies (.opencode/rules/testing.md).
 * These assert BOTH the allowed and the denied path for every tier.
 */

const NOW = new Date("2026-10-15T12:00:00Z");
const FUTURE = "2027-10-15T12:00:00Z";
const PAST = "2025-10-15T12:00:00Z";

describe("effectiveConsentTier", () => {
  it("passes through a live consent tier", () => {
    expect(effectiveConsentTier("named_full", FUTURE, NOW)).toBe("named_full");
    expect(effectiveConsentTier("named_no_face", FUTURE, NOW)).toBe("named_no_face");
    expect(effectiveConsentTier("anonymised", null, NOW)).toBe("anonymised");
  });

  it("downgrades to anonymised when consent has expired", () => {
    // A girl consented at 11 is a different situation from the same person at 19.
    expect(effectiveConsentTier("named_full", PAST, NOW)).toBe("anonymised");
    expect(effectiveConsentTier("named_no_face", PAST, NOW)).toBe("anonymised");
  });

  it("treats a null expiry as no expiry", () => {
    expect(effectiveConsentTier("named_full", null, NOW)).toBe("named_full");
  });
});

describe("mayRenderImage", () => {
  it("allows an image only for live named_full consent", () => {
    expect(mayRenderImage("named_full", FUTURE, NOW)).toBe(true);
  });

  it("refuses an image for named_no_face", () => {
    expect(mayRenderImage("named_no_face", FUTURE, NOW)).toBe(false);
  });

  it("refuses an image for anonymised", () => {
    expect(mayRenderImage("anonymised", null, NOW)).toBe(false);
  });

  it("refuses an image once consent has expired", () => {
    expect(mayRenderImage("named_full", PAST, NOW)).toBe(false);
  });
});

describe("mayRenderName", () => {
  it("allows a name for named_full and named_no_face", () => {
    expect(mayRenderName("named_full", FUTURE, NOW)).toBe(true);
    expect(mayRenderName("named_no_face", FUTURE, NOW)).toBe(true);
  });

  it("refuses a name for anonymised", () => {
    // Must not leak into title, meta, OG tags, or JSON-LD.
    expect(mayRenderName("anonymised", null, NOW)).toBe(false);
  });

  it("refuses a name once consent has expired", () => {
    expect(mayRenderName("named_full", PAST, NOW)).toBe(false);
    expect(mayRenderName("named_no_face", PAST, NOW)).toBe(false);
  });
});