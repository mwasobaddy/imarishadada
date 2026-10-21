import Image from "next/image";

import { Container } from "@/components/site/container";
import type { PublicPartner } from "@/lib/data/partner";
import type { SiteSection } from "@/lib/data/types";

/**
 * Who we work with, on the homepage.
 *
 * ## Names always, logos when we have them
 *
 * Brand guidance treats a logo as the owner's property: it is not used without
 * formal written permission. A name is less sensitive but still a claim about a
 * relationship, so it is gated on the same permission. Once a partner is
 * publishable, showing the name is what makes the list readable: not every logo is
 * recognisable, and a name lets a visitor see who the organisation is without a
 * logo file being required.
 *
 * ## Renders nothing when empty
 *
 * The caller hides the whole section while no partner is publishable. This
 * component also returns null for an empty list, so it can never draw an empty
 * heading over nothing.
 */
export function PartnerStrip({
  partners,
  section,
}: {
  partners: PublicPartner[];
  section: SiteSection;
}) {
  if (partners.length === 0) return null;

  return (
    <section aria-labelledby="home-partners-heading" className="bg-surface py-section">
      <Container>
        <div className="max-w-2xl">
          {section.eyebrow ? (
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              {section.eyebrow}
            </p>
          ) : null}
          <h2
            id="home-partners-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {partners.map((partner) => {
            const inner = (
              <>
                {partner.logoPath && partner.logoAlt ? (
                  <div className="relative mb-3 h-12 w-full">
                    <Image
                      src={partner.logoPath}
                      alt={partner.logoAlt}
                      fill
                      sizes="(min-width: 1024px) 220px, 45vw"
                      className="object-contain object-left"
                    />
                  </div>
                ) : null}
                <span className="font-medium text-ink">{partner.name}</span>
              </>
            );

            return (
              <li key={partner.id} className="flex flex-col">
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 flex-col rounded-lg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                  >
                    {inner}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <div className="flex min-h-11 flex-col">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
