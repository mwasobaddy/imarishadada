import { describe, expect, it } from "vitest";

import {
  MEDIA_REFERENCE_SOURCES,
  referenceMatchesFile,
} from "@/lib/media/references";

/**
 * Written per the team's execution policy (2026-10-15) — not run yet.
 *
 * These assertions pin the rule that a file in use cannot be deleted. If the
 * list of places a photograph can be used falls behind the schema, the guard
 * lets a file be removed while a live page still points at it, and the page
 * shows a broken image with nothing to say why.
 */

const FILE_PATH = "1760000000-hero-alt-close-up.webp";
const PUBLIC_URL =
  "https://qbipjvbbpgggempnzfrp.supabase.co/storage/v1/object/public/public-media/1760000000-hero-alt-close-up.webp";

describe("recognising a reference", () => {
  it("matches the bare storage path", () => {
    expect(referenceMatchesFile(FILE_PATH, FILE_PATH)).toBe(true);
  });

  it("matches the public URL the path resolves to", () => {
    expect(referenceMatchesFile(PUBLIC_URL, FILE_PATH)).toBe(true);
  });

  it("does not match another file", () => {
    expect(
      referenceMatchesFile(
        "https://qbipjvbbpgggempnzfrp.supabase.co/storage/v1/object/public/public-media/1760000001-other.webp",
        FILE_PATH,
      ),
    ).toBe(false);
  });

  it("does not match a photograph shipped in the repository", () => {
    expect(referenceMatchesFile("/images/hero/hero-alt-close-up.webp", FILE_PATH)).toBe(
      false,
    );
  });

  it("does not match nothing", () => {
    expect(referenceMatchesFile("", FILE_PATH)).toBe(false);
    expect(referenceMatchesFile(null, FILE_PATH)).toBe(false);
    expect(referenceMatchesFile(undefined, FILE_PATH)).toBe(false);
    expect(referenceMatchesFile(PUBLIC_URL, "")).toBe(false);
  });
});

describe("the places a photograph can be used", () => {
  /** Every column in the schema that can hold an image path. */
  const COVERED: [string, string][] = [
    ["site_sections", "image_path"],
    ["site_sections", "images"],
    ["stories", "image_path"],
    ["posts", "cover_path"],
    ["programmes", "image_path"],
    ["partners", "logo_path"],
    ["partner_schools", "logo_path"],
    ["team_members", "photo_path"],
    ["events", "image_path"],
  ];

  it("covers every column that can hold an image", () => {
    const covered = MEDIA_REFERENCE_SOURCES.flatMap((source) => [
      ...source.columns.map((column) => `${source.table}.${column}`),
      ...(source.jsonColumns ?? []).map((column) => `${source.table}.${column}`),
    ]);

    for (const entry of COVERED) {
      expect(covered).toContain(entry.join("."));
    }
  });

  it("does not list a column that does not exist", () => {
    const covered = MEDIA_REFERENCE_SOURCES.flatMap((source) => [
      ...source.columns.map((column) => `${source.table}.${column}`),
      ...(source.jsonColumns ?? []).map((column) => `${source.table}.${column}`),
    ]);

    expect(covered.length).toBe(COVERED.length);
  });

  it("gives every source a way for the editor to get to the place", () => {
    for (const source of MEDIA_REFERENCE_SOURCES) {
      const row = {
        id: "row-id",
        title: "A title",
        name: "A name",
        heading: "A heading",
        page_key: "home",
        published: true,
        active: true,
      };
      const context = {
        pages: new Map([["home", { label: "Home", route: "/" }]]),
      };

      expect(source.label(row, context)).toBeTruthy();
      expect(source.href(row, context)).toMatch(/^\/admin\//);
    }
  });
});
