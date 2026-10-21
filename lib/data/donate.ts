import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getGivingTiers } from "@/lib/data/home";
import { getSection } from "@/lib/data/sections";
import { paymentsConfigured } from "@/lib/donate/adapter";
import type { SiteSection } from "@/lib/data/types";
import type { PaymentRail } from "@/lib/donate/money";

/**
 * Payment configuration.
 *
 * The donate spec's hard rule is that no amount, paybill or bank detail is ever
 * hardcoded in a component. Everything below comes from `settings`, with a
 * development fallback that mirrors the seed migration.
 */

export type RailConfig = {
  enabled: boolean;
  label: string;
  hint: string;
  /**
   * Set when the rail is shown as recommended. The spec is explicit that a
   * recommendation must state *why* — cheaper and faster for the donor, not
   * because we prefer it. A hidden recommendation reads as a dark pattern.
   */
  recommended?: boolean;
  recommendedReason?: string;
};

export type PaymentRails = Record<PaymentRail, RailConfig>;

export type BankDetails = {
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  branch: string | null;
  instructions: string | null;
};

export type TaxReceipt = {
  mode: "request" | "fiscal_sponsor";
  statement: string;
  fiscalSponsor: string | null;
};

const SEED_RAILS: PaymentRails = {
  mpesa: {
    enabled: false,
    label: "Pay with M-Pesa",
    hint: "Recommended in Kenya — no app switching, no paybill to type.",
    recommended: true,
    recommendedReason: "Cheapest and fastest for you in Kenya.",
  },
  card: {
    enabled: true,
    label: "Pay with card",
    hint: "Visa and Mastercard, processed securely.",
  },
  bank: {
    enabled: true,
    label: "Bank transfer",
    hint: "Best for larger gifts.",
  },
};

const SEED_BANK: BankDetails = {
  accountName: null,
  bankName: null,
  accountNumber: null,
  branch: null,
  instructions: null,
};

const SEED_TAX: TaxReceipt = {
  mode: "request",
  statement: "Receipts issued on request. Contact us for tax guidance.",
  fiscalSponsor: null,
};

/**
 * Merge a `settings` row over its fallback.
 *
 * ## The bug this had
 *
 * `settings.value` is `jsonb`, so PostgREST hands back a **parsed object**, not
 * a string. The original version only handled a string and returned the
 * fallback for everything else — which meant it *always* returned the fallback.
 *
 * The consequence was invisible and total: every rail label, every bank detail
 * and the entire tax sentence on the public donate page came from the `SEED_*`
 * constants in this file, and an editor changing them in `/admin/settings` saw
 * nothing change on the page. The values were in the database the whole time.
 *
 * This is precisely the failure the donate spec names as the most common way
 * charity sites ship stale payment details, so it is handled for both shapes and
 * covered by a test.
 *
 * A malformed row still falls back rather than taking the donate page down.
 */
export function mergeSettings<T extends object>(value: unknown, fallback: T): T {
  // jsonb: already an object.
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...fallback, ...(value as object) } as T;
  }

  // A text column, or a value that arrived pre-serialised.
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? ({ ...fallback, ...(parsed as object) } as T)
        : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Which rails are offered and how each is described.
 *
 * M-Pesa ships **disabled** until Daraja approval lands. It is rendered but
 * not selectable, so a donor who came here for M-Pesa sees it is coming rather
 * than wondering where it went.
 */
export async function getPaymentRails(): Promise<PaymentRails> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  if (!isSupabaseConfigured()) return SEED_RAILS;

  const { data, error } = await createClient()
    .from("settings")
    .select("value")
    .eq("key", "payment_rails")
    .maybeSingle();

  if (error || !data) return SEED_RAILS;

  const parsed = mergeSettings<Partial<PaymentRails>>(data.value, {});
  return {
    mpesa: { ...SEED_RAILS.mpesa, ...(parsed.mpesa ?? {}) },
    card: { ...SEED_RAILS.card, ...(parsed.card ?? {}) },
    bank: { ...SEED_RAILS.bank, ...(parsed.bank ?? {}) },
  };
}

/**
 * Bank details for donors who chose that rail.
 *
 * Fetched server-side only. `settings.bank_details` is excluded from the public
 * RLS policy, so an account number is never in a client payload until the
 * donor has actually selected the bank rail.
 */
export async function getBankDetails(): Promise<BankDetails> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  if (!isSupabaseConfigured()) return SEED_BANK;

  const { data, error } = await createClient()
    .from("settings")
    .select("value")
    .eq("key", "bank_details")
    .maybeSingle();

  if (error || !data) return SEED_BANK;

  return mergeSettings<Partial<BankDetails>>(data.value, {}) as BankDetails;
}

export async function getTaxReceipt(): Promise<TaxReceipt> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  if (!isSupabaseConfigured()) return SEED_TAX;

  const { data, error } = await createClient()
    .from("settings")
    .select("value")
    .eq("key", "tax_receipt")
    .maybeSingle();

  if (error || !data) return SEED_TAX;

  return mergeSettings<Partial<TaxReceipt>>(data.value, {}) as TaxReceipt;
}

/**
 * The bank rail is only offered when it can actually be completed. A rail
 * with a null account number would take a donor's money and tell them to
 * "transfer to an account we will email you" — worse than not offering it.
 */
export function bankRailUsable(details: BankDetails): boolean {
  return Boolean(details.accountName && details.bankName && details.accountNumber);
}

/**
 * What a rail's status label should say.
 *
 * Derived from two independent facts, never written by hand:
 *
 *   * `settings.payment_rails[rail].enabled` — the editorial switch.
 *   * `paymentsConfigured()` — whether a provider can actually complete a charge.
 *
 * The second is why this exists. `/ways-to-give` used to hardcode
 * "Card — Available now", which was false in production: the card rail is
 * enabled in settings, but no payment adapter is implemented, so every card
 * payment fails. A page that promises a working rail and then cannot take the
 * money costs more trust than one that says "being set up".
 *
 * `bank` additionally needs real account details; `bankRailUsable` is the check
 * for that, and the page applies it on top of this.
 */
export type RailStatus = "available" | "coming_soon";

export function railStatuses(
  rails: PaymentRails,
): Record<PaymentRail, RailStatus> {
  const live = paymentsConfigured();
  const status = (enabled: boolean): RailStatus =>
    enabled && live ? "available" : "coming_soon";

  return {
    mpesa: status(rails.mpesa.enabled),
    card: status(rails.card.enabled),
    bank: status(rails.bank.enabled),
  };
}

export const getGivingTiersForDonate = getGivingTiers;

/**
 * The donate page's sections, keyed.
 *
 * Mirrors `getAboutSections()` and `getImpactSections()`. Note what is *not*
 * here: no amounts, no paybill, no bank details. Those live in `giving_tiers`
 * and `settings`, and they are financial settings rather than copy — an editor
 * can reword the sentence around a figure, not the figure.
 */
export async function getDonateSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = ["donate-hero", "donate-impact"];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}

/**
 * The Ways to give page's sections, keyed.
 *
 * Separate keys from `donate-*` even where the wording is similar, because the
 * two pages are read by different people: `/donate` is someone mid-decision
 * with a card in hand, `/ways-to-give` is someone whose gift does not fit a
 * card form — a large gift, an organisation, a bequest. Sharing copy between
 * them would force one to speak for both.
 */
export async function getWaysToGiveSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "ways-hero",
    "ways-ladder",
    "ways-rails",
    "ways-transparency",
    "ways-organisation",
    "ways-other",
  ];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}
