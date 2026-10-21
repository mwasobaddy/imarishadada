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

export type GapKind = "measurement" | "governance";

export type GapStatus = "outstanding" | "in_progress" | "done" | "published";

export type TransparencyGap = {
  id: string;
  item: string;
  kind: GapKind;
  status: GapStatus;
  /** "FY2026/27", "2026" — an editorial label, because a date cannot hold these. */
  targetLabel: string | null;
  notes: string | null;
  sortOrder: number;
};

export type FinancialLine = {
  id: string;
  fiscalYear: string;
  direction: "income" | "expenditure";
  category: string;
  amount: number;
  currency: string;
  sharePct: number | null;
  sortOrder: number;
};

/**
 * The status label a reader sees.
 *
 * Exported and pure so the mapping can be tested without a database. The words
 * matter here more than anywhere else on the site: "published" and "done" are
 * different promises, and a gap that is merely in progress must not read as
 * closed.
 */
export function gapStatusLabel(status: GapStatus): string {
  switch (status) {
    case "outstanding":
      return "Not yet in place";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    case "published":
      return "Published";
  }
}

/**
 * Whether a gap is closed.
 *
 * Used to decide whether the row is shown as resolved. A closed gap stays in the
 * table — the roadmap is explicit that the list is meant to shrink *visibly*,
 * and a deleted row shrinks it invisibly.
 */
export function gapIsClosed(status: GapStatus): boolean {
  return status === "done" || status === "published";
}

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
