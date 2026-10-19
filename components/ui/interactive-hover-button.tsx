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
 * The effect is an inversion. At rest the button is gold (`bg-gold`) with dark
 * ink text (`text-gold-ink`). On hover a dark disc expands from the dot until
 * it fills the button, and the label **transitions to gold** as it slides in
 * from the right with the arrow.
 *
 * That means the disc must be the *dark* colour and the incoming label the
 * *gold* one. Getting this backwards — a gold disc under gold text, or a dark
 * label on a dark disc — produces an invisible button, which is what the
 * upstream `bg-primary` / `text-primary-foreground` pair did once the brand
 * palette was applied to it.
 *
 * `text-gold` is a fixed colour rather than `text-current` on purpose: the
 * incoming label must stay gold whether the button is the gold give button or
 * a dark one, so the contrast is decided by the disc, not by the button.
 */
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
};

export function InteractiveHoverButton({ children, className, href, ...props }: Props) {
  const classes = cn(
    "flex group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold",
    className,
  );

  const inner = (
    <>
      {/* The dot that expands into the disc. `bg-gold-ink` is the dark brand
          ink, so the expanded disc reads as a dark field the gold label can
          sit on. */}
      <div className="flex items-center justify-center gap-2">
        <div className="bg-gold-ink h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"></div>
        {/* The label at rest, in the button's own colour. It slides out and
            fades as the gold label takes its place. */}
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      {/* The label that arrives on hover, in gold, over the expanded dark disc. */}
      <div className="text-gold absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
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
    )
  }

  return (
    <button className={classes} {...props}>
      {inner}
    </button>
  )
}
