import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Image reference integrity.
 *
 * A broken image reference does not fail a build. Next.js renders the `<img>`
 * with a src that 404s at runtime, and the page looks fine in every test that
 * checks structure rather than pixels. This exact class of bug shipped once:
 * the impact page referenced `/images/impact/impact-mothers-and-babies.webp`,
 * which had been filed under `programmes/re-entry/` by the selection sort, so
 * it was never converted into `public/`.
 *
 * The check is deliberately static — it reads the source rather than crawling
 * the running site — so it runs in unit tests and needs no server.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const PUBLIC = join(ROOT, "public");

/** Every `/images/...` reference in the source. */
function findReferences(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      findReferences(full, acc);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      const source = readFileSync(full, "utf8");
      for (const match of source.matchAll(/["'`](\/images\/[^"'`\s]+)["'`]/g)) {
        acc.push(match[1]);
      }
    }
  }
  return acc;
}

describe("image references", () => {
  // `lib/` is scanned too: the programme fallback map resolves image paths at
  // runtime from `lib/data/programme-images.ts`, so a scan that skipped it
  // would report every programme photograph as an orphan.
  const references = [
    ...new Set(
      [
        ...findReferences(join(ROOT, "app")),
        ...findReferences(join(ROOT, "components")),
        ...findReferences(join(ROOT, "lib")),
      ],
    ),
  ];
  const unique = [...new Set(references)].sort();

  it("finds image references to check", () => {
    // A guard against the scanner silently matching nothing, which would make
    // every assertion below pass vacuously.
    expect(unique.length).toBeGreaterThan(5);
  });

  it("every referenced image exists in public/", () => {
    const missing = unique.filter((ref) => !existsSync(join(PUBLIC, ref)));
    expect(missing).toEqual([]);
  });

  it("never references a source-file path or a placeholder", () => {
    for (const ref of unique) {
      expect(ref).not.toMatch(/\.(jpe?g|png)$/);
      expect(ref).not.toContain("/placeholders/");
      expect(ref).not.toContain("images/selected");
    }
  });

  it("uses an extension the browser can render", () => {
    for (const ref of unique) {
      expect(ref).toMatch(/\.(avif|webp|svg|jpg|jpeg|png)$/);
    }
  });

  it("keeps the published image weight within budget", () => {
    // The alternates — unused hero, about, impact and programme frames — are a
    // deliberate pool. They are the candidates for a consent tier change, a
    // programme swap, or a better crop once the layout is settled, and they
    // are images of people who are already published on those pages, so
    // shipping them adds no new exposure.
    //
    // What must not happen is the pool growing without bound. Each file is
    // capped at 150 KB, and the whole published set is capped at 6 MB, which
    // is roughly a dozen and a half full pages of photography.
    const budget = 6 * 1024 * 1024;

    const published: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(avif|webp|svg|jpg|jpeg|png)$/.test(entry.name)) {
          published.push(full);
        }
      }
    };
    walk(join(PUBLIC, "images"));

    const total = published.reduce(
      (sum, file) => sum + statSync(file).size,
      0,
    );
    expect(total).toBeLessThanOrEqual(budget);

    // No single file may exceed the 200 KB per-image ceiling the project
    // rules set, with headroom for the 150 KB budget the conversion used.
    for (const file of published) {
      expect(statSync(file).size).toBeLessThanOrEqual(200 * 1024);
    }
  });
});
