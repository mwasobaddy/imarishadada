/**
 * Partner schools.
 *
 * Naming a school that has not given written permission is a real reputational
 * risk for an organisation working with girls aged 9–16 — a school could object
 * to being associated with a programme it never agreed to, and a funder
 * reviewing due diligence could reasonably read a list as a partnership claim.
 *
 * So the section renders, but it renders as a labelled placeholder that states
 * exactly what is required before a name can appear. The slot is `aria-hidden`
 * apart from its heading, so no screen reader is read editorial instructions.
 *
 * Add rows to `partner_schools` once each school has confirmed in writing, and
 * the placeholder is replaced by the real list with no code change.
 */
export function PartnerSchools({
  partners,
}: {
  partners: { name: string; area: string | null; note: string | null }[];
}) {
  const hasPartners = partners.length > 0;

  return (
    <section aria-labelledby="partners-heading" className="bg-surface py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
          Where we work
        </p>
        <h2
          id="partners-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
        >
          Partner schools
        </h2>

        {hasPartners ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <li
                key={partner.name}
                className="rounded-card border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold text-ink">{partner.name}</h3>
                {partner.area ? (
                  <p className="mt-1 text-sm text-ink-muted">{partner.area}</p>
                ) : null}
                {partner.note ? (
                  <p className="mt-3 text-sm text-ink-muted">{partner.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10" aria-hidden="true">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex min-h-40 flex-col justify-center rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-6"
                >
                  <div className="h-3 w-28 rounded-full bg-brand-600/20" />
                  <div className="mt-3 h-3 w-40 rounded-full bg-brand-600/10" />
                  <p className="mt-5 text-xs text-ink-muted/70">
                    Placeholder — school name withheld pending written agreement
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-muted">
              We do not publish a school&rsquo;s name without its written agreement.
              Slots appear here once each school has confirmed in writing, and the
              list is updated without a code change.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
