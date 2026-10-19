import { cache } from "react";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getGivingTiers } from "@/lib/data/home";
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

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" ? { ...fallback, ...(parsed as object) } as T : fallback;
  } catch {
    // A malformed settings row must not take the donate page down. Fall back
    // and let an editor fix it.
    return fallback;
  }
}

/**
 * Which rails are offered and how each is described.
 *
 * M-Pesa ships **disabled** until Daraja approval lands. It is rendered but
 * not selectable, so a donor who came here for M-Pesa sees it is coming rather
 * than wondering where it went.
 */
export const getPaymentRails = cache(async (): Promise<PaymentRails> => {
  if (!isSupabaseConfigured()) return SEED_RAILS;

  const { data, error } = await createClient()
    .from("settings")
    .select("value")
    .eq("key", "payment_rails")
    .maybeSingle();

  if (error || !data) return SEED_RAILS;

  const parsed = parseJson<Partial<PaymentRails>>(data.value, {});
  return {
    mpesa: { ...SEED_RAILS.mpesa, ...(parsed.mpesa ?? {}) },
    card: { ...SEED_RAILS.card, ...(parsed.card ?? {}) },
    bank: { ...SEED_RAILS.bank, ...(parsed.bank ?? {}) },
  };
});

/**
 * Bank details for donors who chose that rail.
 *
 * Fetched server-side only. `settings.bank_details` is excluded from the public
 * RLS policy, so an account number is never in a client payload until the
 * donor has actually selected the bank rail.
 */
export const getBankDetails = cache(async (): Promise<BankDetails> => {
  if (!isSupabaseConfigured()) return SEED_BANK;

  const { data, error } = await createClient()
    .from("settings")
    .select("value")
    .eq("key", "bank_details")
    .maybeSingle();

  if (error || !data) return SEED_BANK;

  return parseJson<Partial<BankDetails>>(data.value, {}) as BankDetails;
});

export const getTaxReceipt = cache(async (): Promise<TaxReceipt> => {
  if (!isSupabaseConfigured()) return SEED_TAX;

  const { data, error } = await createClient()
    .from("settings")
    .select("value")
    .eq("key", "tax_receipt")
    .maybeSingle();

  if (error || !data) return SEED_TAX;

  return parseJson<Partial<TaxReceipt>>(data.value, {}) as TaxReceipt;
});

/**
 * The bank rail is only offered when it can actually be completed. A rail
 * with a null account number would take a donor's money and tell them to
 * "transfer to an account we will email you" — worse than not offering it.
 */
export function bankRailUsable(details: BankDetails): boolean {
  return Boolean(details.accountName && details.bankName && details.accountNumber);
}

export const getGivingTiersForDonate = getGivingTiers;
