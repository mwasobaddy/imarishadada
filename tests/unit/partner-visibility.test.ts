import { describe, expect, it } from "vitest";

import { activationBlocker } from "@/lib/partner/visibility";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * ## The rule this file exists for
 *
 * An organisation's name and logo must not be shown until it has given written
 * permission, and a test partner must never be shown at all. Before migration
 * 0027 the anonymous API served any row with `active = true`, whatever its test
 * flag or permission. These tests pin the rule the editor shows and the database
 * enforces.
 */

describe("activationBlocker", () => {
  it("never blocks an inactive partner", () => {
    expect(
      activationBlocker({ active: false, is_test: true, permission_confirmed_at: null }),
    ).toBeNull();
  });

  it("blocks an active partner with no written permission", () => {
    const reason = activationBlocker({ active: true, is_test: false, permission_confirmed_at: null });
    expect(reason).toMatch(/written permission/i);
  });

  it("treats an undefined permission the same as none", () => {
    expect(
      activationBlocker({ active: true, is_test: false, permission_confirmed_at: undefined }),
    ).not.toBeNull();
  });

  it("blocks an active test partner even when permission is recorded", () => {
    const reason = activationBlocker({
      active: true,
      is_test: true,
      permission_confirmed_at: "2026-10-21T00:00:00Z",
    });
    expect(reason).toMatch(/test partner/i);
  });

  it("allows an active partner that is not a test and has permission", () => {
    expect(
      activationBlocker({
        active: true,
        is_test: false,
        permission_confirmed_at: "2026-10-21T00:00:00Z",
      }),
    ).toBeNull();
  });
});
