/**
 * Money and phone logic for the donation flow.
 *
 * Everything here is pure and synchronous so it can be reasoned about in
 * isolation and tested without a DOM or a network. It is deliberately NOT a
 * React module — the same functions run in a Server Action, in the M-Pesa
 * callback route, and in the client preview.
 *
 * ## The one rule this file exists to enforce
 *
 * A donation amount is **never** trusted from the browser. The client posts a
 * `tierId`; `resolveDonation` looks the amount up in the tier list the caller
 * supplies (which came from `giving_tiers`) and returns what to charge. A
 * tampered POST that asks for a KSh 50,000 receipt while sending KSh 1 cannot
 * produce a matching receipt, because the receipt and the charge are derived
 * from the same server-side lookup.
 */

export type CurrencyCode = "KES" | "USD" | "GBP" | "EUR";

export type Cadence = "one_time" | "monthly";

export type PaymentRail = "mpesa" | "card" | "bank";

export type Tier = {
  /** Null only in development fallbacks that predate the database. */
  id: string | null;
  slug: string;
  amount: number;
  currency: string;
  cadence: Cadence;
  outcomeLabel: string;
  sortOrder: number;
};

/** Per-rail processing fee, in the charge currency. */
export type FeeSchedule = {
  /** Flat fee in minor units (cents/centimes) to keep money off floats. */
  flatMinor: number;
  /** Proportional component, e.g. 0.0295 for 2.95%. */
  percent: number;
};

export const FEE_SCHEDULE: Record<PaymentRail, FeeSchedule> = {
  // M-Pesa Daraja charges the merchant a fixed cedi-equivalent; KSh fees are
  // handled by the aggregator. Kept as a schedule so it is admin-editable, not
  // a magic number in a component.
  mpesa: { flatMinor: 0, percent: 0 },
  card: { flatMinor: 30, percent: 0.0295 },
  // Bank transfer has no processing fee; the donor may pay a sending charge.
  bank: { flatMinor: 0, percent: 0 },
};

/** Currencies we display. KES is the settlement currency for Kenyan donors. */
export const SUPPORTED_CURRENCIES: CurrencyCode[] = ["KES", "USD", "GBP", "EUR"];

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  KES: "en-KE",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
};

/** KES is the settlement currency; the others are converted for display. */
export const SETTLEMENT_CURRENCY: CurrencyCode = "KES";

/**
 * Fixed reference rates. In production these must come from a rates provider
 * with a timestamp — a stale rate on a donation page is a real financial
 * problem. These exist so the flow is exercisable before that is wired, and
 * they are deliberately round so tests can assert exact outputs.
 */
export const REFERENCE_RATES: Record<CurrencyCode, number> = {
  KES: 1,
  USD: 130,
  GBP: 165,
  EUR: 140,
};

/** Minimum charge per currency, in that currency's major units. */
export const MINIMUM_CHARGE: Record<CurrencyCode, number> = {
  KES: 50,
  USD: 1,
  GBP: 1,
  EUR: 1,
};

/**
 * Kenyan mobile numbers, normalised to `2547XXXXXXXX` (E.164 without `+`).
 *
 * Accepts the three forms a donor actually types:
 *   `07XXXXXXXX` · `+2547XXXXXXXX` · `2547XXXXXXXX`
 *
 * Returns null for anything else rather than guessing. A wrong phone number
 * means a push prompt that never arrives and a donor who believes they paid.
 */
export function normaliseKenyanPhone(input: string): string | null {
  if (typeof input !== "string") return null;

  // Strip spaces, dashes, parentheses — donors paste from all sorts of places.
  const digits = input.replace(/[\s\-()]/g, "");

  // Local Kenyan form: 07XXXXXXXX or 01XXXXXXXX (both are valid Safaricom/Airtel
  // prefixes; we accept any 07/01 + 8 digits).
  if (/^0[17]\d{8}$/.test(digits)) {
    return `254${digits.slice(1)}`;
  }

  // International with or without a plus.
  if (/^\+?254[17]\d{8}$/.test(digits)) {
    return digits.replace(/^\+/, "");
  }

  return null;
}

/** True when the string is a Kenyan mobile number we can push to. */
export function isValidKenyanPhone(input: string): boolean {
  return normaliseKenyanPhone(input) !== null;
}

/** A rough check that does not pretend to be RFC 5322 validation. */
export function isLikelyEmail(input: string): boolean {
  if (typeof input !== "string") return false;
  const trimmed = input.trim();
  if (trimmed.length > 254) return false;
  // One @, no spaces, something either side, and a dot in the domain.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/**
 * Convert an amount from the settlement currency into a display currency.
 * Rounds to whole major units — nobody donates 1.4 cents, and showing a
 * fractional amount invites questions we cannot answer on a phone screen.
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to) return Math.round(amount);
  const inSettlement = amount * REFERENCE_RATES[from];
  return Math.round(inSettlement / REFERENCE_RATES[to]);
}

/**
 * The processing fee for a charge, in the charge currency's major units.
 *
 * Rounded to 2dp and clamped at zero, so a small donation can never produce a
 * negative total.
 *
 * ## This is what the fee *would* be, not what the donor owes
 *
 * The card networks charge the organisation, not the donor. Whether the donor
 * is asked to cover it is a product decision, and it is made in
 * `resolveDonation` via `coverFee`. This function answers "how much is it"
 * so the UI can state a number before asking.
 */
export function calculateFee(
  amount: number,
  rail: PaymentRail,
): number {
  const schedule = FEE_SCHEDULE[rail];
  // flatMinor is denominated in the settlement currency's minor units, so the
  // flat component is identical in every currency. A rail that needs a
  // per-currency flat fee should get its own entry in FEE_SCHEDULE rather than
  // a rate lookup here.
  const flat = schedule.flatMinor / 100;
  const fee = amount * schedule.percent + flat;
  return Math.max(0, Math.round(fee * 100) / 100);
}

/** Amount plus fee. This is what actually leaves the donor's account. */
export function totalCharge(amount: number, rail: PaymentRail): number {
  return Math.round((amount + calculateFee(amount, rail)) * 100) / 100;
}

export type ResolvedDonation = {
  tier: Tier | null;
  /** Amount in the settlement currency (KES) — what the ledger records. */
  settlementAmount: number;
  /** Amount the donor is shown and charged, in their chosen currency. */
  displayAmount: number;
  currency: CurrencyCode;
  cadence: Cadence;
  outcomeLabel: string;
  /**
   * The processing fee **added to the donor's charge**.
   *
   * Zero when the donor declined to cover it. `total` is always
   * `displayAmount + fee`, so the ledger invariant holds either way.
   *
   * Note this is not "the fee the organisation paid" — the organisation pays
   * the network regardless. When `coverFee` is false the fee is absorbed
   * outside the donor's row rather than recorded as zero-cost.
   */
  fee: number;
  /** What actually leaves the donor's account. */
  total: number;
  /** Whether the donor agreed to cover the fee. Recorded so a receipt can say so. */
  coverFee: boolean;
};

export class DonationError extends Error {
  readonly code:
    | "unknown_tier"
    | "below_minimum"
    | "invalid_amount"
    | "invalid_currency"
    | "unsupported_tier";

  constructor(
    code: DonationError["code"],
    message: string,
  ) {
    super(message);
    this.name = "DonationError";
    this.code = code;
  }
}

/**
 * Derive an authoritative donation from a tier id (or a custom amount).
 *
 * This is the single place a charge is decided. Callers must pass tiers that
 * came from the database — never from the request body.
 *
 * ## `coverFee` is a donor choice, and it is server-validated like everything else
 *
 * The card networks charge the organisation, not the donor. Asking the donor to
 * cover it is a legitimate and common practice — Fundraise Up reports 92% of
 * donors agree when asked — but it must be an **asked** choice, and the flag
 * arrives from the browser, so it is treated as untrusted input like the amount.
 *
 * It cannot be used to underpay: it only ever *removes* the fee from the total.
 * A tampered POST that sends `coverFee: false` while the UI showed the fee
 * results in the donor being charged less, never a receipt for more than was
 * paid.
 *
 * @param customAmount Only used when `tierSlug` is `"custom"`. Rounded and
 *   validated against `MINIMUM_CHARGE`.
 * @param coverFee     Whether the donor agreed to cover the processing fee.
 *   Defaults to **false** — the safe direction. A caller that forgets to pass
 *   it under-charges the donor rather than adding a fee they did not agree to.
 */
export function resolveDonation({
  tiers,
  tierSlug,
  customAmount,
  currency = SETTLEMENT_CURRENCY,
  rail,
  coverFee = false,
}: {
  tiers: Tier[];
  tierSlug: string;
  customAmount?: number;
  currency?: CurrencyCode;
  rail: PaymentRail;
  coverFee?: boolean;
}): ResolvedDonation {
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new DonationError(
      "invalid_currency",
      `Unsupported currency: ${currency}`,
    );
  }

  let settlementAmount: number;
  let cadence: Cadence;
  let outcomeLabel: string;
  let tier: Tier | null = null;

  if (tierSlug === "custom") {
    if (
      typeof customAmount !== "number" ||
      !Number.isFinite(customAmount) ||
      customAmount <= 0
    ) {
      throw new DonationError(
        "invalid_amount",
        "A custom amount must be a positive number.",
      );
    }
    settlementAmount = Math.round(customAmount);
    cadence = "one_time";
    outcomeLabel = "Where it is needed most";
    if (settlementAmount < MINIMUM_CHARGE[SETTLEMENT_CURRENCY]) {
      throw new DonationError(
        "below_minimum",
        `The minimum donation is ${formatMoney(
          MINIMUM_CHARGE[SETTLEMENT_CURRENCY],
          SETTLEMENT_CURRENCY,
        )}.`,
      );
    }
  } else {
    tier = tiers.find((t) => t.slug === tierSlug) ?? null;
    if (!tier) {
      throw new DonationError(
        "unknown_tier",
        "That giving tier is not available.",
      );
    }
    if (tier.cadence !== "monthly" && tier.cadence !== "one_time") {
      throw new DonationError(
        "unsupported_tier",
        "That tier has an unsupported cadence.",
      );
    }
    settlementAmount = tier.amount;
    cadence = tier.cadence;
    outcomeLabel = tier.outcomeLabel;
  }

  const displayAmount = convertAmount(
    settlementAmount,
    SETTLEMENT_CURRENCY,
    currency,
  );

  // The fee is only added when the donor asked to cover it. Clamped at zero so
  // a rounding artefact can never produce a negative total.
  const fee = coverFee ? calculateFee(displayAmount, rail) : 0;
  const total = Math.round((displayAmount + fee) * 100) / 100;

  return {
    tier,
    settlementAmount,
    displayAmount,
    currency,
    cadence,
    outcomeLabel,
    fee,
    total,
    coverFee,
  };
}

/**
 * Format for display. Always shows the currency, never a bare number —
 * a donor reading "2,500" must never wonder which currency it is.
 */
export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  locale = CURRENCY_LOCALE[currency],
): string {
  const noDecimals = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(amount);
}

/**
 * Consent required for a recurring gift. Explicit, not implied by ticking
 * "monthly" — silent recurring charges are the fastest way to lose a
 * regulator and a reputation.
 */
export function requiresExplicitConsent(cadence: Cadence): boolean {
  return cadence === "monthly";
}

/**
 * Validation error codes.
 *
 * The validator returns a **code**, not a message. The message is chosen by
 * the UI, which is the only layer that knows the active locale.
 *
 * This module is deliberately free of any presentation concern: it is pure
 * logic, it runs on the server inside the donation action, and it is the
 * security boundary for the amount and the recurring-consent gate. Baking
 * English prose into it would mean every validation message a donor reads
 * would be permanently English, on a site whose primary market is
 * Swahili-speaking.
 *
 * The codes map to `errors.*` in the message catalogue.
 */
export type DonationErrorCode =
  | "emailInvalid"
  | "phoneInvalid"
  | "consentRequired";

export function validateDonorDetails(input: {
  email: string;
  name?: string;
  phone?: string;
  cadence: Cadence;
  consentRecurring: boolean;
  consentUpdates: boolean;
}): { valid: true } | { valid: false; errors: Record<string, DonationErrorCode> } {
  const errors: Record<string, DonationErrorCode> = {};

  if (!isLikelyEmail(input.email)) {
    errors.email = "emailInvalid";
  }

  if (input.phone && input.phone.trim() && !isValidKenyanPhone(input.phone)) {
    errors.phone = "phoneInvalid";
  }

  if (requiresExplicitConsent(input.cadence) && !input.consentRecurring) {
    errors.consentRecurring = "consentRequired";
  }

  return Object.keys(errors).length === 0
    ? { valid: true }
    : { valid: false, errors };
}
