import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import en from "@/messages/en.json";

/**
 * Message-catalogue resolution and the translation guard.
 *
 * doc/roadmap/localisation.md §6 requires TDD for "message-key resolution".
 * The failure mode is quiet: a missing key renders as the raw key string
 * (`nav.ourWork`) at runtime, so a translator sees a broken page and a visitor
 * sees a broken page, and nothing fails until it ships.
 *
 * The guard test matters more than usual. `i18n/check-translations.mjs` is the
 * mechanism that stops an unreviewed locale from being published, and the
 * whole point is that it fails closed. A guard that only ever passes is
 * indistinguishable from no guard at all.
 */

const REPO = join(import.meta.dirname, "..", "..");
const SCRIPT = join(REPO, "i18n", "check-translations.mjs");

/** Run the guard against a scratch copy of the repo. */
function runGuard(): { status: number; output: string } {
  try {
    const output = execFileSync("node", [SCRIPT], {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("messages/en.json", () => {
  it("is valid JSON with the expected top-level namespaces", () => {
    expect(Object.keys(en).sort()).toEqual(
      ["_meta", "announcement", "common", "donate", "errors", "footer", "nav"].sort(),
    );
  });

  it("declares itself as the published reference catalogue", () => {
    expect(en._meta.status).toBe("published");
  });

  it("has no empty message values", () => {
    // An empty string renders as a blank label — a silent failure that no
    // type checker catches and no key-resolution error reports.
    const walk = (node: unknown, path = ""): string[] => {
      if (typeof node === "string") return node.trim() === "" ? [path] : [];
      if (node && typeof node === "object") {
        return Object.entries(node).flatMap(([key, value]) =>
          walk(value, path ? `${path}.${key}` : key),
        );
      }
      return [];
    };
    expect(walk(en)).toEqual([]);
  });

  it("gives every nav item a label key that exists in the catalogue", () => {
    // The nav is defined in `lib/nav.ts` and rendered through the catalogue.
    // A typo in a `labelKey` is the exact "raw key string" failure this suite
    // exists to catch.
    const navSource = readFileSync(join(REPO, "lib", "nav.ts"), "utf8");
    const keys = [...navSource.matchAll(/labelKey: "(\w+)"/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(en.nav).toHaveProperty(key);
    }
  });
});

describe("translation guard", () => {
  let scratch: string;

  beforeEach(() => {
    scratch = mkdtempSync(join(tmpdir(), "i18n-guard-"));
  });

  afterEach(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  /**
   * Build a scratch copy of just the files the guard reads: `lib/seo.ts`,
   * `i18n/check-translations.mjs` and `messages/`.
   */
  function scaffold(): string {
    mkdirSync(join(scratch, "lib"), { recursive: true });
    mkdirSync(join(scratch, "i18n"), { recursive: true });
    mkdirSync(join(scratch, "messages"), { recursive: true });
    cpSync(join(REPO, "lib", "seo.ts"), join(scratch, "lib", "seo.ts"));
    cpSync(SCRIPT, join(scratch, "i18n", "check-translations.mjs"));
    cpSync(join(REPO, "messages", "en.json"), join(scratch, "messages", "en.json"));
    return scratch;
  }

  function guardIn(scratchDir: string): { status: number; output: string } {
    try {
      const output = execFileSync(
        "node",
        [join(scratchDir, "i18n", "check-translations.mjs")],
        { cwd: scratchDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      return { status: 0, output };
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string };
      return { status: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  }

  it("passes on the real repository", () => {
    const { status, output } = runGuard();
    expect(output).toContain("Translation catalogues OK");
    expect(status).toBe(0);
  });

  it("fails when a published locale has no catalogue", () => {
    const dir = scaffold();
    // Publish `sw` without shipping a catalogue for it.
    const seo = join(dir, "lib", "seo.ts");
    writeFileSync(
      seo,
      readFileSync(seo, "utf8").replace(
        'export const PUBLISHED_LOCALES = ["en"]',
        'export const PUBLISHED_LOCALES = ["en", "sw"]',
      ),
    );

    const { status, output } = guardIn(dir);
    expect(status).toBe(1);
    expect(output).toContain("messages/sw.json is missing");
  });

  it("fails when a published catalogue is still a draft", () => {
    const dir = scaffold();
    const seo = join(dir, "lib", "seo.ts");
    writeFileSync(
      seo,
      readFileSync(seo, "utf8").replace(
        'export const PUBLISHED_LOCALES = ["en"]',
        'export const PUBLISHED_LOCALES = ["en", "sw"]',
      ),
    );
    // A machine draft: complete keys, but not signed off by a human.
    const draft = { ...en, _meta: { status: "draft", reviewedBy: null, reviewedAt: null } };
    writeFileSync(join(dir, "messages", "sw.json"), JSON.stringify(draft));

    const { status, output } = guardIn(dir);
    expect(status).toBe(1);
    expect(output).toContain("machine-translated");
  });

  it("fails when a published catalogue has no named reviewer", () => {
    const dir = scaffold();
    const seo = join(dir, "lib", "seo.ts");
    writeFileSync(
      seo,
      readFileSync(seo, "utf8").replace(
        'export const PUBLISHED_LOCALES = ["en"]',
        'export const PUBLISHED_LOCALES = ["en", "sw"]',
      ),
    );
    const draft = {
      ...en,
      _meta: { status: "published", reviewedBy: null, reviewedAt: null },
    };
    writeFileSync(join(dir, "messages", "sw.json"), JSON.stringify(draft));

    const { status, output } = guardIn(dir);
    expect(status).toBe(1);
    expect(output).toContain("_meta.reviewedBy");
  });

  it("fails when a published catalogue is missing a key the English one has", () => {
    const dir = scaffold();
    const seo = join(dir, "lib", "seo.ts");
    writeFileSync(
      seo,
      readFileSync(seo, "utf8").replace(
        'export const PUBLISHED_LOCALES = ["en"]',
        'export const PUBLISHED_LOCALES = ["en", "sw"]',
      ),
    );
    const incomplete = structuredClone(en) as Record<string, unknown>;
    delete (incomplete.nav as Record<string, unknown>).ourWork;
    incomplete._meta = { status: "published", reviewedBy: "A. Reviewer", reviewedAt: "2026-10-18" };
    writeFileSync(join(dir, "messages", "sw.json"), JSON.stringify(incomplete));

    const { status, output } = guardIn(dir);
    expect(status).toBe(1);
    expect(output).toContain("nav.ourWork");
  });

  it("passes a properly reviewed, complete catalogue", () => {
    const dir = scaffold();
    const seo = join(dir, "lib", "seo.ts");
    writeFileSync(
      seo,
      readFileSync(seo, "utf8").replace(
        'export const PUBLISHED_LOCALES = ["en"]',
        'export const PUBLISHED_LOCALES = ["en", "sw"]',
      ),
    );
    const reviewed = {
      ...en,
      _meta: { status: "published", reviewedBy: "A. Reviewer", reviewedAt: "2026-10-18" },
    };
    writeFileSync(join(dir, "messages", "sw.json"), JSON.stringify(reviewed));

    const { status, output } = guardIn(dir);
    expect(output).toContain("Translation catalogues OK");
    expect(status).toBe(0);
  });
});
