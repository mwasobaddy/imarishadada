"use server";

import { headers } from "next/headers";

import {
  checkRateLimit,
  clientHash,
  enquiryReference,
} from "@/lib/data/contact";
import {
  enquirySchema,
  fieldErrors,
  isHoneypotTripped,
  submittedTooQuickly,
} from "@/lib/contact/enquiry";
import { recordAudit } from "@/lib/admin/audit";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/client";

/**
 * Contact enquiry submission.
 *
 * Order of operations matters here:
 *
 *  1. Rate limit FIRST, before any parsing or database write. A spam run should
 *     cost as little as possible.
 *  2. Honeypot and time trap next, both of which return a *generic success*.
 *     A bot that learns it was detected learns how to avoid detection.
 *  3. Validate. This is the security boundary; the client copy is only a
 *     convenience for the sender.
 *  4. Write through the service role, because `enquiries` is default-deny.
 *
 * The response is never optimistic. Success is returned only after the row is
 * written, or after the write is knowingly skipped because the database is not
 * configured yet.
 */

export type SubmitEnquiryResult =
  | { status: "sent"; reference: string }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "rate_limited"; message: string }
  | { status: "failed"; message: string };

export async function submitEnquiry(input: {
  name: string;
  email: string;
  phone: string;
  enquiryType: string;
  message: string;
  /** Anti-spam. A real person never fills this. */
  website?: string;
  /** Timestamp when the form was rendered, for the time trap. */
  startedAt?: number;
}): Promise<SubmitEnquiryResult> {
  const requestHeaders = await headers();

  // ---- 1. Rate limit, before anything expensive ----------------------
  const limit = await checkRateLimit(requestHeaders);
  if (!limit.allowed) {
    return {
      status: "rate_limited",
      message: `You have sent a few messages already. Please try again in ${limit.retryAfterMinutes} minutes, or message us on WhatsApp.`,
    };
  }

  // ---- 2. Anti-spam ---------------------------------------------------
  if (isHoneypotTripped(input.website)) {
    // Silent success. Telling a bot it was caught is how bots get smarter.
    console.warn("[contact] honeypot tripped — dropping submission");
    return { status: "sent", reference: enquiryReference() };
  }

  if (submittedTooQuickly(input.startedAt)) {
    console.warn("[contact] submission under 2s — dropping");
    return { status: "sent", reference: enquiryReference() };
  }

  // ---- 3. Validate ----------------------------------------------------
  const parsed = enquirySchema.safeParse({
    name: input.name,
    email: input.email,
    phone: input.phone,
    enquiryType: input.enquiryType,
    message: input.message,
  });

  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrors(parsed.error) };
  }

  const reference = enquiryReference();

  // ---- 4. Persist -----------------------------------------------------
  if (!isServiceRoleConfigured()) {
    // Before the service key or the migrations exist there is no inbox to write
    // to. Do not pretend: say so, and point the sender at a channel that works.
    console.warn("[contact] service role not configured — enquiry not persisted");
    return {
      status: "failed",
      message:
        "We could not record your message just now. Please email or WhatsApp us instead and we will pick it up there.",
    };
  }

  const identifier = clientHash(requestHeaders) ?? "unknown";
  const data = parsed.data;

  const { data: row, error } = await createServiceClient()
    .from("enquiries")
    .insert({
      reference,
      name: data.name || null,
      email: data.email,
      phone: data.phone || null,
      enquiry_type: data.enquiryType,
      message: data.message,
      request_hash: identifier,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[contact] failed to record enquiry:", error.message);
    return {
      status: "failed",
      message:
        "Something went wrong on our side and your message was not sent. Please try again, or message us on WhatsApp.",
    };
  }

  // An enquiry is a person's message. The audit trail records that one
  // arrived, what kind it was and its reference — not the name, the email
  // address, the phone number or the message itself. Those stay in the
  // enquiries table, under its own access rules.
  await recordAudit({
    action: "create",
    tableName: "enquiries",
    rowId: row.id,
    after: { reference, enquiry_type: data.enquiryType },
    metadata: { actor: "contact form" },
  });

  return { status: "sent", reference };
}
