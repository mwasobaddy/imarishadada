import type { ElementType, ReactNode } from "react";

/**
 * Single source of truth for the horizontal page gutter. Every full-bleed
 * section previously repeated `mx-auto max-w-6xl px-5 sm:px-8`, which made it
 * easy for a new page to pick a different max-width and break the vertical
 * rhythm against its neighbours.
 */
export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={className ? `mx-auto max-w-6xl px-5 sm:px-8 ${className}` : "mx-auto max-w-6xl px-5 sm:px-8"}>
      {children}
    </Tag>
  );
}
