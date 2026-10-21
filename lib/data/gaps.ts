/**
 * The gap vocabulary.
 *
 * ## Why it is its own module
 *
 * A gap is either "not yet in place" or "not yet measured", and it is either
 * outstanding, in progress, done or published. Those words are the most
 * careful on the site: "published" and "done" are different promises, and a
 * gap that is merely in progress must not read as closed.
 *
 * The types and the two pure functions live here rather than beside the
 * database readers, because the admin's live preview renders the gaps table
 * from the browser — and a client component cannot import a module that reads
 * the database.
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
 * Exported and pure so the mapping can be tested without a database.
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
