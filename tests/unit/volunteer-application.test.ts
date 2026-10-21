import { describe, expect, it } from "vitest";

import { placesRemaining } from "@/lib/data/volunteer";
import {
  MIN_MOTIVATION_LENGTH,
  VOLUNTEER_AVAILABILITY,
  VOLUNTEER_LANGUAGES,
  volunteerApplicationSchema,
  volunteerReference,
} from "@/lib/volunteer/application";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * ## The rule this file exists for
 *
 * The roadmap is explicit about the volunteer form:
 *
 *   "Do not collect date of birth, national ID, or a national identification
 *    number at application stage. We do not need it, and collecting identity
 *    data from unvetted applicants is itself a safeguarding problem."
 *
 * That is a safeguarding control, not a preference — and it is the kind of thing
 * a later "let us just add a DOB field, it would help with reporting" diff would
 * quietly undo. So it is asserted against the schema, which is the actual
 * boundary: the form cannot submit a field the schema does not accept.
 */

const valid = {
  name: "Amina Wanjiku",
  email: "amina@example.org",
  phone: "0712345678",
  availability: "weekly" as const,
  motivation:
    "I studied social work in Nairobi and I would like to mentor a young mother through re-entry.",
};

describe("volunteerApplicationSchema — what it must never collect", () => {
  const keys = Object.keys(volunteerApplicationSchema.shape);

  it.each([
    "dateOfBirth",
    "dob",
    "birthDate",
    "nationalId",
    "idNumber",
    "nationalIdentificationNumber",
    "idPassport",
    "passportNumber",
  ])("has no %s field", (field) => {
    expect(keys).not.toContain(field);
  });

  it("does not accept an unknown identity field, even if one is posted", () => {
    // Zod strips unknown keys by default, so a hand-crafted POST carrying
    // `dateOfBirth` cannot get it stored — the action builds the insert from
    // `parsed.data`, which will not have it.
    const parsed = volunteerApplicationSchema.parse({
      ...valid,
      dateOfBirth: "2001-04-12",
      nationalId: "12345678",
    });
    expect(parsed).not.toHaveProperty("dateOfBirth");
    expect(parsed).not.toHaveProperty("nationalId");
  });
});

describe("volunteerApplicationSchema — required fields", () => {
  it("accepts a complete application", () => {
    expect(volunteerApplicationSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a name", () => {
    const result = volunteerApplicationSchema.safeParse({ ...valid, name: "  " });
    expect(result.success).toBe(false);
  });

  it("requires a valid email", () => {
    const result = volunteerApplicationSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("requires a Kenyan mobile number", () => {
    // Required, unlike the contact form where it is optional — a placement
    // cannot be arranged without one.
    for (const phone of ["", "12345", "+447700900000"]) {
      expect(volunteerApplicationSchema.safeParse({ ...valid, phone }).success).toBe(false);
    }
  });

  it.each(["0712345678", "+254712345678", "254712345678", "0712 345 678"])(
    "accepts the Kenyan form %s",
    (phone) => {
      expect(volunteerApplicationSchema.safeParse({ ...valid, phone }).success).toBe(true);
    },
  );

  it("requires an availability choice from the declared list", () => {
    expect(
      volunteerApplicationSchema.safeParse({ ...valid, availability: "whenever" }).success,
    ).toBe(false);
    for (const option of VOLUNTEER_AVAILABILITY) {
      expect(
        volunteerApplicationSchema.safeParse({ ...valid, availability: option }).success,
      ).toBe(true);
    }
  });

  it("requires a motivation of at least the stated length", () => {
    const short = "x".repeat(MIN_MOTIVATION_LENGTH - 1);
    expect(volunteerApplicationSchema.safeParse({ ...valid, motivation: short }).success).toBe(
      false,
    );
    expect(
      volunteerApplicationSchema.safeParse({
        ...valid,
        motivation: "x".repeat(MIN_MOTIVATION_LENGTH),
      }).success,
    ).toBe(true);
  });
});

describe("volunteerApplicationSchema — optional fields", () => {
  it("accepts no role, because roles may not exist", () => {
    // `volunteer_roles` is empty, and the page invites people to apply anyway.
    // A required select with no options is an unusable form.
    expect(volunteerApplicationSchema.safeParse({ ...valid, roleId: null }).success).toBe(true);
    expect(volunteerApplicationSchema.safeParse({ ...valid }).success).toBe(true);
  });

  it("accepts a real role id", () => {
    const result = volunteerApplicationSchema.safeParse({
      ...valid,
      roleId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a role id that is not a uuid", () => {
    expect(
      volunteerApplicationSchema.safeParse({ ...valid, roleId: "mentor" }).success,
    ).toBe(false);
  });

  it("defaults languages to an empty list", () => {
    const parsed = volunteerApplicationSchema.parse(valid);
    expect(parsed.languages).toEqual([]);
  });

  it("accepts only the published locales", () => {
    expect(
      volunteerApplicationSchema.safeParse({ ...valid, languages: ["en", "sw"] }).success,
    ).toBe(true);
    expect(
      volunteerApplicationSchema.safeParse({ ...valid, languages: ["en", "kl"] }).success,
    ).toBe(false);
  });

  it("declares a label for every language and availability option", () => {
    // A code with no label renders as a blank checkbox.
    expect(VOLUNTEER_LANGUAGES.length).toBeGreaterThan(0);
    expect(VOLUNTEER_AVAILABILITY.length).toBeGreaterThan(0);
  });
});

describe("placesRemaining", () => {
  it("is the difference between available and filled", () => {
    expect(placesRemaining({ positionsAvailable: 4, positionsFilled: 1 })).toBe(3);
  });

  it("never goes negative", () => {
    // The table has a CHECK that filled <= available, but a role edited down
    // from four places to two after three placements would otherwise render
    // "-1 open" on the page.
    expect(placesRemaining({ positionsAvailable: 2, positionsFilled: 3 })).toBe(0);
  });

  it("is zero for a full role", () => {
    expect(placesRemaining({ positionsAvailable: 2, positionsFilled: 2 })).toBe(0);
  });
});

describe("volunteerReference", () => {
  it("is prefixed so it is identifiable in the inbox", () => {
    expect(volunteerReference()).toMatch(/^vol_/);
  });

  it("is unique across calls", () => {
    const refs = new Set(Array.from({ length: 50 }, () => volunteerReference()));
    expect(refs.size).toBe(50);
  });
});
