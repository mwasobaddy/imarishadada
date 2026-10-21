import { timingSafeEqual, createHmac } from "node:crypto";
import { NextResponse } from "next/server";

import { recordAudit } from "@/lib/admin/audit";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";

/**
 * M-Pesa Daraja callback.
 *
 * Built now even though Daraja approval has not landed, because the swap later
 * should be a credentials change, not a rewrite. The roadmap's own guidance:
 * "The callback route and the pending-donation table are built in Phase 1
 * regardless, so the swap is small."
 *
 * ## Three properties this route must hold
 *
 * 1. **Signature verification is mandatory.** An unsigned or wrongly-signed
 *    payload is rejected outright and nothing is written. Without this, anyone
 *    on the internet can mark a donation completed.
 *
 * 2. **It is idempotent.** Safaricom retries callbacks; the same event arriving
 *    twice must not double-charge or throw. A unique index on
 *    (provider, event, provider_ref) rejects the duplicate, and we treat that
 *    rejection as success — the donor already paid, and retrying is correct
 *    provider behaviour, not an attack.
 *
 * 3. **It never trusts the client.** The amount in the callback is recorded for
 *    audit but is NOT the source of truth for what was owed; `donations` already
 *    holds the server-derived amount from the Server Action.
 */

// No route segment config is declared here, deliberately.
//
// `cacheComponents: true` rejects both `export const dynamic` and
// `export const runtime`, and neither is needed: a route handler with a POST
// method is dynamic by construction and cannot be prerendered or cached, and
// nodejs is already the default runtime, so `node:crypto` for the HMAC
// comparison resolves to the Node build.

type CallbackBody = {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      Amount?: number;
      CallbackMetadata?: { ItemName?: string };
    };
  };
  // Daraja's own signature fields live outside Body in some versions.
  signature?: string;
};

/**
 * Compare two strings without leaking their contents through timing.
 *
 * `timingSafeEqual` throws on a length mismatch, which is itself a leak — an
 * attacker learns the expected length. Hashing first makes both operands a
 * fixed length so the comparison is always safe to perform.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "compare").update(a).digest();
  const hb = createHmac("sha256", "compare").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  const secret = process.env.MPESA_CALLBACK_SECRET;

  if (!secret) {
    // Fail closed. A missing secret means we cannot verify, and an unverifiable
    // callback must never be trusted.
    console.error("[mpesa/callback] MPESA_CALLBACK_SECRET is not set — rejecting");
    return NextResponse.json({ error: "callback not configured" }, { status: 503 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "service unavailable" }, { status: 503 });
  }

  const raw = await request.text();

  let signature = request.headers.get("x-signature") ?? "";
  let body: CallbackBody;
  try {
    body = JSON.parse(raw) as CallbackBody;
    // Fall back to the in-body signature if the header is absent.
    if (!signature && body.signature) signature = body.signature;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!verifySignature(raw, signature, secret)) {
    console.warn("[mpesa/callback] signature verification failed — rejecting");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const stk = body.Body?.stkCallback;
  const reference = stk?.CheckoutRequestID?.trim();

  if (!reference) {
    return NextResponse.json({ error: "missing CheckoutRequestID" }, { status: 400 });
  }

  const resultCode = stk?.ResultCode ?? 0;
  const succeeded = resultCode === 0;

  const supabase = createServiceClient();

  // Resolve the donation BEFORE recording the provider event.
  //
  // `payment_transactions.donation_id` is NOT NULL by design: the event log
  // exists to explain one specific gift, and an orphan row explains nothing.
  // Recording the event first "and linking it later" is therefore impossible
  // under this schema — an insert that tried would fail on every callback, so
  // no legitimate M-Pesa payment could ever be reconciled.
  const { data: donation, error: lookupError } = await supabase
    .from("donations")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();

  if (lookupError) {
    console.error("[mpesa/callback] donation lookup failed:", lookupError.message);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  if (!donation) {
    // A correctly-signed callback for a reference we never issued. Either a
    // replay from another environment or a payload that guessed the secret.
    // Either way there is no gift to reconcile, and writing an event row would
    // be a fabricated audit record.
    console.warn(`[mpesa/callback] no donation for reference ${reference}`);
    return NextResponse.json({ error: "unknown reference" }, { status: 404 });
  }

  // Record the provider event. A duplicate here is a provider retry, and the
  // unique index on (provider, event, provider_ref) makes the insert fail —
  // which is the idempotency guarantee.
  const { error: eventError } = await supabase.from("payment_transactions").insert({
    donation_id: donation.id,
    provider: "mpesa",
    provider_ref: reference,
    event: succeeded ? "stk_success" : `stk_failure_${resultCode}`,
    signature_verified: true,
    payload: body as unknown as Json,
  });

  if (eventError) {
    // 23505 = unique_violation. A retry of an event we already handled.
    if (eventError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[mpesa/callback] failed to record event:", eventError.message);
    return NextResponse.json({ error: "could not record event" }, { status: 500 });
  }

  // The provider event is the first half of the money trail. The audit trail
  // says a signed callback arrived, for which gift, and whether it succeeded.
  // The payload itself stays in `payment_transactions.payload`, where the
  // ledger's own rules keep it.
  await recordAudit({
    action: "create",
    tableName: "payment_transactions",
    rowId: donation.id,
    after: {
      provider: "mpesa",
      provider_ref: reference,
      event: succeeded ? "stk_success" : `stk_failure_${resultCode}`,
      signature_verified: true,
    },
    metadata: { actor: "M-Pesa" },
  });

  // Update the ledger. `eq("status", "pending")` means a callback arriving after
  // the row already completed is a no-op rather than a rewrite — the append-only
  // trigger would reject a monetary change anyway, but this avoids the error.
  const { error: updateError } = await supabase
    .from("donations")
    .update({
      status: succeeded ? "completed" : "failed",
      provider: "mpesa",
      completed_at: succeeded ? new Date().toISOString() : null,
      provider_payload: {
        resultCode,
        resultDesc: stk?.ResultDesc ?? null,
        // Recorded for audit only. The chargeable amount came from the Server
        // Action's derivation against giving_tiers, not from this field.
        reportedAmount: stk?.Amount ?? null,
      },
    })
    .eq("reference", reference)
    .eq("status", "pending");

  if (updateError) {
    console.error(
      `[mpesa/callback] CRITICAL: received result for ${reference} but ledger update failed:`,
      updateError.message,
    );
    return NextResponse.json({ error: "could not update donation" }, { status: 500 });
  }

  // The ledger is money. Every state change in it is in the audit trail, with
  // the amount and the reference and nothing that identifies the donor.
  await recordAudit({
    action: "update",
    tableName: "donations",
    rowId: donation.id,
    after: {
      reference,
      status: succeeded ? "completed" : "failed",
      provider: "mpesa",
    },
    metadata: { actor: "M-Pesa", result_code: resultCode },
  });

  return NextResponse.json({ received: true });
}

/**
 * Daraja signs the raw request body with the passkey/secret. The exact framing
 * differs between sandbox and production, so we accept either the standard
 * base64 HMAC-SHA256 of the raw body, or the same over a re-serialised object.
 *
 * Both are constant-time compared. A mismatch in either is a rejection.
 */
function verifySignature(raw: string, provided: string, secret: string): boolean {
  if (!provided) return false;

  const fromRaw = createHmac("sha256", secret).update(raw).digest("base64");
  if (safeEqual(provided, fromRaw)) return true;

  // Some Daraja deployments sign the parsed object rather than the raw text.
  try {
    const parsed = JSON.parse(raw) as CallbackBody;
    const canonical = JSON.stringify(parsed.Body?.stkCallback ?? parsed);
    const fromCanonical = createHmac("sha256", secret)
      .update(canonical)
      .digest("base64");
    if (safeEqual(provided, fromCanonical)) return true;
  } catch {
    // Raw was already validated as JSON above; this is belt and braces.
  }

  return false;
}
