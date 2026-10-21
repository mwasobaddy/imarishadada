import { getSocialLinks } from "@/lib/data/social";

/**
 * The organisation's channels.
 *
 * Reads the URLs from settings rather than writing them here, so a channel can
 * be corrected without a deploy. A channel with no URL is left out entirely —
 * a link to nowhere is worse than no link, and the reader does not need to
 * know a channel was planned.
 *
 * The labels are the platforms' own names, which is what a reader expects to
 * see next to an icon or a word. They are not translatable content: a brand
 * name stays a brand name in every locale, the same way "Dada Space" does.
 */
export async function SocialLinks({
  tone = "light",
  className = "",
}: {
  /** `light` for the light page, `inverse` for a dark band. */
  tone?: "light" | "inverse";
  className?: string;
}) {
  const links = await getSocialLinks();

  const channels = [
    { key: "linkedin", label: "LinkedIn", href: links.linkedin },
    { key: "facebook", label: "Facebook", href: links.facebook },
    { key: "spotify", label: "Spotify", href: links.spotify },
  ].filter((channel): channel is { key: string; label: string; href: string } =>
    Boolean(channel.href),
  );

  if (channels.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
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
  );
}
