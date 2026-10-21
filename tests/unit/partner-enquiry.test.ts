import { describe, expect, it } from "vitest";

import {
  INTENDED_PROGRAMMES,
  MIN_PARTNER_MESSAGE_LENGTH,
  PARTNERSHIP_TYPES,
  PARTNER_ORGANISATION_TYPES,
  partnerEnquirySchema,
  partnerReference,
} from "@/lib/partner/enquiry";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * ## What these pin
 *
 * The partner form writes institutional contact details to `partner_enquiries`.
 * The schema is the boundary: the server accepts exactly what it declares, so
 * these tests fix the required fields, the closed lists, and the message floor.
 */

const valid = {
  organisation: "Example Foundation",
  contactName: "Wanjiru Kamau",
  email: "partnerships@example.org",
  phone: "",
  contactRole: "",
  organisationType: "foundation" as const,
  partnershipType: "funding" as const,
  intendedAmount: "",
  intendedProgramme: "",
  message:
    "We fund girls' education in East Africa and are looking for a Nairobi partner for a multi-year cohort.",
};

describe("partnerEnquirySchema — required fields", () => {
  it("accepts a complete enquiry", () => {
    expect(partnerEnquirySchema.safeParse(valid).success).toBe(true);
  });

  it.each(["organisation", "contactName", "email", "organisationType", "partnershipType", "message"])(
    "requires %s",
    (field) => {
      const result = partnerEnquirySchema.safeParse({ ...valid, [field]: "" });
      expect(result.success).toBe(false);
    },
  );

  it("requires a valid email", () => {
    expect(partnerEnquirySchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it(`requires a message of at least ${MIN_PARTNER_MESSAGE_LENGTH} characters`, () => {
    const short = "x".repeat(MIN_PARTNER_MESSAGE_LENGTH - 1);
    expect(partnerEnquirySchema.safeParse({ ...valid, message: short }).success).toBe(false);
    expect(
      partnerEnquirySchema.safeParse({
        ...valid,
        message: "x".repeat(MIN_PARTNER_MESSAGE_LENGTH),
      }).success,
    ).toBe(true);
  });
});

describe("partnerEnquirySchema — closed lists", () => {
  it("accepts only the declared organisation types", () => {
    for (const value of PARTNER_ORGANISATION_TYPES) {
      expect(partnerEnquirySchema.safeParse({ ...valid, organisationType: value }).success).toBe(true);
    }
    expect(partnerEnquirySchema.safeParse({ ...valid, organisationType: "charity" }).success).toBe(false);
  });

  it("accepts only the partnership types the database CHECK allows", () => {
    // Must match `partner_enquiries.partnership_type` (migration 0007). A value
    // outside that list would pass here and fail at the database.
    expect([...PARTNERSHIP_TYPES].sort()).toEqual(["funding", "other", "programme", "technical"]);
    expect(partnerEnquirySchema.safeParse({ ...valid, partnershipType: "volunteer" }).success).toBe(false);
  });

  it("accepts a programme of interest only from the list, or none", () => {
    expect(partnerEnquirySchema.safeParse({ ...valid, intendedProgramme: "" }).success).toBe(true);
    for (const name of INTENDED_PROGRAMMES) {
      expect(partnerEnquirySchema.safeParse({ ...valid, intendedProgramme: name }).success).toBe(true);
    }
    expect(partnerEnquirySchema.safeParse({ ...valid, intendedProgramme: "Something else" }).success).toBe(false);
  });
});

describe("partnerEnquirySchema — optional fields", () => {
  it("accepts an overseas phone number with a country code", () => {
    expect(partnerEnquirySchema.safeParse({ ...valid, phone: "+44 20 7946 0000" }).success).toBe(true);
  });

  it("rejects a phone number containing letters", () => {
    expect(partnerEnquirySchema.safeParse({ ...valid, phone: "call-me-maybe" }).success).toBe(false);
  });

  it("accepts an intended amount as free text, such as a range", () => {
    expect(partnerEnquirySchema.safeParse({ ...valid, intendedAmount: "KES 1–2 million" }).success).toBe(true);
  });
});

describe("partnerReference", () => {
  it("is prefixed so it is identifiable in the inbox", () => {
    expect(partnerReference()).toMatch(/^ptn_/);
  });

  it("is unique across calls", () => {
    const refs = new Set(Array.from({ length: 50 }, () => partnerReference()));
    expect(refs.size).toBe(50);
  });
});
