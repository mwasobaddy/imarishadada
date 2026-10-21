import {
  gapIsClosed,
  gapStatusLabel,
  type TransparencyGap,
} from "@/lib/data/transparency";

/**
 * The gaps table.
 *
 * The roadmap calls this "the most important section on this page", and the
 * design brief for it is one line: *"Mark items complete as they land. A gaps
 * list that never shrinks signals performative transparency."*
 *
 * So a closed gap is **not removed**. It stays in the table with its status
 * changed, because a list that only ever loses rows is indistinguishable from a
 * list that was edited. The visible shrink is the whole point.
 *
 * ## A real `<table>`
 *
 * Not a styled list. The roadmap's accessibility requirement is explicit —
 * `financial tables must be real <table> with <caption> and <th scope>` — and it
 * applies here for the same reason: a screen reader user should be able to ask
 * "how many are outstanding" and get an answer from the markup.
 *
 * ## The target column appears only when there is something in it
 *
 * `target_label` is null on every seeded row, because a target is a commitment
 * the organisation makes and a migration cannot make it on their behalf. A
 * column of dashes would be worse than no column, so it is omitted until the
 * first real target is set.
 */
export function GapTable({
  gaps,
  caption,
  itemHeading,
}: {
  gaps: TransparencyGap[];
  /** Describes the table to a screen reader. Rendered `sr-only`. */
  caption: string;
  /** Column heading for the items — "Not yet in place" reads differently from "Not yet measured". */
  itemHeading: string;
}) {
  if (gaps.length === 0) return null;

  const anyTarget = gaps.some((g) => g.targetLabel);

  return (
    <div className="mt-8">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="pb-3 pr-4 text-sm font-semibold text-ink"
            >
              {itemHeading}
            </th>
            <th
              scope="col"
              className="pb-3 pr-4 text-sm font-semibold text-ink whitespace-nowrap"
            >
              Status
            </th>
            {anyTarget ? (
              <th
                scope="col"
                className="hidden pb-3 text-sm font-semibold text-ink whitespace-nowrap sm:table-cell"
              >
                Target
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {gaps.map((gap) => {
            const closed = gapIsClosed(gap.status);
            return (
              <tr key={gap.id} className="border-b border-border align-top">
                <th scope="row" className="py-5 pr-4 text-left font-normal">
                  <span
                    className={`block font-medium ${closed ? "text-ink-muted" : "text-ink"}`}
                  >
                    {closed ? (
                      <span aria-hidden="true" className="mr-2 text-brand-600">
                        ✓
                      </span>
                    ) : null}
                    {gap.item}
                  </span>
                  {gap.notes ? (
                    <span className="measure mt-1.5 block text-sm leading-relaxed text-ink-muted">
                      {gap.notes}
                    </span>
                  ) : null}
                </th>

                <td className="py-5 pr-4 align-top">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                      closed
                        ? "bg-brand-50 text-brand-600"
                        : "bg-surface-lilac text-ink-muted"
                    }`}
                  >
                    {gapStatusLabel(gap.status)}
                  </span>
                </td>

                {anyTarget ? (
                  <td className="hidden py-5 align-top text-sm whitespace-nowrap text-ink-muted sm:table-cell">
                    {gap.targetLabel ?? "—"}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
