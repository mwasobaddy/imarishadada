import { describe, expect, it } from "vitest";

import {
  DonationError,
  MINIMUM_CHARGE,
  calculateFee,
  convertAmount,
  formatMoney,
  isLikelyEmail,
  isValidKenyanPhone,
  normaliseKenyanPhone,
  requiresExplicitConsent,
  resolveDonation,
  totalCharge,
  validateDonorDetails,
  type Tier,
} from "@/lib/donate/money";

/**
 * These are written but not executed. Per .opencode/rules/testing.md the team
 * defers suite execution until the project is feature-complete — do not read
 * a passing build here as evidence these pass. Run with `npm test` when the
 * gate is lifted.
 */

const TIERS: Tier[] = [
  {
    id: null,
    slug: "materials-one-term",
    amount: 500,
    currency: "KES",
    cadence: "one_time",
    outcomeLabel: "school materials for one girl for one term",
    sortOrder: 1,
  },
  {
    id: null,
    slug: "psychosocial-month",
    amount: 2500,
    currency: "KES",
    cadence: "monthly",
    outcomeLabel: "psychosocial support for one young mother",
    sortOrder: 2,
  },
  {
    id: null,
    slug: "re-entry-package",
    amount: 50000,
    currency: "KES",
    cadence: "one_time",
    outcomeLabel: "a full re-entry package for one girl",
    sortOrder: 3,
  },
];

describe("normaliseKenyanPhone", () => {
  it("normalises the local 07XXXXXXXX form to E.164", () => {
    expect(normaliseKenyanPhone("0712345678")).toBe("254712345678");
  });

  it("accepts 01XXXXXXXX as well", () => {
    expect(normaliseKenyanPhone("0123456789")).toBe("254123456789");
  });

  it("strips a leading plus", () => {
    expect(normaliseKenyanPhone("+254712345678")).toBe("254712345678");
  });

  it("accepts the bare country code", () => {
    expect(normaliseKenyanPhone("254712345678")).toBe("254712345678");
  });

  it("tolerates spaces and dashes, which donors paste in", () => {
    expect(normaliseKenyanPhone("0712 345 678")).toBe("254712345678");
    expect(normaliseKenyanPhone("0712-345-678")).toBe("254712345678");
    expect(normaliseKenyanPhone("+254 712 345 678")).toBe("254712345678");
  });

  it("returns null for a Kenyan landline rather than guessing", () => {
    // 020 is Nairobi landline; an STK push would never reach it.
    expect(normaliseKenyanPhone("0201234567")).toBeNull();
  });

  it("returns null for a short number", () => {
    expect(normaliseKenyanPhone("0712345")).toBeNull();
  });

  it("returns null for letters and empty input", () => {
    expect(normaliseKenyanPhone("not a phone")).toBeNull();
    expect(normaliseKenyanPhone("")).toBeNull();
  });

  it("does not accept a Kenyan number with too many digits", () => {
    expect(normaliseKenyanPhone("07123456789")).toBeNull();
  });
});

describe("isValidKenyanPhone", () => {
  it("mirrors normaliseKenyanPhone without exposing the value", () => {
    expect(isValidKenyanPhone("0712345678")).toBe(true);
    expect(isValidKenyanPhone("0201234567")).toBe(false);
  });
});

describe("isLikelyEmail", () => {
  it("accepts an ordinary address", () => {
    expect(isLikelyEmail("amina@example.org")).toBe(true);
  });

  it("rejects an address with no domain dot", () => {
    expect(isLikelyEmail("amina@example")).toBe(false);
  });

  it("rejects an address with a space", () => {
    expect(isLikelyEmail("amina@example.org ")).toBe(true); // trimmed
    expect(isLikelyEmail("amina smith@example.org")).toBe(false);
  });

  it("rejects two at-signs", () => {
    expect(isLikelyEmail("a@b@example.org")).toBe(false);
  });
});

describe("convertAmount", () => {
  it("is identity for the settlement currency", () => {
    expect(convertAmount(500, "KES", "KES")).toBe(500);
  });

  it("converts KES to USD using the reference rate", () => {
    // 50,000 KES at 130 KES/USD = 384.6, rounded to a whole unit.
    expect(convertAmount(50000, "KES", "USD")).toBe(385);
  });

  it("rounds to whole major units rather than exposing cents", () => {
    const usd = convertAmount(2500, "KES", "USD");
    expect(Number.isInteger(usd)).toBe(true);
  });
});

describe("calculateFee", () => {
  it("charges no M-Pesa fee", () => {
    expect(calculateFee(50000, "mpesa")).toBe(0);
  });

  it("charges no bank transfer fee", () => {
    expect(calculateFee(50000, "bank")).toBe(0);
  });

  it("charges the card percentage plus a flat component", () => {
    // 2.95% of 1,000 = 29.50, plus 0.30 flat = 29.80
    expect(calculateFee(1000, "card")).toBe(29.8);
  });

  it("never returns a negative fee on a tiny amount", () => {
    expect(calculateFee(1, "card")).toBeGreaterThanOrEqual(0);
  });
});

describe("totalCharge", () => {
  it("equals the amount when there is no fee", () => {
    expect(totalCharge(50000, "mpesa")).toBe(50000);
  });

  it("includes the card fee", () => {
    // 1000 + 29.80
    expect(totalCharge(1000, "card")).toBe(1029.8);
  });
});

describe("resolveDonation — server-side amount derivation", () => {
  it("derives the amount from the tier, ignoring any client-supplied figure", () => {
    const d = resolveDonation({
      tiers: TIERS,
      tierSlug: "re-entry-package",
      rail: "mpesa",
    });
    expect(d.settlementAmount).toBe(50000);
    expect(d.outcomeLabel).toBe("a full re-entry package for one girl");
  });

  it("cannot produce a receipt for a tier that does not exist", () => {
    // This is the tampered-POST case: the client asks for a free pass.
    expect(() =>
      resolveDonation({ tiers: TIERS, tierSlug: "free-money", rail: "mpesa" }),
    ).toThrow(DonationError);
  });

  it("carries the cadence through from the tier", () => {
    const d = resolveDonation({
      tiers: TIERS,
      tierSlug: "psychosocial-month",
      rail: "mpesa",
    });
    expect(d.cadence).toBe("monthly");
  });

  it("accepts a custom amount above the minimum", () => {
    const d = resolveDonation({
      tiers: TIERS,
      tierSlug: "custom",
      customAmount: 750,
      rail: "mpesa",
    });
    expect(d.settlementAmount).toBe(750);
    expect(d.tier).toBeNull();
  });

  it("rejects a custom amount below the minimum", () => {
    expect(() =>
      resolveDonation({
        tiers: TIERS,
        tierSlug: "custom",
        customAmount: 1,
        rail: "mpesa",
      }),
    ).toThrow(/minimum/i);
  });

  it("rejects a non-positive or non-finite custom amount", () => {
    for (const bad of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        resolveDonation({
          tiers: TIERS,
          tierSlug: "custom",
          customAmount: bad,
          rail: "mpesa",
        }),
      ).toThrow(DonationError);
    }
  });

  it("rounds a fractional custom amount to whole KES", () => {
    const d = resolveDonation({
      tiers: TIERS,
      tierSlug: "custom",
      customAmount: 750.6,
      rail: "mpesa",
    });
    expect(d.settlementAmount).toBe(751);
  });

  it("rejects an unsupported currency", () => {
    expect(() =>
      resolveDonation({
        tiers: TIERS,
        tierSlug: "materials-one-term",
        currency: "JPY" as never,
        rail: "mpesa",
      }),
    ).toThrow(/Unsupported currency/);
  });

  it("converts the display amount but still records settlement in KES", () => {
    const d = resolveDonation({
      tiers: TIERS,
      tierSlug: "re-entry-package",
      currency: "USD",
      rail: "card",
    });
    expect(d.settlementAmount).toBe(50000);
    expect(d.currency).toBe("USD");
    expect(d.displayAmount).toBe(385);
    expect(d.fee).toBeGreaterThan(0); // card rail has a fee
  });

  it("reports the minimum in the settlement currency", () => {
    expect(MINIMUM_CHARGE.KES).toBe(50);
  });
});

describe("formatMoney", () => {
  it("always includes the currency", () => {
    expect(formatMoney(500, "KES")).toMatch(/KES|KSh/);
  });

  it("shows no decimals for a whole amount", () => {
    expect(formatMoney(50000, "KES")).not.toMatch(/\./);
  });

  it("shows decimals when the amount is fractional, e.g. a card fee", () => {
    expect(formatMoney(29.8, "USD")).toMatch(/\d/);
  });
});

describe("requiresExplicitConsent", () => {
  it("is required for a monthly gift", () => {
    expect(requiresExplicitConsent("monthly")).toBe(true);
  });

  it("is not required for a one-time gift", () => {
    expect(requiresExplicitConsent("one_time")).toBe(false);
  });
});

describe("validateDonorDetails", () => {
  const base = {
    email: "amina@example.org",
    name: "Amina",
    phone: "",
    cadence: "one_time" as const,
    consentRecurring: false,
    consentUpdates: false,
  };

  it("accepts a minimal valid one-time donation", () => {
    expect(validateDonorDetails(base)).toEqual({ valid: true });
  });

  it("requires an email for the receipt", () => {
    const r = validateDonorDetails({ ...base, email: "" });
    expect(r.valid).toBe(false);
  });

  it("rejects a malformed phone but allows an omitted one", () => {
    expect(validateDonorDetails({ ...base, phone: "" }).valid).toBe(true);
    expect(validateDonorDetails({ ...base, phone: "0712345678" }).valid).toBe(
      true,
    );
    expect(validateDonorDetails({ ...base, phone: "12345" }).valid).toBe(false);
  });

  it("blocks a monthly gift without explicit recurring consent", () => {
    const r = validateDonorDetails({
      ...base,
      cadence: "monthly",
      consentRecurring: false,
    });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.errors.consentRecurring).toBeDefined();
  });

  it("accepts a monthly gift once consent is given", () => {
    expect(
      validateDonorDetails({
        ...base,
        cadence: "monthly",
        consentRecurring: true,
      }).valid,
    ).toBe(true);
  });
});
