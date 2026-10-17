import Image from "next/image";

import { Container } from "@/components/site/container";
import type { SiteSection, TeamMember } from "@/lib/data/types";

/**
 * Team and governance.
 *
 * Returns null when there is nothing publishable. `getTeamMembers` already
 * filters on `consent_recorded`, so an empty result means no one has consented
 * yet — showing an empty grid, or inventing names, would be worse than showing
 * nothing. Add consented members to `team_members` and this appears on its own.
 */
export function AboutTeam({
  section,
  members,
}: {
  section: SiteSection;
  members: TeamMember[];
}) {
  if (members.length === 0) return null;

  return (
    <section aria-labelledby="about-team-heading" className="py-section bg-surface">
      <Container>
        <h2
          id="about-team-heading"
          className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
        >
          {section.heading}
        </h2>

        <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li key={member.slug}>
              {member.photoPath ? (
                <Image
                  src={member.photoPath}
                  alt=""
                  width={320}
                  height={320}
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              ) : null}

              <h3 className="mt-4 text-lg font-semibold text-brand-600">{member.name}</h3>
              <p className="text-sm text-ink-muted">
                {member.role}
                {member.safeguardingOfficer ? (
                  <>
                    {" · "}
                    <span className="text-brand-600">Safeguarding Officer</span>
                  </>
                ) : null}
              </p>
              {member.bio ? <p className="mt-2 text-base text-ink-muted">{member.bio}</p> : null}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
