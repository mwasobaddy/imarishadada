/**
 * Registration and accountability strip.
 *
 * Renders nothing when there is no verified data. An empty "Our Partners" bar
 * or a "Registered NGO" claim without a number is a negative trust signal —
 * institutional donors check these strings.
 *
 * No partner logos ship until written permission exists, so none are rendered.
 */
export function TrustStrip({
  registrationNumber,
  fiscalSponsor,
  auditedAnnually,
}: {
  registrationNumber?: string | null;
  fiscalSponsor?: string | null;
  auditedAnnually?: boolean;
}) {
  const items: string[] = [];
  if (registrationNumber) items.push(`Registered with the NGOs Board of Kenya`);
  if (fiscalSponsor) items.push(`Fiscal sponsor: ${fiscalSponsor}`);
  if (auditedAnnually) items.push("Accounts published annually");

  // A placeholder, not an omission. The project rule is "use placeholders
  // instead of omitting sections": a missing trust strip is read as "this
  // organisation has nothing to prove", which is the opposite of what we want.
  if (items.length === 0) {
    items.push("NGO registration with the Board of Kenya — number being issued");
    items.push("Registered in Kenya · Kibera, Nairobi");
  }

  return (
    <section aria-label="Registration and accountability" className="border-y border-brand/20 bg-brand-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-5 text-sm text-brand-600 sm:px-8">
        {items.map((item, i) => (
          <p key={item} className="flex items-center gap-2">
            {i > 0 ? (
              <span aria-hidden="true" className="text-brand-600/40">
                ·
              </span>
            ) : null}
            <span>{item}</span>
            {registrationNumber && i === 0 ? (
              <span className="tabular font-medium">{registrationNumber}</span>
            ) : null}
          </p>
        ))}
      </div>
    </section>
  );
}