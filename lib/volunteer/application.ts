import { z } from "zod";

/**
 * Volunteer application validation.
 *
 * Mirrors `lib/contact/enquiry.ts`: defined once, run on the client for the
 * applicant's sake and on the server as the actual boundary. The client copy is
 * an optimisation; the server copy is the one that cannot be bypassed.
 *
 * ## What this schema deliberately does NOT collect
 *
 * The roadmap: *"Do not collect date of birth, national ID, or a national
 * identification number at application stage. We do not need it, and collecting
 * identity data from unvetted applicants is itself a safeguarding problem."*
 *
 * There is no field for any of them, and `tests/unit/volunteer-application.test.ts`
 * asserts that — because adding one later would look like a reasonable diff.
 * Identity is collected during screening, through a controlled process.
 */

/** The site's published locales. A volunteer's languages are these codes. */
export const VOLUNTEER_LANGUAGES = ["en", "sw", "fr", "de", "pt"] as const;
export type VolunteerLanguage = (typeof VOLUNTEER_LANGUAGES)[number];

export const LANGUAGE_LABEL: Record<VolunteerLanguage, string> = {
  en: "English",
  sw: "Kiswahili",
  fr: "French",
  de: "German",
  pt: "Portuguese",
};

/**
 * How often an applicant can commit.
 *
 * The roadmap lists weekly / fortnightly / monthly / remote / flexible. `remote`
 * sits alongside the cadences rather than inside them because it answers a
 * different question — where, not how often — and applicants answer it anyway.
 */
export const VOLUNTEER_AVAILABILITY = [
  "weekly",
  "fortnightly",
  "monthly",
  "remote",
  "flexible",
] as const;
export type VolunteerAvailability = (typeof VOLUNTEER_AVAILABILITY)[number];

export const AVAILABILITY_LABEL: Record<VolunteerAvailability, string> = {
  weekly: "About once a week",
  fortnightly: "About once a fortnight",
  monthly: "About once a month",
  remote: "Remotely, from anywhere",
  flexible: "It varies — let us discuss",
};

export const MIN_MOTIVATION_LENGTH = 50;
export const MAX_MOTIVATION_LENGTH = 5000;
export const MAX_SKILLS_LENGTH = 2000;

/**
 * Reuse the phone rules already proven in the donation and contact flows, so a
 * Kenyan number is validated identically everywhere on the site.
 */
const kenyanPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine((v) => /^(0[17]\d{8}|\+?254[17]\d{8})$/.test(v), {
    message: "Enter a Kenyan mobile number, for example 0712 345 678.",
  });

export const volunteerApplicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tell us your name.")
    .max(120, "That name is too long."),

  email: z
    .string()
    .trim()
    .min(1, "Enter your email address so we can reply.")
    .max(254)
    .email("Enter an email address we can reply to, for example you@example.org."),

  phone: kenyanPhone,

  /**
   * Optional, and it has to be.
   *
   * The roadmap marks "role interested in" as required, but that assumes roles
   * are advertised. `volunteer_roles` is empty, and the page explicitly invites
   * people to apply before a role exists — "apply and say what you can offer
   * rather than waiting for a role to be advertised". A required select with no
   * options is an unusable form.
   */
  roleId: z.string().uuid().nullable().optional(),

  availability: z.enum(VOLUNTEER_AVAILABILITY, {
    message: "Choose roughly how much time you can give.",
  }),

  languages: z.array(z.enum(VOLUNTEER_LANGUAGES)).default([]),

  skillsDetail: z
    .string()
    .trim()
    .max(MAX_SKILLS_LENGTH, `Please keep this under ${MAX_SKILLS_LENGTH} characters.`)
    .optional()
    .or(z.literal("")),

  motivation: z
    .string()
    .trim()
    .min(
      MIN_MOTIVATION_LENGTH,
      `Please write at least ${MIN_MOTIVATION_LENGTH} characters. We ask because the answer tells us more than anything else on this form.`,
    )
    .max(
      MAX_MOTIVATION_LENGTH,
      `That is too long. Please keep it under ${MAX_MOTIVATION_LENGTH} characters.`,
    ),
});

export type VolunteerApplicationInput = z.input<typeof volunteerApplicationSchema>;
export type ParsedVolunteerApplication = z.output<typeof volunteerApplicationSchema>;

/** Field-keyed errors, for inline display. Same shape as the contact form. */
export function applicationFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Application reference, quoted back to the applicant and used in the inbox. */
export function volunteerReference(): string {
  const stamp = Date.now().toString(36);
  return `vol_${stamp}_${crypto.randomUUID().slice(0, 8)}`;
}
