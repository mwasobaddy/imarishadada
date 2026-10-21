import { describe, expect, it } from "vitest";

import {
  canApprove,
  isNewestWaiting,
  mayApprove,
  type StagedChange,
} from "@/lib/admin/settings-approval";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers
 * suite execution until the project is feature-complete.
 *
 * ## What this pins
 *
 * A staged financial setting is meant to need two people. The rules are small
 * and easy to break by accident, and each one that breaks lets a change
 * through without the second pair of eyes:
 *
 *   1. A change can only be decided once.
 *   2. The person who staged a change cannot approve it.
 *   3. Only the newest waiting change for a setting can be approved.
 *
 * They are stated here as pure rules so they can be reasoned about without a
 * database, and the action uses the same three conditions.
 */

describe("a staged setting change", () => {
  const staged: StagedChange = {
    id: "v1",
    key: "payment_rails",
    status: "pending",
    changed_by: "staff-a",
    changed_at: "2026-10-21T10:00:00Z",
  };

  it("can be approved while it is waiting", () => {
    expect(canApprove(staged)).toBe(true);
  });

  it("cannot be approved once it has been decided", () => {
    for (const status of ["approved", "rejected", "superseded"] as const) {
      expect(canApprove({ ...staged, status })).toBe(false);
    }
  });

  it("cannot be approved by the person who staged it", () => {
    expect(mayApprove(staged, "staff-a")).toBe(false);
  });

  it("can be approved by somebody else", () => {
    expect(mayApprove(staged, "staff-b")).toBe(true);
  });

  it("needs a signed-in staff member either way", () => {
    expect(mayApprove(staged, null)).toBe(false);
  });

  it("can be approved by anyone when nobody is recorded as staging it", () => {
    // The auto-versioned history rows carry no author. They are never pending,
    // but if one ever were, the permission is the only gate.
    expect(mayApprove({ ...staged, changed_by: null }, "staff-b")).toBe(true);
  });

  it("is not the one waiting when a newer change is queued", () => {
    const newer: StagedChange = {
      ...staged,
      id: "v2",
      changed_by: "staff-b",
      changed_at: "2026-10-21T11:00:00Z",
    };
    expect(isNewestWaiting(staged, [staged, newer])).toBe(false);
    expect(isNewestWaiting(newer, [staged, newer])).toBe(true);
  });

  it("ignores a newer change to a different setting", () => {
    const other: StagedChange = {
      ...staged,
      id: "v3",
      key: "bank_details",
      changed_at: "2026-10-21T11:00:00Z",
    };
    expect(isNewestWaiting(staged, [staged, other])).toBe(true);
  });

  it("ignores a decided change that is newer", () => {
    const decided: StagedChange = {
      ...staged,
      id: "v4",
      status: "approved",
      changed_at: "2026-10-21T11:00:00Z",
    };
    expect(isNewestWaiting(staged, [staged, decided])).toBe(true);
  });
});
