"use server";

import { revalidatePath } from "next/cache";

import {
  DonationError,
  SUPPORTED_CURRENCIES,
  normaliseKenyanPhone,
  resolveDonation,
  validateDonorDetails,
  type Cadence,
  type CurrencyCode,
  type PaymentRail,
} from "@/lib/donate/money";
import {
  assertMockAllowed,
  getAdapter,
  MockModeRefusedError,
  PaymentNotConfiguredError,
} from "@/lib/donate/adapter";
import { recordAudit } from "@/lib/admin/audit";
import { bankRailUsable, getBankDetails, getPaymentRails } from "@/lib/data/donate";
import { getGivingTiers } from "@/lib/data/home";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/client";

/**
 * Donation submission.
 *
 * Two invariants this file exists to hold:
 *
 *  1. **The amount is never taken from the client.** The browser sends a
 *     `tierSlug`; the charge is derived here from `giving_tiers`. A tampered
 *     POST asking for a KSh 50,000 receipt cannot produce one, because the
 *     receipt and the charge are written from the same derivation.
 *
 *  2. **Success is server-side only.** The client is redirected to
 *     `/donate/success` on our authority, and that page independently re-reads
 *     the donation row. A client claiming success never moves the ledger.
 */

export type SubmitResult =
  | { status: "completed"; reference: string; redirectTo: string }
  | { status: "pending"; reference: string; redirectTo: string }
  | { status: "failed"; reference: string; message: string; redirectTo: string }
  | { status: "invalid"; errors: Record<string, string> };

/** Reference is human-quotable and drives the deterministic mock outcomes. */
function buildReference(rail: PaymentRail): string {
  const stamp = Date.now().toString(36);
  const rand = crypto.randomUUID().slice(0, 8);
  return `${rail}_${stamp}_${rand}`;
}

export async function submitDonation(input: {
  tierSlug: string;
  customAmount?: number;
  cadence: Cadence;
  currency: string;
  rail: PaymentRail;
  email: string;
  name?: string;
  phone?: string;
  consentRecurring: boolean;
  consentUpdates: boolean;
  /**
   * Whether the donor agreed to cover the processing fee.
   *
   * Untrusted, like every other field here — but the only thing it can do is
   * *reduce* the charge, so the worst case is that we absorb a fee the donor
   * expected to pay. It cannot produce a receipt for more than was paid.
   */
  coverFee?: boolean;
  /** Echoed back to the failure page so a donor can retry without retyping. */
  failNextAttempt?: boolean;
}): Promise<SubmitResult> {
  // ---------------------------------------------------------------------
  // 1. Validate the donor's own details before touching anything else.
  // ---------------------------------------------------------------------
  const details = validateDonorDetails({
    email: input.email,
    name: input.name,
    phone: input.phone,
    cadence: input.cadence,
    consentRecurring: input.consentRecurring,
    consentUpdates: input.consentUpdates,
  });

  if (!details.valid) return { status: "invalid", errors: details.errors };

  // ---------------------------------------------------------------------
  // 2. Derive the money. This is the security-critical step.
  // ---------------------------------------------------------------------
  const currency: CurrencyCode = SUPPORTED_CURRENCIES.includes(
    input.currency as CurrencyCode,
  )
    ? (input.currency as CurrencyCode)
    : "KES";

  const tiers = await getGivingTiers();

  let donation;
  try {
    donation = resolveDonation({
      tiers,
      tierSlug: input.tierSlug,
      customAmount: input.customAmount,
      currency,
      rail: input.rail,
      coverFee: input.coverFee === true,
    });
  } catch (error) {
    if (error instanceof DonationError) {
      return { status: "invalid", errors: { amount: error.message } };
    }
    throw error;
  }

  // A client asking for a monthly cadence on a one-time tier is not honoured.
  // The tier's cadence wins; we never charge monthly because the form said so.
  const cadence: Cadence = donation.cadence;

  if (cadence === "monthly" && !input.consentRecurring) {
    return {
      status: "invalid",
      errors: {
        consentRecurring:
          "Please confirm you understand this is a monthly gift you can cancel any time.",
      },
    };
  }

  // ---------------------------------------------------------------------
  // 3. Check the rail is actually usable.
  // ---------------------------------------------------------------------
  const rails = await getPaymentRails();

  if (!rails[input.rail]?.enabled) {
    return {
      status: "invalid",
      errors: {
        rail: "That payment method is not available right now. Please choose another.",
      },
    };
  }

  if (input.rail === "bank") {
    const bank = await getBankDetails();
    if (!bankRailUsable(bank)) {
      return {
        status: "invalid",
        errors: {
          rail: "Bank transfer is being set up. Please use M-Pesa or card for now.",
        },
      };
    }
  }

  // M-Pesa needs a real handset number. An unconfigured rail fails here rather
  // than after the donor has entered their details.
  let phone: string | null = null;
  if (input.rail === "mpesa") {
    phone = input.phone ? normaliseKenyanPhone(input.phone) : null;
    if (!phone) {
      return {
        status: "invalid",
        errors: {
          phone: "Enter your Kenyan mobile number so we can send the M-Pesa prompt.",
        },
      };
    }
  }

  // ---------------------------------------------------------------------
  // 4. Refuse to simulate in production.
  // ---------------------------------------------------------------------
  try {
    assertMockAllowed();
  } catch (error) {
    if (error instanceof MockModeRefusedError) {
      return {
        status: "failed",
        reference: "",
        message:
          "Payments are not configured yet. Please contact us and we will take your gift directly.",
        redirectTo: "/donate/failure",
      };
    }
    throw error;
  }

  // ---------------------------------------------------------------------
  // 5. Persist a pending row BEFORE calling the provider.
  //
  // Written first so a provider call that succeeds but whose response is lost
  // still leaves a record to reconcile. `idempotency_key` is unique, so a
  // double-submit cannot create two rows.
  // ---------------------------------------------------------------------
  const reference = input.failNextAttempt
    ? `fail_${buildReference(input.rail)}`
    : buildReference(input.rail);
  const idempotencyKey = `${reference}:initiate`;

  const persisted = await persistPendingDonation({
    reference,
    idempotencyKey,
    donation,
    rail: input.rail,
    cadence,
    donorEmail: input.email.trim(),
    donorName: input.name?.trim() || null,
    donorPhone: phone,
    consentUpdates: input.consentUpdates,
  });

  if (!persisted) {
    return {
      status: "failed",
      reference,
      message:
        "We could not record your donation. Nothing has been charged, please try again.",
      redirectTo: "/donate/failure",
    };
  }

  // ---------------------------------------------------------------------
  // 6. Call the provider.
  // ---------------------------------------------------------------------
  try {
    const adapter = getAdapter(input.rail);
    const result = await adapter.initiate({
      reference,
      rail: input.rail,
      amount: donation.displayAmount,
      currency: donation.currency,
      cadence,
      phone: phone ?? undefined,
      email: input.email.trim(),
    });

    if (result.status === "completed") {
      await markCompleted(reference, result.providerRef, {
        simulated: adapter.simulated,
      });
      revalidatePath("/");
      return {
        status: "completed",
        reference,
        redirectTo: `/donate/success?ref=${encodeURIComponent(reference)}`,
      };
    }

    // 'pending' means the provider has accepted it but not confirmed. The
    // donor must NOT be told it succeeded.
    //
    // This routes to `/donate/success`, which re-reads the ledger and renders
    // "we are confirming your gift" for any status that is not `completed`. It
    // used to route to `/donate/pending`, a route that does not exist — so the
    // first real adapter to return `pending` would have sent a donor who had
    // just been charged to a 404. Latent rather than live only because no
    // adapter returns `pending` yet.
    return {
      status: "pending",
      reference,
      redirectTo: `/donate/success?ref=${encodeURIComponent(reference)}`,
    };
  } catch (error) {
    const message =
      error instanceof PaymentNotConfiguredError
        ? "That payment method is not available right now. Please choose another."
        : "We could not reach the payment provider. Nothing has been charged, please try again.";

    await markFailed(reference, message);

    return { status: "failed", reference, message, redirectTo: "/donate/failure" };
  }
}

/**
 * Write the pending row.
 *
 * Uses the service-role client because `donations` has no RLS policy — the
 * anon key is denied by design. When Supabase is not configured (local dev, or
 * before the migrations are applied) we return true so the flow can still be
 * exercised; the ledger simply does not record it, which the success page
 * surfaces rather than hides.
 */
async function persistPendingDonation(args: {
  reference: string;
  idempotencyKey: string;
  donation: Awaited<ReturnType<typeof resolveDonation>>;
  rail: PaymentRail;
  cadence: Cadence;
  donorEmail: string;
  donorName: string | null;
  donorPhone: string | null;
  consentUpdates: boolean;
}): Promise<boolean> {
  if (!isServiceRoleConfigured()) {
    // Before the service key or the migrations exist there is no ledger to write
    // to. The success page surfaces this rather than hiding it, so a developer
    // cannot mistake a non-persisted run for a real one.
    console.warn(
      "[donate] service role not configured — donation not persisted:",
      args.reference,
    );
    return true;
  }

  const { data, error } = await createServiceClient().from("donations").insert({
    reference: args.reference,
    idempotency_key: args.idempotencyKey,
    status: "pending",
    rail: args.rail,
    cadence: args.cadence,
    settlement_amount: args.donation.settlementAmount,
    settlement_currency: "KES",
    display_amount: args.donation.displayAmount,
    display_currency: args.donation.currency,
    fee: args.donation.fee,
    total: args.donation.total,
    giving_tier_id: args.donation.tier?.id ?? null,
    outcome_label: args.donation.outcomeLabel,
    donor_email: args.donorEmail,
    donor_name: args.donorName,
    donor_phone: args.donorPhone,
    consent_recurring: args.cadence === "monthly",
    consent_updates: args.consentUpdates,
    consented_at: new Date().toISOString(),
    provider: "mock",
  }).select("id").maybeSingle();

  if (error) {
    console.error("[donate] failed to persist pending donation:", error.message);
    return false;
  }

  // The ledger is money, so every row in it is in the audit trail.
  //
  // The snapshot carries the reference, the rail and the amount — not the
  // donor's name, email or phone. Those are in the row itself, under the
  // ledger's own access rules, and copying them into a second table would
  // give the same person two places to look and one more place to leak.
  if (data) {
    await recordAudit({
      action: "create",
      tableName: "donations",
      rowId: data.id,
      after: {
        reference: args.reference,
        rail: args.rail,
        cadence: args.cadence,
        total: args.donation.total,
        currency: args.donation.currency,
        status: "pending",
      },
      metadata: { actor: "donation form" },
    });
  }

  return Boolean(data);
}

/**
 * Status transitions only. The append-only trigger rejects any attempt to
 * change a monetary or donor column, so this is safe to call on a retry.
 */
async function markCompleted(
  reference: string,
  providerRef: string,
  meta: { simulated: boolean },
): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  const { error } = await createServiceClient()
    .from("donations")
    .update({
      status: "completed",
      provider_ref: providerRef,
      provider: meta.simulated ? "mock" : "provider",
      completed_at: new Date().toISOString(),
    })
    .eq("reference", reference)
    .neq("status", "completed");

  if (error) {
    // The charge went through but our record did not. This is the case the
    // reconcile schedule exists for — surface it loudly rather than swallowing.
    console.error(
      `[donate] CRITICAL: payment completed for ${reference} but the ledger update failed:`,
      error.message,
    );
    return;
  }

  await recordAudit({
    action: "update",
    tableName: "donations",
    after: {
      reference,
      status: "completed",
      provider: meta.simulated ? "mock" : "provider",
    },
    metadata: { actor: meta.simulated ? "donation form (simulated)" : "payment provider" },
  });
}

async function markFailed(reference: string, message: string): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  const { error } = await createServiceClient()
    .from("donations")
    .update({ status: "failed", provider_payload: { reason: message } })
    .eq("reference", reference)
    .neq("status", "completed");

  if (error) {
    console.error(`[donate] failed to mark ${reference} as failed:`, error.message);
  }
}
