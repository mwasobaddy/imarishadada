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
 * The hover effect — the dot that scales to fill the button, the label that
 * slides out, and the arrow that slides in — is the same in both modes.
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
      <div className="flex items-center justify-center gap-2">
        <div className="bg-primary h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="text-primary-foreground absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
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
