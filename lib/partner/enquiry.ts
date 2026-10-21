import { z } from "zod";

/**
 * Partner enquiry validation.
 *
 * Same shape as `lib/contact/enquiry.ts` and `lib/volunteer/application.ts`:
 * defined once, run on the client for the sender's sake and on the server as
 * the boundary that cannot be bypassed.
 *
 * The audience is institutional — a foundation, a company, a ministry — so the
 * fields are triage fields: who they are, what they are considering, and roughly
 * how much. Every one of them is something a partnerships lead needs before they
 * can reply, and none of them is personal data beyond a contact name.
 */

export const PARTNER_ORGANISATION_TYPES = [
  "foundation",
  "corporate",
  "government",
  "ngo",
  "individual",
  "other",
] as const;
export type PartnerOrganisationType = (typeof PARTNER_ORGANISATION_TYPES)[number];

export const PARTNER_ORGANISATION_LABEL: Record<PartnerOrganisationType, string> = {
  foundation: "Foundation",
  corporate: "Corporate",
  government: "Government",
  ngo: "NGO or charity",
  individual: "Individual",
  other: "Other",
};

/**
 * What they are considering. These map onto `partner_enquiries.partnership_type`,
 * whose CHECK constraint (migration 0007) allows exactly these values.
 */
export const PARTNERSHIP_TYPES = ["funding", "programme", "technical", "other"] as const;
export type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];

export const PARTNERSHIP_TYPE_LABEL: Record<PartnershipType, string> = {
  funding: "Funding a programme or cohort",
  programme: "Running or hosting a programme together",
  technical: "Technical help: training, legal, finance or data",
  other: "Something else",
};

/**
 * Programme names as shown to the public. Kept as a closed list so the inbox can
 * be filtered on it. These are identifiers, not copy: renaming a programme in the
 * database should also rename it here.
 */
export const INTENDED_PROGRAMMES = [
  "School Re-entry",
  "Economic Empowerment",
  "Dada Space",
  "Not sure yet",
] as const;

export const MIN_PARTNER_MESSAGE_LENGTH = 50;
export const MAX_PARTNER_MESSAGE_LENGTH = 5000;

/**
 * Partners are often outside Kenya, so the phone rule is deliberately loose: it
 * keeps out letters and obvious junk, and does not try to parse every national
 * format. The contact form's Kenyan rule would reject a valid overseas switchboard.
 */
const loosePhone = z
  .string()
  .trim()
  .max(24, "That number is too long.")
  .refine((v) => v === "" || /^\+?[0-9 ()-]{7,24}$/.test(v), {
    message: "Enter a phone number with digits, for example +254 708 694 088.",
  });

export const partnerEnquirySchema = z.object({
  organisation: z
    .string()
    .trim()
    .min(1, "Tell us the name of your organisation.")
    .max(160, "That name is too long."),

  contactName: z
    .string()
    .trim()
    .min(1, "Tell us your name.")
    .max(120, "That name is too long."),

  email: z
    .string()
    .trim()
    .min(1, "Enter an email address so we can reply.")
    .max(254)
    .email("Enter an email address we can reply to, for example you@example.org."),

  phone: loosePhone.optional().or(z.literal("")),

  contactRole: z.string().trim().max(120, "That is too long.").optional().or(z.literal("")),

  organisationType: z.enum(PARTNER_ORGANISATION_TYPES, {
    message: "Choose the type of organisation.",
  }),

  partnershipType: z.enum(PARTNERSHIP_TYPES, {
    message: "Choose what you are considering.",
  }),

  intendedAmount: z
    .string()
    .trim()
    .max(80, "Keep this under 80 characters, or leave it blank.")
    .optional()
    .or(z.literal("")),

  intendedProgramme: z
    .enum([...INTENDED_PROGRAMMES, ""] as [string, ...string[]])
    .optional(),

  message: z
    .string()
    .trim()
    .min(
      MIN_PARTNER_MESSAGE_LENGTH,
      `Please write at least ${MIN_PARTNER_MESSAGE_LENGTH} characters. Institutional partners need enough detail to know whether to reply.`,
    )
    .max(
      MAX_PARTNER_MESSAGE_LENGTH,
      `That is too long. Please keep it under ${MAX_PARTNER_MESSAGE_LENGTH} characters.`,
    ),
});

export type PartnerEnquiryInput = z.input<typeof partnerEnquirySchema>;
export type ParsedPartnerEnquiry = z.output<typeof partnerEnquirySchema>;

/** Field-keyed errors, first message per field, for inline display. */
export function partnerFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Enquiry reference, quoted back to the sender and used in the inbox. */
export function partnerReference(): string {
  const stamp = Date.now().toString(36);
  return `ptn_${stamp}_${crypto.randomUUID().slice(0, 8)}`;
}
