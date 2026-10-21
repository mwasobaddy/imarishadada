import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers
 * suite execution until the project is feature-complete.
 *
 * ## Why this is a source-level test
 *
 * The audit trail is only worth anything if it is complete. It was not: twenty
 * six of the sixty-seven mutations in the admin panel wrote no row at all, and
 * nothing noticed, because a missing audit insert is not a type error and not
 * a failing test — it is just a quieter panel.
 *
 * So the rule is pinned here, in the only place that can see it: the source of
 * the actions themselves.
 */
const ACTIONS_DIR = join(process.cwd(), "app/[locale]/admin/actions");

/** Functions that read rather than write. */
const READERS = /^(get|list|export|load|read|search|check|has|is|can)/;

/** A function that changes something. */
function isMutation(name: string): boolean {
  return !READERS.test(name);
}

/** The body of an exported function, braces balanced. */
function functionBody(source: string, start: number): string {
  let depth = 0;
  let index = source.indexOf("{", start);
  for (; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return source.slice(start, index + 1);
}

describe("the audit trail covers every mutation", () => {
  const files = readdirSync(ACTIONS_DIR).filter((name) => name.endsWith(".ts"));

  it("finds the action files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)("%s records an audit row for every mutation", (file) => {
    const source = readFileSync(join(ACTIONS_DIR, file), "utf-8");

    const mutations: string[] = [];
    const pattern = /export async function (\w+)\(/g;
    let match = pattern.exec(source);

    while (match !== null) {
      const name = match[1];
      if (isMutation(name)) {
        const body = functionBody(source, match.index);
        if (!body.includes("recordAudit")) {
          mutations.push(name);
        }
      }
      match = pattern.exec(source);
    }

    expect(
      mutations,
      `${file} changes something without writing an audit row`,
    ).toEqual([]);
  });
});

describe("the audit helper records who made the change", () => {
  const helper = readFileSync(join(process.cwd(), "lib/admin/audit.ts"), "utf-8");

  it("writes the actor", () => {
    expect(helper).toContain("actor_id");
    expect(helper).toContain("actor_email");
  });

  it("does not swallow a failed write", () => {
    // A write that fails must be loud in the server log, even though the
    // change itself has already landed.
    expect(helper).toContain("console.error");
  });
});
