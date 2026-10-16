import { cn } from "@/lib/utils";

/**
 * Adapted from @aceternity/bento-grid.
 *
 * Fixes applied on install (vendored components are ours to own):
 *  - token colours instead of hardcoded neutrals
 *  - removed `dark:` variants — nothing sets a `.dark` class on <html>
 *  - added `href` + `stat`, and made the card a real link with focus ring
 *  - removed the hover translate: it shifts text while people are reading
 */

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-5 md:auto-rows-[17rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  href,
  stat,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  stat?: string;
}) => {
  const inner = (
    <>
      {header}
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="text-secondary transition-colors group-hover/bento:text-secondary-bright">
          {icon}
        </div>

        <div>
          {stat ? (
            <p className="tabular mb-2 text-2xl font-semibold tracking-tight text-brand-600">
              {stat}
            </p>
          ) : null}

          <h3 className="font-sans text-lg font-semibold tracking-tight text-brand-600">
            {title}
          </h3>

          <p className="measure mt-1.5 text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        </div>
      </div>
    </>
  );

  const shell = cn(
    "group/bento rounded-card border border-brand/20 bg-white p-6 transition-colors duration-200 hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
    className,
  );

  if (!href) {
    return <div className={cn(shell, "flex")}>{inner}</div>;
  }

  return (
    <a href={href} className={cn(shell, "flex")}>
      {inner}
    </a>
  );
};