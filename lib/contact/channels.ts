/**
 * Canonical contact channels.
 *
 * The WhatsApp number was previously hardcoded in four components. That is
 * exactly what the contact spec forbids for admin-editable detail, and it is
 * how a charity ends up with a dead number in its donation flow: the number is
 * changed in one place and three others keep the old one.
 *
 * The number lives in `settings.contact_details` for the admin-editable case.
 * This module is the static fallback and the only place the digits are written
 * down in code, so there is one thing to grep and one thing to update.
 */

export const WHATSAPP_NUMBER = "254708694088";
export const PHONE_DISPLAY = "+254 708 694 088";

/** Digits only, for a wa.me deep link. */
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

/** Prefilled enquiry text. URL-encoded at the point of use. */
export const WHATSAPP_PREFILL =
  "Hello Imarisha Dada, I would like to find out more about your work.";

export function whatsappHref(prefill: string = WHATSAPP_PREFILL): string {
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(prefill)}`;
}

/** E.164, for schema.org `telephone`. */
export const PHONE_E164 = `+${WHATSAPP_NUMBER}`;
