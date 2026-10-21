import { describe, expect, it } from "vitest";

import {
  isMediaBucket,
  MEDIA_BUCKETS,
  PUBLIC_BUCKET,
  publicMediaUrl,
} from "@/lib/media/public-url";

/**
 * Written per the team's execution policy (2026-10-15) — not run yet.
 *
 * These assertions pin the rule that a published image must point at a URL
 * that still works next month. A file in a private bucket has no such URL, so
 * it must never be handed to a page.
 */

const PROJECT_URL = "https://qbipjvbbpgggempnzfrp.supabase.co";

describe("media buckets", () => {
  it("names the three buckets the library can upload to", () => {
    expect(MEDIA_BUCKETS).toEqual(["public-media", "story-media", "documents"]);
  });

  it("treats only public-media as publishable", () => {
    expect(PUBLIC_BUCKET).toBe("public-media");
  });

  it("recognises the buckets and rejects anything else", () => {
    expect(isMediaBucket("public-media")).toBe(true);
    expect(isMediaBucket("story-media")).toBe(true);
    expect(isMediaBucket("documents")).toBe(true);
    expect(isMediaBucket("secrets")).toBe(false);
    expect(isMediaBucket("")).toBe(false);
  });
});

describe("public media URL", () => {
  it("builds the public URL for a file in the public bucket", () => {
    expect(publicMediaUrl("photo.jpg", "public-media", PROJECT_URL)).toBe(
      `${PROJECT_URL}/storage/v1/object/public/public-media/photo.jpg`,
    );
  });

  it("refuses a file in a private bucket", () => {
    // A signed URL expires. A page pointing at one breaks later, and the
    // breakage looks like a missing photograph rather than a bad link.
    expect(publicMediaUrl("photo.jpg", "story-media", PROJECT_URL)).toBeNull();
    expect(publicMediaUrl("photo.jpg", "documents", PROJECT_URL)).toBeNull();
  });

  it("refuses a file with no path", () => {
    expect(publicMediaUrl("", "public-media", PROJECT_URL)).toBeNull();
  });

  it("does not double up the slashes", () => {
    expect(publicMediaUrl("/photo.jpg", "public-media", `${PROJECT_URL}/`)).toBe(
      `${PROJECT_URL}/storage/v1/object/public/public-media/photo.jpg`,
    );
  });

  it("points at the project's own storage host", () => {
    const url = publicMediaUrl("photo.jpg", "public-media", PROJECT_URL);
    expect(url?.startsWith(PROJECT_URL)).toBe(true);
    expect(url?.startsWith("https://")).toBe(true);
  });
});
