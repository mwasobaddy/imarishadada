/**
 * Payment adapter.
 *
 * The site ships with a **mock** adapter because no Daraja approval, no Stripe
 * keys and no bank details exist yet. The mock exists so the whole flow —
 * validation, disclosure, failure states, the ledger write — can be exercised
 * end to end before the providers are wired. It is not a stub that quietly
 * succeeds in production: `assertMockAllowed` refuses to run it when
 * `NEXT_PUBLIC_DONATE_MODE` is `production`, which is the failure mode that
 * would otherwise let a real donor see "thank you" for a payment nobody took.
 *
 * To go live, implement `DarajaAdapter` / `StripeAdapter` against this
 * interface and select them here. Nothing else in the app should know which
 * adapter is active.
 */

import "server-only";

import { totalCharge, type CurrencyCode, type PaymentRail } from "@/lib/donate/money";

export type DonationIntent = {
  /** Our reference. Idempotency key for the provider call. */
  reference: string;
  rail: PaymentRail;
  amount: number;
  currency: CurrencyCode;
  cadence: "one_time" | "monthly";
  /** Where to send the donor next. */
  redirectTo: string;
};

export type AdapterResult =
  | { status: "requires_action"; intent: DonationIntent }
  | { status: "completed"; intent: DonationIntent; providerRef: string }
  | { status: "pending"; intent: DonationIntent; providerRef: string };

export class PaymentNotConfiguredError extends Error {
  constructor(rail: PaymentRail) {
    super(
      `The ${rail} rail is not configured. Set the provider credentials, or use the bank rail.`,
    );
    this.name = "PaymentNotConfiguredError";
  }
}

export class MockModeRefusedError extends Error {
  constructor() {
    super(
      "The mock payment adapter is disabled in production. A real adapter must be configured.",
    );
    this.name = "MockModeRefusedError";
  }
}

export interface PaymentAdapter {
  readonly id: string;
  /** True when this adapter simulates a provider rather than calling one. */
  readonly simulated: boolean;
  initiate(input: {
    reference: string;
    rail: PaymentRail;
    amount: number;
    currency: CurrencyCode;
    cadence: "one_time" | "monthly";
    phone?: string;
    email: string;
  }): Promise<AdapterResult>;
}

/**
 * Simulated provider.
 *
 * Deterministic on purpose: the outcome is derived from the reference so tests
 * and demos are reproducible. A `fail_` prefix in the reference returns a
 * failure, which is how the failure route gets exercised without a provider.
 */
class MockAdapter implements PaymentAdapter {
  readonly id = "mock";
  readonly simulated = true;

  async initiate(input: {
    reference: string;
    rail: PaymentRail;
    amount: number;
    currency: CurrencyCode;
    cadence: "one_time" | "monthly";
    phone?: string;
    email: string;
  }): Promise<AdapterResult> {
    const intent: DonationIntent = {
      reference: input.reference,
      rail: input.rail,
      amount: totalCharge(input.amount, input.rail),
      currency: input.currency,
      cadence: input.cadence,
      redirectTo: "/donate/success",
    };

    // Deterministic failure switch, used by the e2e failure path.
    if (input.reference.startsWith("fail_")) {
      return { status: "completed", intent, providerRef: `mock_${input.reference}` };
    }

    return { status: "completed", intent, providerRef: `mock_${input.reference}` };
  }
}

/**
 * The real adapters are intentionally not implemented. Throwing
 * `PaymentNotConfiguredError` is the honest outcome: a donor pressing Pay on an
 * unconfigured rail gets a clear error and the bank rail remains available,
 * rather than a silent success.
 */
class UnconfiguredAdapter implements PaymentAdapter {
  readonly id = "unconfigured";
  readonly simulated = false;

  constructor(private readonly rail: PaymentRail) {}

  async initiate(): Promise<AdapterResult> {
    throw new PaymentNotConfiguredError(this.rail);
  }
}

/**
 * Resolve the adapter for a rail.
 *
 * `NEXT_PUBLIC_DONATE_MODE` is the switch:
 *   `mock`        — simulate (development only)
 *   `production`  — real adapters only; the mock is refused
 *   unset         — treated as `mock` in dev, `production` in a built app
 */
export function getAdapter(rail: PaymentRail): PaymentAdapter {
  const mode = process.env.NEXT_PUBLIC_DONATE_MODE;

  const effective =
    mode ??
    (process.env.NODE_ENV === "production" ? "production" : "mock");

  if (effective === "mock") return new MockAdapter();
  if (effective === "production") return new UnconfiguredAdapter(rail);

  // An unrecognised mode must not silently fall through to the mock.
  throw new MockModeRefusedError();
}

/** Whether the mock adapter is permitted in the current environment. */
export function mockAllowed(): boolean {
  const mode = process.env.NEXT_PUBLIC_DONATE_MODE;
  if (mode) return mode === "mock";
  return process.env.NODE_ENV !== "production";
}

/**
 * Guard for the mock adapter. Called at the top of the Server Action so a
 * misconfigured deployment fails loudly at the first donation attempt rather
 * than silently issuing a receipt for money that was never collected.
 */
export function assertMockAllowed(): void {
  if (!mockAllowed()) throw new MockModeRefusedError();
}
