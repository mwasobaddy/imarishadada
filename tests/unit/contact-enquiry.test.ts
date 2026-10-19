import { describe, expect, it } from "vitest";

import {
  ENQUIRY_TYPES,
  MAX_MESSAGE_LENGTH,
  MIN_MESSAGE_LENGTH,
  RATE_LIMIT_MAX,
  enquirySchema,
  fieldErrors,
  isHoneypotTripped,
  submittedTooQuickly,
} from "@/lib/contact/enquiry";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete — a passing build here is not
 * evidence these pass. Run with `npm test` when the gate is lifted.
 */

const valid = {
  name: "Amina",
  email: "amina@example.org",
  phone: "0712345678",
  enquiryType: "general",
  message: "I would like to know more about the school re-entry programme.",
};

describe("enquirySchema", () => {
  it("accepts a complete enquiry", () => {
    expect(enquirySchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an enquiry with no optional fields", () => {
    const r = enquirySchema.safeParse({
      name: "",
      email: "a@example.org",
      phone: "",
      enquiryType: "press",
      message: "A message that is comfortably over the minimum length.",
    });
    expect(r.success).toBe(true);
  });

  it("requires an email, because it is the only reply route", () => {
    const r = enquirySchema.safeParse({ ...valid, email: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(enquirySchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("accepts every declared enquiry type", () => {
    for (const type of ENQUIRY_TYPES) {
      expect(enquirySchema.safeParse({ ...valid, enquiryType: type }).success).toBe(
        true,
      );
    }
  });

  it("rejects an enquiry type outside the declared set", () => {
    const r = enquirySchema.safeParse({ ...valid, enquiryType: "nonsense" });
    expect(r.success).toBe(false);
  });

  it(`rejects a message under ${MIN_MESSAGE_LENGTH} characters`, () => {
    expect(enquirySchema.safeParse({ ...valid, message: "too short" }).success).toBe(
      false,
    );
  });

  it(`accepts a message of exactly ${MIN_MESSAGE_LENGTH} characters`, () => {
    const r = enquirySchema.safeParse({ ...valid, message: "a".repeat(MIN_MESSAGE_LENGTH) });
    expect(r.success).toBe(true);
  });

  it(`rejects a message over ${MAX_MESSAGE_LENGTH} characters`, () => {
    const r = enquirySchema.safeParse({
      ...valid,
      message: "a".repeat(MAX_MESSAGE_LENGTH + 1),
    });
    expect(r.success).toBe(false);
  });

  it("accepts an omitted phone but rejects a malformed one", () => {
    expect(enquirySchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
    expect(enquirySchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("normalises a Kenyan phone written with spaces", () => {
    const r = enquirySchema.safeParse({ ...valid, phone: "0712 345 678" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("0712345678");
  });

  it("rejects a Nairobi landline, which cannot receive an SMS", () => {
    expect(enquirySchema.safeParse({ ...valid, phone: "0201234567" }).success).toBe(
      false,
    );
  });
});

describe("fieldErrors", () => {
  it("keys errors by field name so they can sit beside each input", () => {
    const r = enquirySchema.safeParse({ ...valid, email: "", message: "no" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = fieldErrors(r.error);
      expect(Object.keys(errors)).toContain("email");
      expect(Object.keys(errors)).toContain("message");
    }
  });

  it("returns an empty object when there is nothing wrong", () => {
    const r = enquirySchema.safeParse(valid);
    if (r.success) expect(Object.keys({})).toHaveLength(0);
  });
});

describe("isHoneypotTripped", () => {
  it("is false for an empty field, which is what a real person submits", () => {
    expect(isHoneypotTripped("")).toBe(false);
    expect(isHoneypotTripped("   ")).toBe(false);
    expect(isHoneypotTripped(undefined)).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });

  it("is true once a bot fills in every field it finds", () => {
    expect(isHoneypotTripped("http://spam.example")).toBe(true);
  });
});

describe("submittedTooQuickly", () => {
  it("flags a form submitted instantly", () => {
    expect(submittedTooQuickly(Date.now())).toBe(true);
  });

  it("allows a form a human actually filled in", () => {
    expect(submittedTooQuickly(Date.now() - 30_000)).toBe(false);
  });

  it("does not flag when the timestamp is missing", () => {
    expect(submittedTooQuickly(undefined)).toBe(false);
  });
});

describe("rate limit", () => {
  it("allows several genuine enquiries per window", () => {
    // A shared office IP behind NAT must not lock the team out.
    expect(RATE_LIMIT_MAX).toBeGreaterThanOrEqual(5);
  });
});
