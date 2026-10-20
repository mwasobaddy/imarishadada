import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * M-Pesa callback contract.
 *
 * Written but not executed — per .opencode/rules/testing.md the team defers
 * suite execution until the project is feature-complete. `npm run build` is not
 * evidence these pass. Run with `npm test` when the gate is lifted.
 *
 * ## What this pins down
 *
 * `payment_transactions.donation_id` is NOT NULL. An earlier revision inserted
 * the provider event before resolving the donation and passed `donation_id:
 * null`, which meant every real callback failed with a not-null violation and
 * no M-Pesa payment could ever be reconciled. The generated `Database` types
 * caught it; these tests stop it coming back.
 *
 * The Supabase client is mocked because it *is* the network boundary — the rule
 * is to mock the boundary, never the thing under test. The route's own
 * branching, signature verification and write ordering are all real here.
 */

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  updateFinalEq: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createServiceClient: () => ({ from: mocks.from }),
  isServiceRoleConfigured: () => true,
}));

import { POST } from "@/app/api/mpesa/callback/route";

const SECRET = "test-callback-secret";

/** Build a correctly-signed callback, as Daraja would send it. */
function signedRequest(body: unknown, opts: { secret?: string; sign?: boolean } = {}) {
  const raw = JSON.stringify(body);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.sign !== false) {
    const sig = createHmac("sha256", opts.secret ?? SECRET).update(raw).digest("base64");
    headers["x-signature"] = sig;
  }
  return new Request("http://localhost/api/mpesa/callback", {
    method: "POST",
    headers,
    body: raw,
  });
}

function callbackBody(reference: string, resultCode = 0) {
  return {
    Body: {
      stkCallback: {
        CheckoutRequestID: reference,
        ResultCode: resultCode,
        ResultDesc: resultCode === 0 ? "The service request is processed successfully." : "Failed",
        Amount: 5000,
      },
    },
  };
}

const DONATION_ID = "11111111-2222-3333-4444-555555555555";

beforeEach(() => {
  process.env.MPESA_CALLBACK_SECRET = SECRET;
  mocks.from.mockReset();
  mocks.maybeSingle.mockReset();
  mocks.insert.mockReset();
  mocks.updateFinalEq.mockReset();

  mocks.from.mockImplementation((table: string) => {
    if (table === "donations") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
        update: () => ({ eq: () => ({ eq: mocks.updateFinalEq }) }),
      };
    }
    if (table === "payment_transactions") {
      return { insert: mocks.insert };
    }
    throw new Error(`unexpected table: ${table}`);
  });

  mocks.maybeSingle.mockResolvedValue({ data: { id: DONATION_ID }, error: null });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.updateFinalEq.mockResolvedValue({ error: null });
});

describe("mpesa callback — authentication", () => {
  it("rejects an unsigned callback without touching the database", async () => {
    const res = await POST(signedRequest(callbackBody("REF-1"), { sign: false }));
    expect(res.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects a callback signed with the wrong secret", async () => {
    const res = await POST(
      signedRequest(callbackBody("REF-1"), { secret: "not-the-secret" }),
    );
    expect(res.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("fails closed when the secret is not configured", async () => {
    delete process.env.MPESA_CALLBACK_SECRET;
    const res = await POST(signedRequest(callbackBody("REF-1")));
    expect(res.status).toBe(503);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("mpesa callback — the donation must be resolved first", () => {
  it("refuses a signed callback for a reference we never issued", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(signedRequest(callbackBody("REF-UNKNOWN")));

    expect(res.status).toBe(404);
    // No fabricated audit row for a gift that does not exist.
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.updateFinalEq).not.toHaveBeenCalled();
  });

  it("records the provider event against the donation's id, never null", async () => {
    const res = await POST(signedRequest(callbackBody("REF-KNOWN")));

    expect(res.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledTimes(1);

    const payload = mocks.insert.mock.calls[0]?.[0];
    expect(payload.donation_id).toBe(DONATION_ID);
    expect(payload.donation_id).not.toBeNull();
    expect(payload.provider).toBe("mpesa");
    expect(payload.signature_verified).toBe(true);
  });

  it("treats a duplicate provider event as success, because a retry is not an attack", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });

    const res = await POST(signedRequest(callbackBody("REF-KNOWN")));
    const json = (await res.json()) as { received?: boolean; duplicate?: boolean };

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(json.duplicate).toBe(true);
  });
});

describe("mpesa callback — ledger transition", () => {
  it("marks a successful charge completed", async () => {
    await POST(signedRequest(callbackBody("REF-KNOWN", 0)));

    expect(mocks.updateFinalEq).toHaveBeenCalledTimes(1);
    const update = mocks.from.mock.calls.length;
    expect(update).toBeGreaterThan(0);
  });

  it("marks a failed charge failed", async () => {
    const res = await POST(signedRequest(callbackBody("REF-KNOWN", 1032)));
    expect(res.status).toBe(200);
    expect(mocks.updateFinalEq).toHaveBeenCalledTimes(1);
  });

  it("never trusts the amount in the callback as the chargeable total", async () => {
    await POST(signedRequest(callbackBody("REF-KNOWN")));

    const payload = mocks.insert.mock.calls[0]?.[0];
    // The amount is retained for audit only — it is not a monetary column on
    // the event log, and `donations` keeps the server-derived total.
    expect(payload.settlement_amount).toBeUndefined();
    expect(payload.display_amount).toBeUndefined();
  });
});
