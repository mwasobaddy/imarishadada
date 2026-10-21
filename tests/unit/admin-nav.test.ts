import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * ## Why this file exists
 *
 * The admin sidebar had three links pointing at routes that do not exist:
 *
 *   * `/admin/content/volunteer-roles` — the route is `/admin/volunteer-roles`
 *   * `/admin/partner-enquiries` — never built; the data is a tab on Enquiries
 *   * `/admin/volunteer-applications` — never built; same
 *
 * That is worse than three dead links. A `volunteer_coordinator` holds
 * `volunteer_applications:read`, `partner_enquiries:read` and `volunteer_roles:*`
 * but **not** `enquiries:read` — so every link they could see 404'd, and the one
 * link that worked was hidden from them by permission. The role had no working
 * path to any of its own resources, and nothing anywhere reported it.
 *
 * A type checker cannot catch this: the href is a string. So this test walks the
 * filesystem and checks the string against the route tree.
 */

const REPO = join(import.meta.dirname, "..", "..");
const ADMIN_DIR = join(REPO, "app", "[locale]", "admin");
const SHELL = join(REPO, "components", "admin", "admin-shell.tsx");
const ACTIONS_DIR = join(REPO, "app", "[locale]", "admin", "actions");

/** Every admin route that exists, as `/admin/...` paths. */
function adminRoutes(): Set<string> {
  const routes = new Set<string>();

  function walk(dir: string, urlPath: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) {
        // A `page.tsx` makes this directory a route.
        if (entry === "page.tsx") routes.add(urlPath === "" ? "/admin" : urlPath);
        continue;
      }
      // `[id]` and `[pageKey]` are dynamic segments; keep them as written.
      walk(full, `${urlPath}/${entry}`);
    }
  }

  walk(ADMIN_DIR, "/admin");
  return routes;
}

/**
 * A nav href or a revalidatePath, reduced to the route it targets.
 *
 * Query strings are stripped: `/admin/enquiries?tab=partner` targets
 * `/admin/enquiries`, and the tab is a view of that page rather than a route.
 */
function targetPath(href: string): string {
  return href.split("?")[0]!;
}

function hrefsIn(source: string, pattern: RegExp): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(pattern)) found.push(match[1]!);
  return [...new Set(found)];
}

describe("admin navigation", () => {
  const routes = adminRoutes();

  it("finds the route tree at all", () => {
    // A silent zero here would make every assertion below vacuously true.
    expect(routes.size).toBeGreaterThan(15);
    expect(routes.has("/admin/enquiries")).toBe(true);
  });

  it("links only to routes that exist", () => {
    const source = readFileSync(SHELL, "utf8");
    const hrefs = hrefsIn(source, /href:\s*"(\/admin[^"]*)"/g);
    expect(hrefs.length).toBeGreaterThan(15);

    const dead = hrefs.filter((href) => !routes.has(targetPath(href)));
    expect(dead, `Sidebar links with no matching page.tsx: ${dead.join(", ")}`).toEqual([]);
  });

  it("revalidates only paths that exist", () => {
    // A stale `revalidatePath` is not a 404, but it means the admin edits
    // something and the page that should refresh does not.
    const dead: string[] = [];

    for (const file of readdirSync(ACTIONS_DIR)) {
      if (!file.endsWith(".ts")) continue;
      const source = readFileSync(join(ACTIONS_DIR, file), "utf8");
      for (const path of hrefsIn(source, /revalidatePath\("(\/admin[^"]*)"\)/g)) {
        if (!routes.has(targetPath(path))) dead.push(`${file}: ${path}`);
      }
    }

    expect(dead, `revalidatePath targets with no route: ${dead.join(", ")}`).toEqual([]);
  });

  it("keeps the tab deep-links pointed at a real route", () => {
    // The two narrower inbox entries use `?tab=`. If the query were ever
    // stripped the entry would still resolve, but the tab would be wrong — so
    // assert the base path explicitly.
    const source = readFileSync(SHELL, "utf8");
    const tabs = hrefsIn(source, /href:\s*"(\/admin\/enquiries\?tab=[a-z]+)"/g);
    expect(tabs.length).toBe(2);
    for (const href of tabs) {
      expect(routes.has(targetPath(href))).toBe(true);
      expect(href).toMatch(/\?tab=(partner|volunteer)$/);
    }
  });
});

describe("the pages the sidebar links to are real files", () => {
  it("has a page.tsx for /admin/volunteer-roles", () => {
    // The specific link that was wrong: `/admin/content/volunteer-roles`.
    expect(existsSync(join(ADMIN_DIR, "volunteer-roles", "page.tsx"))).toBe(true);
  });

  it("has no /admin/content/volunteer-roles", () => {
    expect(existsSync(join(ADMIN_DIR, "content", "volunteer-roles"))).toBe(false);
  });
});
