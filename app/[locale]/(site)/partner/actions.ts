"use server";

import { headers } from "next/headers";

import { isHoneypotTripped, submittedTooQuickly } from "@/lib/contact/enquiry";
import { checkRateLimit } from "@/lib/data/contact";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/client";
import {
  partnerEnquirySchema,
  partnerFieldErrors,
  partnerReference,
} from "@/lib/partner/enquiry";

/**
 * Partner enquiries.
 *
 * `partner_enquiries` holds institutional contact details and has had an inbox
 * since migration 0007. No public code wrote to it, so the partner form could not
 * exist. Same arrangement as volunteer applications: RLS gives `anon` no insert,
 * and this Server Action writes with the service role.
 *
 * Anti-spam is shared with the contact and volunteer forms, on its own rate-limit
 * bucket, so a foundation's enquiry cannot lock a donor out of writing.
 */

export type SubmitPartnerResult =
  | { status: "sent"; reference: string }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "rate_limited"; message: string }
  | { status: "failed"; message: string };

export async function submitPartnerEnquiry(input: {
  organisation: string;
  contactName: string;
  email: string;
  phone?: string;
  contactRole?: string;
  organisationType: string;
  partnershipType: string;
  intendedAmount?: string;
  intendedProgramme?: string;
  message: string;
  /** Anti-spam. A real person never fills this. */
  website?: string;
  /** Timestamp when the form was rendered, for the time trap. */
  startedAt?: number;
}): Promise<SubmitPartnerResult> {
  const requestHeaders = await headers();

  // ---- 1. Rate limit, before anything expensive ----------------------
  const limit = await checkRateLimit(requestHeaders, "partner");
  if (!limit.allowed) {
    return {
      status: "rate_limited",
      message: `You have sent a few enquiries already. Please try again in ${limit.retryAfterMinutes} minutes, or message us on WhatsApp.`,
    };
  }

  // ---- 2. Anti-spam ---------------------------------------------------
  // Silent success in both cases, so a bot is not told it was caught.
  if (isHoneypotTripped(input.website)) {
    console.warn("[partner] honeypot tripped — dropping submission");
    return { status: "sent", reference: partnerReference() };
  }

  if (submittedTooQuickly(input.startedAt)) {
    console.warn("[partner] submission under 2s — dropping");
    return { status: "sent", reference: partnerReference() };
  }

  // ---- 3. Validate ----------------------------------------------------
  const parsed = partnerEnquirySchema.safeParse({
    organisation: input.organisation,
    contactName: input.contactName,
    email: input.email,
    phone: input.phone ?? "",
    contactRole: input.contactRole ?? "",
    organisationType: input.organisationType,
    partnershipType: input.partnershipType,
    intendedAmount: input.intendedAmount ?? "",
    intendedProgramme: input.intendedProgramme ?? "",
    message: input.message,
  });

  if (!parsed.success) {
    return { status: "invalid", errors: partnerFieldErrors(parsed.error) };
  }

  const reference = partnerReference();

  // ---- 4. Persist -----------------------------------------------------
  if (!isServiceRoleConfigured()) {
    console.warn("[partner] service role not configured — enquiry not persisted");
    return {
      status: "failed",
      message:
        "We could not record your enquiry just now. Please message us on WhatsApp instead and we will pick it up there.",
    };
  }

  const data = parsed.data;

  const { error } = await createServiceClient().from("partner_enquiries").insert({
    reference,
    organisation: data.organisation,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone || null,
    contact_role: data.contactRole || null,
    organisation_type: data.organisationType,
    partnership_type: data.partnershipType,
    intended_amount: data.intendedAmount || null,
    intended_programme: data.intendedProgramme || null,
    message: data.message,
    status: "new",
  });

  if (error) {
    console.error("[partner] failed to record enquiry:", error.message);
    return {
      status: "failed",
      message:
        "Something went wrong on our side and your enquiry was not sent. Please try again, or message us on WhatsApp.",
    };
  }

  return { status: "sent", reference };
}
