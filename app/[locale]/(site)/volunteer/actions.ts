"use server";

import { headers } from "next/headers";

import { checkRateLimit } from "@/lib/data/contact";
import { isHoneypotTripped, submittedTooQuickly } from "@/lib/contact/enquiry";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/client";
import {
  applicationFieldErrors,
  volunteerApplicationSchema,
  volunteerReference,
} from "@/lib/volunteer/application";

/**
 * Volunteer applications.
 *
 * ## This is the write path that did not exist
 *
 * `volunteer_applications` has had an inbox, status transitions
 * (`new → reviewing → accepted / declined / withdrawn`) and a dashboard count
 * since migration 0007. Nothing public ever wrote a row, so the inbox could not
 * fill and the whole triage surface was decorative.
 *
 * ## RLS stays closed
 *
 * `volunteer_applications` holds applicant PII and has RLS enabled with a
 * staff-read policy only — **no public insert**. That is correct, and it is why
 * this runs on the server with the service role rather than letting `anon`
 * insert: `.opencode/rules/backend.md` is explicit that writes to public tables
 * go through a Server Action or an Edge Function.
 *
 * The roadmap says "insert-only for public", which would mean an RLS policy for
 * `anon`. The project rule is the stricter of the two and it wins; the effect is
 * the same, because a Server Action is the only thing that can reach this table.
 *
 * ## Anti-spam is shared with the contact form
 *
 * Same honeypot, same time trap, same fixed-window limiter — on its own bucket,
 * so a busy volunteer applicant cannot lock a donor out of writing.
 */

export type SubmitApplicationResult =
  | { status: "sent"; reference: string }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "rate_limited"; message: string }
  | { status: "failed"; message: string };

export async function submitVolunteerApplication(input: {
  name: string;
  email: string;
  phone: string;
  roleId?: string | null;
  availability: string;
  languages: string[];
  skillsDetail?: string;
  motivation: string;
  /** Anti-spam. A real person never fills this. */
  website?: string;
  /** Timestamp when the form was rendered, for the time trap. */
  startedAt?: number;
}): Promise<SubmitApplicationResult> {
  const requestHeaders = await headers();

  // ---- 1. Rate limit, before anything expensive ----------------------
  const limit = await checkRateLimit(requestHeaders, "volunteer");
  if (!limit.allowed) {
    return {
      status: "rate_limited",
      message: `You have sent a few applications already. Please try again in ${limit.retryAfterMinutes} minutes, or message us on WhatsApp.`,
    };
  }

  // ---- 2. Anti-spam ---------------------------------------------------
  // Silent success in both cases. Telling a bot it was caught is how bots get
  // smarter.
  if (isHoneypotTripped(input.website)) {
    console.warn("[volunteer] honeypot tripped — dropping submission");
    return { status: "sent", reference: volunteerReference() };
  }

  if (submittedTooQuickly(input.startedAt)) {
    console.warn("[volunteer] submission under 2s — dropping");
    return { status: "sent", reference: volunteerReference() };
  }

  // ---- 3. Validate ----------------------------------------------------
  const parsed = volunteerApplicationSchema.safeParse({
    name: input.name,
    email: input.email,
    phone: input.phone,
    roleId: input.roleId || null,
    availability: input.availability,
    languages: input.languages,
    skillsDetail: input.skillsDetail ?? "",
    motivation: input.motivation,
  });

  if (!parsed.success) {
    return { status: "invalid", errors: applicationFieldErrors(parsed.error) };
  }

  const reference = volunteerReference();

  // ---- 4. Persist -----------------------------------------------------
  if (!isServiceRoleConfigured()) {
    // Before the service key exists there is no inbox to write to. Do not
    // pretend: say so, and point the applicant at a channel that works.
    console.warn("[volunteer] service role not configured — application not persisted");
    return {
      status: "failed",
      message:
        "We could not record your application just now. Please message us on WhatsApp instead and we will pick it up there.",
    };
  }

  const data = parsed.data;

  const { error } = await createServiceClient().from("volunteer_applications").insert({
    reference,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    role_id: data.roleId ?? null,
    motivation: data.motivation,
    // `skills` holds the languages offered; `skills_detail` holds the free text.
    // The mapping is recorded on the columns — see migration 0026.
    skills: data.languages,
    skills_detail: data.skillsDetail || null,
    availability: data.availability,
    // `request_hash` has no column on this table, so the client hash is not
    // stored. The rate limiter already holds it, keyed by bucket.
    status: "new",
  });

  if (error) {
    console.error("[volunteer] failed to record application:", error.message);
    return {
      status: "failed",
      message:
        "Something went wrong on our side and your application was not sent. Please try again, or message us on WhatsApp.",
    };
  }

  return { status: "sent", reference };
}
