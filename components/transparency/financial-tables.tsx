import type { FinancialLine } from "@/lib/data/transparency";

/**
 * Income and expenditure.
 *
 * ## The bar is decoration over a real table
 *
 * The roadmap's requirement, verbatim: *"the visual must be a decoration over a
 * real `<table>`. Screen-reader users get the table; sighted users get the bars.
 * Not one or the other."*
 *
 * So every figure and every share is in the markup, and the bar is a `<span>`
 * with a width sitting beside it. There is no chart library, no canvas, and no
 * value that exists only as the length of a rectangle.
 *
 * ## Why the bars are not animated
 *
 * The roadmap asks for a scroll-in width animation. That needs a client
 * component, and today this table has **no rows at all** — so the animation
 * would be code with nothing to run against, on a page whose first-load budget
 * is spent better elsewhere. It goes in with the first real figures, where it
 * can actually be seen and judged.
 *
 * ## No figures, no placeholder
 *
 * `financial_breakdown` is empty, and the roadmap's acceptance criteria say "No
 * placeholder values anywhere on this page". So this renders nothing and the
 * page's `transparency-money-status` section states the position instead.
 */

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function LineTable({
  lines,
  caption,
  heading,
  currency,
}: {
  lines: FinancialLine[];
  caption: string;
  heading: string;
  currency: string;
}) {
  // The bar is scaled to the largest line, not to 100 — otherwise a year whose
  // shares do not sum to 100 (they rarely do exactly) would overflow its own
  // table.
  const largest = Math.max(...lines.map((l) => l.amount), 0);

  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className="pb-3 pr-4 text-sm font-semibold text-ink">
            {heading}
          </th>
          <th
            scope="col"
            className="pb-3 pr-4 text-right text-sm font-semibold text-ink whitespace-nowrap"
          >
            Amount
          </th>
          <th
            scope="col"
            className="hidden pb-3 text-right text-sm font-semibold text-ink whitespace-nowrap sm:table-cell"
          >
            Share
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="border-b border-border">
            <th scope="row" className="py-4 pr-4 text-left font-normal">
              <span className="block text-ink">{line.category}</span>
              {/* Decoration. `aria-hidden` so it is not announced as content. */}
              <span
                aria-hidden="true"
                className="mt-2 block h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-lilac"
              >
                <span
                  className="block h-full rounded-full bg-brand-600"
                  style={{
                    width: `${largest > 0 ? Math.round((line.amount / largest) * 100) : 0}%`,
                  }}
                />
              </span>
            </th>
            <td className="tabular py-4 pr-4 text-right align-top whitespace-nowrap text-ink">
              {formatAmount(line.amount, line.currency || currency)}
            </td>
            <td className="tabular hidden py-4 text-right align-top whitespace-nowrap text-ink-muted sm:table-cell">
              {line.sharePct === null ? "—" : `${line.sharePct}%`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FinancialTables({ lines }: { lines: FinancialLine[] }) {
  if (lines.length === 0) return null;

  // Newest year only. A transparency page that renders five years of tables
  // above the fold buries the current one; the roadmap's annual report is where
  // history belongs.
  const year = lines[0]!.fiscalYear;
  const thisYear = lines.filter((l) => l.fiscalYear === year);

  const income = thisYear.filter((l) => l.direction === "income");
  const expenditure = thisYear.filter((l) => l.direction === "expenditure");
  const currency = thisYear[0]?.currency ?? "KES";

  return (
    <div className="mt-10 space-y-12">
      {income.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-brand-600">
            Income — {year}
          </h3>
          <div className="mt-4">
            <LineTable
              lines={income}
              currency={currency}
              heading="Source"
              caption={`Income by source for ${year}, in ${currency}.`}
            />
          </div>
        </div>
      ) : null}

      {expenditure.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-brand-600">
            Expenditure — {year}
          </h3>
          <div className="mt-4">
            <LineTable
              lines={expenditure}
              currency={currency}
              heading="Category"
              caption={`Expenditure by category for ${year}, in ${currency}.`}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
