import { FinancialTables } from "@/components/transparency/financial-tables";
import { GapTable } from "@/components/transparency/gap-table";
import { ProseSection } from "@/components/transparency/prose-section";
import type { SiteSection } from "@/lib/data/types";
import type { FinancialLine, TransparencyGap } from "@/lib/data/gaps";

/**
 * The sections of `/transparency`.
 *
 * ## Why they are components
 *
 * The page used to write them inline, which meant the admin's live preview had
 * nothing to call for six of the seven sections. Now the page and the preview
 * render the same components, so the preview is the page.
 *
 * ## The two gap lists come from one table
 *
 * `transparency_gaps` holds both, discriminated by `kind`. The measurement
 * list is the same rows `/impact` publishes — the transparency page used to
 * carry its own hand-written copy of them, in different words, so the two
 * pages would have disagreed the moment anyone edited either.
 */

/** What the organisation has not yet put in place. */
export function TransparencyGaps({
  id = "gaps",
  section,
  gaps,
}: {
  id?: string;
  section: SiteSection;
  gaps: TransparencyGap[];
}) {
  return (
    <ProseSection id={id} section={section}>
      <GapTable
        gaps={gaps}
        caption="Things Imarisha Dada has not yet put in place, with their current status."
        itemHeading="Not yet in place"
      />
    </ProseSection>
  );
}

/** What cannot yet be measured. */
export function TransparencyMeasure({
  id = "measure",
  section,
  gaps,
}: {
  id?: string;
  section: SiteSection;
  gaps: TransparencyGap[];
}) {
  return (
    <ProseSection id={id} section={section}>
      <GapTable
        gaps={gaps}
        caption="Things about Imarisha Dada's work that cannot yet be measured, with their current status."
        itemHeading="Not yet measured"
      />
    </ProseSection>
  );
}

/** Where the money goes. Renders no table while `financial_breakdown` is empty. */
export function TransparencyMoney({
  id = "money",
  section,
  lines,
}: {
  id?: string;
  section: SiteSection;
  lines: FinancialLine[];
}) {
  return (
    <ProseSection id={id} section={section}>
      <FinancialTables lines={lines} />
    </ProseSection>
  );
}

/**
 * Where the money stands.
 *
 * A sub-section rather than a peer: it sits under the money section and is
 * marked as a third-level heading, because it says where the *accounting* is,
 * not where the money goes.
 */
export function TransparencyMoneyStatus({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="money-status-heading">
      <h3 id="money-status-heading" className="text-lg font-semibold text-brand-600">
        {section.heading}
      </h3>
      {section.body ? (
        <p className="measure mt-3 leading-relaxed text-ink-muted">{section.body}</p>
      ) : null}
    </section>
  );
}
