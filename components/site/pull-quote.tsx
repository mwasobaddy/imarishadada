/**
 * A position the organisation is willing to be quoted on.
 *
 * ## Why a component and not a section band
 *
 * A quote is not a paragraph. It is a single line, set large, with the
 * organisation's own name attached to it. Rendering it as ordinary body copy
 * would lose the thing that makes it quotable, so it gets its own treatment.
 *
 * ## The quotation marks
 *
 * They are in the component rather than in the copy. The copy in the database
 * is the sentence itself, with no wrapper characters, so an editor can change
 * it without knowing how it will be set.
 */
export function PullQuote({
  eyebrow,
  quote,
}: {
  /** Small label above the quote, e.g. "What we believe". */
  eyebrow?: string | null;
  quote: string;
}) {
  if (!quote.trim()) return null;

  return (
    <figure className="mx-auto max-w-3xl border-l-2 border-brand-600 pl-6 sm:pl-8">
      {eyebrow?.trim() ? (
        <figcaption className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
          {eyebrow}
        </figcaption>
      ) : null}
      <blockquote className="mt-3 text-xl font-medium leading-snug text-ink sm:text-2xl">
        “{quote}”
      </blockquote>
    </figure>
  );
}
