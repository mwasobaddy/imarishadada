import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"

import { cn } from "@/lib/utils"

/**
 * Interactive hover button — Magic UI.
 *
 * Vendored from `@magicui/interactive-hover-button` and extended with an
 * optional `href`. When `href` is provided the component renders a `<Link>`
 * (locale-aware via `@/i18n/navigation` is handled by callers passing a
 * locale-prefixed path) instead of a `<button>`, so it can be used for
 * navigation CTAs as well as form submits without producing invalid HTML
 * (`<button>` inside `<a>`).
 *
 * ## The colour transition
 *
 * The effect is an inversion. At rest the button is one colour with text in
 * another. On hover a disc expands from a small dot until it fills the
 * button, and the label **transitions to the button's own fill colour** as it
 * slides in from the right with the arrow.
 *
 * That means the disc must be the button's *foreground* colour and the
 * incoming label the button's *background* colour. Getting this backwards — a
 * gold disc under gold text, or a dark label on a dark disc — produces an
 * invisible button, which is what the upstream `bg-primary` /
 * `text-primary-foreground` pair did once the brand palette was applied.
 *
 * Which pair is correct depends on the button, so it is declared with the
 * `tone` prop rather than hardcoded:
 *
 *   | Tone      | At rest          | Disc on hover | Label on hover |
 *   |-----------|------------------|---------------|----------------|
 *   | `gold`    | gold / dark ink  | dark ink      | gold           |
 *   | `brand`   | purple / cream   | cream         | purple         |
 *
 * `tone` is a fixed set rather than two free colour props, because a free
 * prop would put a `text-${colour}` in the source that Tailwind's scanner
 * cannot see, and the class would silently not exist.
 */
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  tone?: keyof typeof TONES;
};

const TONES = {
  gold: { dot: "bg-gold-ink", label: "text-gold" },
  brand: { dot: "bg-brand-50", label: "text-brand-600" },
} as const;

export function InteractiveHoverButton({
  children,
  className,
  href,
  tone = "gold",
  ...props
}: Props) {
  const classes = cn(
    "flex group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold",
    className,
  );

  const inner = (
    <>
      {/* The dot that expands into the disc. */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]",
            TONES[tone].dot,
          )}
        ></div>
        {/* The label at rest, in the button's own colour. It slides out and
            fades as the incoming label takes its place. */}
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      {/* The label that arrives on hover, in the button's own fill colour. */}
      <div
        className={cn(
          "absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100",
          TONES[tone].label,
        )}
      >
        <span>{children}</span>
        <ArrowRight />
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {inner}
    </button>
  );
}
