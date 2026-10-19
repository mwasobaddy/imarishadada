import { z } from "zod";

/**
 * Contact enquiry validation.
 *
 * ## The rule this file enforces
 *
 * Validation is defined once and run in BOTH places. The spec is explicit:
 * "Validation | Zod, **server-side as well as client-side**". The client copy is
 * an optimisation for the donor's time; the server copy is the security
 * boundary, and it is the only one that cannot be bypassed by disabling
 * JavaScript or posting directly to the endpoint.
 *
 * `honeypot` and `startedAt` are anti-spam, not validation. See below.
 */

export const ENQUIRY_TYPES = [
  "general",
  "partnership",
  "volunteer",
  "press",
  "other",
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const MIN_MESSAGE_LENGTH = 20;
export const MAX_MESSAGE_LENGTH = 5000;

/**
 * Reuse the phone normalisation already proven in the donation flow, so a
 * Kenyan number typed on the contact form is validated by the same rules that
 * gate a M-Pesa push.
 */
const kenyanPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine((v) => v === "" || /^(0[17]\d{8}|\+?254[17]\d{8})$/.test(v), {
    message: "Enter a Kenyan mobile number, for example 0712 345 678.",
  });

export const enquirySchema = z.object({
  name: z.string().trim().max(120, "That name is too long.").optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address so we can reply.")
    .max(254)
    .email("Enter an email address we can reply to, for example you@example.org."),
  phone: kenyanPhone.optional().or(z.literal("")),
  enquiryType: z.enum(ENQUIRY_TYPES, {
    message: "Choose what your message is about.",
  }),
  message: z
    .string()
    .trim()
    .min(
      MIN_MESSAGE_LENGTH,
      `Please write at least ${MIN_MESSAGE_LENGTH} characters so we can help.`,
    )
    .max(
      MAX_MESSAGE_LENGTH,
      `That message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
    ),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type ParsedEnquiry = z.output<typeof enquirySchema>;

/** Field-keyed errors, for inline display against each input. */
export function fieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    // Keep the first message per field; it is the most specific.
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Honeypot.
 *
 * A real person never sees this field, so it stays empty. A bot fills every
 * input it finds. It is `aria-hidden` and off-screen, but NOT `display:none`,
 * because some bots skip hidden fields.
 */
export function isHoneypotTripped(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Time trap.
 *
 * A form completed in under two seconds was not typed. This is advisory rather
 * than a hard reject, so it never blocks a real donor who used autofill.
 */
export const MIN_SECONDS_BEFORE_SUBMIT = 2;

export function submittedTooQuickly(startedAt: number | undefined): boolean {
  if (!startedAt || Number.isNaN(startedAt)) return false;
  return Date.now() - startedAt < MIN_SECONDS_BEFORE_SUBMIT * 1000;
}

/**
 * Fixed-window rate limit.
 *
 * Five enquiries per hour per client. Generous enough that a legitimate person
 * filling the form twice, or a shared office IP behind NAT, is not locked out;
 * tight enough that a spam run is uneconomic.
 */
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MINUTES = 60;
