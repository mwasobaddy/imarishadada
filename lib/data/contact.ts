import { createHash } from "node:crypto";

import { cache } from "react";

import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/client";
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MINUTES,
  type EnquiryType,
} from "@/lib/contact/enquiry";

/**
 * Contact data layer.
 *
 * Contact details come from `settings`, never from components. The donate spec
 * states the same hard rule for payment details, and it applies with more force
 * here: a WhatsApp number hardcoded in four components is four places to forget
 * to update when the number changes.
 *
 * `contact_details` is excluded from the public RLS read policy (migration
 * 0003), so it reaches the browser through a Server Action rather than being
 * baked into a payload an attacker could read.
 */

export type ContactDetails = {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  whatsappPrefill: string;
  address: string | null;
  responseTime: string;
  officeHours: string | null;
};

export type EnquiryTypeOption = {
  value: EnquiryType;
  label: string;
};

const SEED_CONTACT: ContactDetails = {
  email: null,
  phone: "+254 708 694 088",
  whatsapp: "254708694088",
  whatsappPrefill:
    "Hello Imarisha Dada, I would like to find out more about your work.",
  address: "Kibera, Nairobi, Kenya",
  responseTime: "We reply within three working days.",
  officeHours: "Monday to Friday, 9am to 5pm EAT",
};

const SEED_TYPES: EnquiryTypeOption[] = [
  { value: "general", label: "General enquiry" },
  { value: "partnership", label: "Partnership" },
  { value: "volunteer", label: "Volunteering" },
  { value: "press", label: "Press" },
  { value: "other", label: "Something else" },
];

function mergeJson<T extends object>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  return { ...fallback, ...(value as Partial<T>) };
}

/**
 * Read a `settings` row through the service role.
 *
 * `settings` has a public policy for a safe subset, but `contact_details` is
 * deliberately not in it, so the anon client cannot read it. This runs on the
 * server only and its result is passed to a client component as props.
 */
async function readSetting<T extends object>(key: string, fallback: T): Promise<T> {
  if (!isServiceRoleConfigured()) return fallback;

  const { data, error } = await createServiceClient()
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return fallback;
  return mergeJson(data.value, fallback);
}

export const getContactDetails = cache(async (): Promise<ContactDetails> => {
  return readSetting<ContactDetails>("contact_details", SEED_CONTACT);
});

export const getEnquiryTypes = cache(async (): Promise<EnquiryTypeOption[]> => {
  if (!isServiceRoleConfigured()) return SEED_TYPES;

  const { data, error } = await createServiceClient()
    .from("settings")
    .select("value")
    .eq("key", "enquiry_types")
    .maybeSingle();

  if (error || !Array.isArray(data?.value)) return SEED_TYPES;
  return data.value as EnquiryTypeOption[];
});

/**
 * Stable, non-reversible client identifier for rate limiting.
 *
 * Hash of the forwarded IP plus the user agent. Hashing rather than storing the
 * raw address means the rate-limit table is not itself a store of visitor
 * identifiers — which matters for a site taking enquiries from a community
 * where a visitor's IP can be identifying.
 *
 * Returns null when no address is available, in which case the caller falls back
 * to a coarser bucket rather than disabling the limit entirely.
 */
export function clientHash(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? headers.get("x-real-ip");
  if (!ip) return null;

  const ua = headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${ip}|${ua}`)
    .digest("hex")
    .slice(0, 32);
}

export type RateLimitResult = { allowed: boolean; retryAfterMinutes: number };

/**
 * Fixed-window rate limit.
 *
 * Backed by a database table rather than an in-memory counter: a serverless
 * function's memory is not shared between instances, so an in-memory limiter
 * is effectively no limiter under load.
 */
export async function checkRateLimit(
  headers: Headers,
): Promise<RateLimitResult> {
  // Without a configured database there is nothing to limit against, and the
  // form is unusable in development if we hard-fail.
  if (!isServiceRoleConfigured()) return { allowed: true, retryAfterMinutes: 0 };

  const identifier = clientHash(headers);
  if (!identifier) return { allowed: true, retryAfterMinutes: 0 };

  const supabase = createServiceClient();
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const { count, error } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", "contact")
    .eq("identifier", identifier)
    .gte("created_at", windowStart);

  if (error) {
    // Fail open on a limiter error. A database blip must not stop a donor
    // reaching us; spam is a lesser harm than a blocked enquiry.
    console.error("[contact] rate limit check failed, failing open:", error.message);
    return { allowed: true, retryAfterMinutes: 0 };
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMinutes: RATE_LIMIT_WINDOW_MINUTES };
  }

  await supabase.from("rate_limits").insert({
    bucket: "contact",
    identifier,
  });

  return { allowed: true, retryAfterMinutes: 0 };
}

/** Enquiry reference, quoted back to the sender. */
export function enquiryReference(): string {
  const stamp = Date.now().toString(36);
  return `enq_${stamp}_${crypto.randomUUID().slice(0, 8)}`;
}
