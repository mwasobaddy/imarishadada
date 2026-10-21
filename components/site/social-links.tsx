/**
 * The organisation's channels.
 *
 * ## Why the links are a prop
 *
 * The URLs live in settings, so a channel can be corrected without a deploy.
 * Reading them here would make this an async server component, and the
 * admin's live preview renders the real components from the browser — a
 * component that reads the database cannot go there. So the page reads them
 * and hands them over.
 *
 * ## Why a channel with no URL is left out
 *
 * A link to nowhere is worse than no link, and the reader does not need to
 * know a channel was planned.
 *
 * The labels are the platforms' own names, which is what a reader expects
 * next to an icon or a word. They are not translatable content: a brand name
 * stays a brand name in every locale, the same way "Dada Space" does.
 */
export type SocialLink = {
  linkedin: string | null;
  facebook: string | null;
  spotify: string | null;
};

export function SocialLinks({
  links,
  label,
  tone = "light",
  className = "",
}: {
  links: SocialLink;
  /** The heading above the channels, e.g. "Where to find us". */
  label?: string;
  /** `light` for the light page, `inverse` for a dark band. */
  tone?: "light" | "inverse";
  className?: string;
}) {
  const channels = [
    { key: "linkedin", label: "LinkedIn", href: links.linkedin },
    { key: "facebook", label: "Facebook", href: links.facebook },
    { key: "spotify", label: "Spotify", href: links.spotify },
  ].filter((channel): channel is { key: string; label: string; href: string } =>
    Boolean(channel.href),
  );

  if (channels.length === 0) return null;

  return (
    <div className={className}>
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted/60">
          {label}
        </p>
      ) : null}
      <ul className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
        {channels.map((channel) => (
          <li key={channel.key}>
            <a
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-11 items-center text-sm underline decoration-ink-muted/30 underline-offset-4 transition-colors hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                tone === "inverse"
                  ? "text-brand-100 hover:text-brand-50"
                  : "text-ink-muted hover:text-brand-600"
              }`}
            >
              {channel.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
