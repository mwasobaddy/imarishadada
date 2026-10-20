import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import {
  SOCIAL_LABEL,
  SOCIAL_ORDER,
  SocialIcon,
  socialHref,
  type SocialKey,
} from "@/components/about/social-icon";
import type { SiteSection, TeamMember } from "@/lib/data/types";

/**
 * Team and governance.
 *
 * ## Returns null when there is nothing publishable
 *
 * `getTeamMembers` filters on `consent_recorded`, so an empty result means
 * nobody has consented yet. An empty grid, or invented names, would be worse
 * than showing nothing. Add a consented member and this appears on its own.
 *
 * ## The card
 *
 * Portrait-first, because a team section is about faces. The photograph is a
 * 4:5 crop — taller than square, which reads as a portrait rather than an
 * avatar — and scales very slightly on hover.
 *
 * ## Social links are always visible, never hover-only
 *
 * The obvious design hides them behind a hover state. That breaks on touch,
 * where there is no hover, and it breaks for a keyboard user tabbing through.
 * A team section on a site for a Kenyan audience is read on a phone far more
 * often than on a desktop, so hover-only would mean most visitors never see the
 * links at all. They sit in a row under the bio, muted until focused or hovered.
 *
 * ## Why the alt text is the name and role
 *
 * A portrait's alt is not decorative. A screen reader user hearing "Amina, 17"
 * on a story page and "Amina, Programme Lead" here needs to know who is in the
 * frame, and the filename cannot tell them.
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
        <div className="max-w-2xl">
          {section.eyebrow && (
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              {section.eyebrow}
            </p>
          )}
          <h2
            id="about-team-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body && (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          )}
        </div>

        <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const socials = SOCIAL_ORDER.filter(
              (key) => member.socialLinks?.[key],
            ) as SocialKey[];

            return (
              <li key={member.slug} className="group flex flex-col">
                {/* Portrait */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-lilac">
                  {member.photoPath ? (
                    <Image
                      src={member.photoPath}
                      alt={`${member.name}, ${member.role}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-full w-full items-center justify-center text-3xl font-semibold text-brand-600/40"
                    >
                      {member.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}

                  {member.safeguardingOfficer && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-brand-50 shadow-sm">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      Safeguarding Officer
                    </span>
                  )}
                </div>

                {/* Identity */}
                <div className="mt-5 flex flex-1 flex-col">
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {member.name}
                    {member.title && (
                      <span className="ml-1.5 text-sm font-normal text-ink-muted">
                        {member.title}
                      </span>
                    )}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-brand-600">
                    {member.role}
                    {member.department && (
                      <span className="font-normal text-ink-muted">
                        {" · "}
                        {member.department}
                      </span>
                    )}
                  </p>

                  {member.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      {member.bio}
                    </p>
                  )}

                  {/* Socials — always rendered when present */}
                  {socials.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {socials.map((platform) => (
                        <li key={platform}>
                          <a
                            href={socialHref(platform, member.socialLinks![platform]!)}
                            target={platform === "email" ? undefined : "_blank"}
                            rel={
                              platform === "email"
                                ? undefined
                                : "noopener noreferrer"
                            }
                            aria-label={`${member.name} on ${SOCIAL_LABEL[platform]}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                          >
                            <SocialIcon platform={platform} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
