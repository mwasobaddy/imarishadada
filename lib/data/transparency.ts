import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSection } from "@/lib/data/sections";
import type { SiteSection } from "@/lib/data/types";

/**
 * Transparency data.
 *
 * ## Two kinds of gap, and they are not the same claim
 *
 * `measurement` is something about our work we cannot yet quantify — retention
 * beyond a year, cost per participant. `governance` is something we have not yet
 * put in place — an independent examination, a named safeguarding officer.
 *
 * The roadmap calls the second list "the most important section on this page",
 * and the first is what `/impact` already publishes. Both come from the same
 * table so they cannot drift apart, which is the bug this replaced: the
 * transparency page carried its own hand-written copy of the four measurement
 * gaps, in different words from the ones `/impact` rendered.
 */

/**
 * The gap types and the two pure helpers live in `lib/data/gaps.ts`.
 *
 * They are re-exported here because everything else has always imported them
 * from this module, and because the admin's live preview needs them from a
 * module that does not read the database.
 */
import {
  gapIsClosed,
  gapStatusLabel,
  type FinancialLine,
  type GapKind,
  type GapStatus,
  type TransparencyGap,
} from "@/lib/data/gaps";

export {
  gapIsClosed,
  gapStatusLabel,
  type FinancialLine,
  type GapKind,
  type GapStatus,
  type TransparencyGap,
};

export async function getTransparencyGaps(
  kind?: GapKind,
): Promise<TransparencyGap[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("transparency-gaps");

  if (!isSupabaseConfigured()) return [];

  const query = createClient()
    .from("transparency_gaps")
    .select("id, item, kind, status, target_label, notes, sort_order")
    .order("sort_order");

  const { data, error } = kind ? await query.eq("kind", kind) : await query;

  if (error) {
    console.error("[data] transparency_gaps query failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    item: r.item as string,
    kind: r.kind as GapKind,
    status: r.status as GapStatus,
    targetLabel: (r.target_label as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

/**
 * Published income and expenditure, by year.
 *
 * Returns an empty array today, and that is the honest state — there is no
 * financial statement yet. The page renders a stated absence rather than a
 * placeholder figure, which the roadmap's acceptance criteria require: "No
 * placeholder values anywhere on this page."
 */
export async function getFinancialBreakdown(): Promise<FinancialLine[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("financial-breakdown");

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient()
    .from("financial_breakdown")
    .select("id, fiscal_year, direction, category, amount, currency, share_pct, sort_order")
    .order("fiscal_year", { ascending: false })
    .order("sort_order");

  if (error) {
    console.error("[data] financial_breakdown query failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    fiscalYear: r.fiscal_year as string,
    direction: r.direction as "income" | "expenditure",
    category: r.category as string,
    amount: Number(r.amount),
    currency: r.currency as string,
    sharePct: r.share_pct === null ? null : Number(r.share_pct),
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

/** The page's sections, keyed. */
export async function getTransparencySections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "transparency-hero",
    "transparency-gaps",
    "transparency-measure",
    "transparency-money",
    "transparency-money-status",
    "transparency-governance",
    "transparency-safeguarding",
    "transparency-complaints",
  ];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}
