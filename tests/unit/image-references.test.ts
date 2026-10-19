import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Image reference integrity.
 *
 * A broken image reference does not fail a build. Next.js renders the `<img>`
 * with a src that 404s at runtime, and the page looks fine in every test that
 * checks structure rather than pixels. This exact class of bug shipped once:
 * the impact page referenced `/images/impact/impact-mothers-and-babies.avif`,
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
  const references = [...new Set(findReferences(join(ROOT, "app")))].concat(
    [...new Set(findReferences(join(ROOT, "components")))],
  );
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

  it("references only files that survived the selection sort", () => {
    // The sort files every photograph into a bucket. A component pointing at a
    // file that the sort filed elsewhere is the failure this suite exists to
    // catch.
    const manifest = JSON.parse(
      readFileSync(join(ROOT, "images", "selected", "manifest.json"), "utf8"),
    );
    const published = new Set<string>();
    for (const bucket of ["hero", "about", "stories", "impact"]) {
      for (const name of Object.values(manifest[bucket] as Record<string, string>)) {
        published.add(name.replace(/\.jpg$/, ".avif"));
      }
    }
    for (const group of Object.values(
      manifest.programmes as Record<string, Record<string, string>>,
    )) {
      for (const name of Object.values(group)) {
        published.add(name.replace(/\.jpg$/, ".avif"));
      }
    }

    const orphans = unique.filter((ref) => {
      const base = ref.split("/").pop()!;
      return !published.has(base);
    });
    expect(orphans).toEqual([]);
  });
});
