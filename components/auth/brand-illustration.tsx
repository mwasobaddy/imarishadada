/**
 * Line-art illustration for the auth split panel.
 *
 * ## Why this is drawn rather than photographed
 *
 * The reference design this is modelled on uses a hand-drawn cityscape in the
 * bottom-right of the card. The equivalent here is a small group of stylised
 * figures — the people the work is for — drawn in the same thin-stroke line-art
 * style, with soft brand-tinted fills behind them.
 *
 * ## Why not the consented photography
 *
 * The photographs in `public/images` are real participants. They belong on the
 * public site where the story is being told, on pages a visitor can read. A
 * sign-in screen is not that, and putting a child's face on an admin login
 * form would be using the image for decoration rather than for the story.
 */

export function BrandIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Soft brand-tinted shapes behind the figures */}
      <circle cx="86" cy="196" r="54" fill="#C71F6E" opacity="0.1" />
      <circle cx="322" cy="150" r="42" fill="#F5B82E" opacity="0.16" />
      <circle cx="212" cy="168" r="58" fill="#5B2A86" opacity="0.06" />

      {/* Three figures — thin stroke, rounded caps.
          Each is a circle head above a bell-shaped body, which is the
          silhouette the reference uses. No arms: extra limbs read as
          noise at this size rather than as gesture. */}
      <g
        stroke="#5B2A86"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      >
        {/* Figure left */}
        <circle cx="86" cy="172" r="15" />
        <path d="M56 250v-42c0-16 13-29 30-29s30 13 30 29v42" />

        {/* Figure centre (taller, in front) */}
        <circle cx="212" cy="142" r="19" />
        <path d="M172 250v-52c0-22 18-40 40-40s40 18 40 40v52" />

        {/* Figure right */}
        <circle cx="322" cy="182" r="13" />
        <path d="M296 250v-36c0-15 12-27 26-27s26 12 26 27v36" />
      </g>

      {/* Ground line */}
      <path
        d="M28 250h364"
        stroke="#5B2A86"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Small accent marks */}
      <g stroke="#C71F6E" strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
        <path d="M48 140c8-10 8-22 0-32" />
        <path d="M366 106c8 10 8 22 0 32" />
      </g>
      <g stroke="#F5B82E" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
        <path d="M136 108c8-8 8-20 0-28" />
      </g>
    </svg>
  );
}
