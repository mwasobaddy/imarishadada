import { cacheLife, cacheTag } from "next/cache";

import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/client";

/**
 * The organisation's public channels.
 *
 * ## Why they live in settings
 *
 * A channel URL changes when the organisation changes it, and it is the kind of
 * thing a volunteer updates without a deploy. The rule this project set is that
 * contact details never live in a component, and a Facebook page is a contact
 * detail. The channels are therefore data, editable in admin settings.
 *
 * ## Why the service role
 *
 * The public read policy on `settings` allows only the donor-facing keys
 * (`payment_rails`, `tax_receipt`). `contact_details` and `bank_details` are
 * read through the service role for the same reason, and these are read the
 * same way. The alternative — widening the public policy — would publish every
 * future settings key to anyone who asks.
 *
 * ## A missing channel is not a dead link
 *
 * An empty value is not rendered. The client has a Spotify presence but has
 * not given the podcast's own page yet, so that link points at Spotify's
 * entry point until it is replaced. The other two are the organisation's real
 * pages.
 */
export type SocialLinks = {
  linkedin: string | null;
  facebook: string | null;
  spotify: string | null;
};

const EMPTY: SocialLinks = { linkedin: null, facebook: null, spotify: null };

export async function getSocialLinks(): Promise<SocialLinks> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  if (!isServiceRoleConfigured()) return EMPTY;

  const { data, error } = await createServiceClient()
    .from("settings")
    .select("value")
    .eq("key", "social_links")
    .maybeSingle();

  if (error) {
    console.error("[data] social_links query failed:", error.message);
    return EMPTY;
  }

  const value = (data?.value ?? {}) as Partial<Record<keyof SocialLinks, unknown>>;

  return {
    linkedin: typeof value.linkedin === "string" ? value.linkedin : null,
    facebook: typeof value.facebook === "string" ? value.facebook : null,
    spotify: typeof value.spotify === "string" ? value.spotify : null,
  };
}
