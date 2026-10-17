import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Placeholder imagery slot.
 *
 * These are deliberate placeholders, not real photography — see the disclosure
 * in the footer and doc/roadmap. Each slot states what the eventual image
 * should depict so a designer or the field team can drop in the real asset
 * without guessing, and so nobody mistakes a placeholder for documentation.
 *
 * `alt` is required and must describe the eventual image, not the placeholder.
 * A placeholder is still real content to a screen reader, and describing
 * "placeholder image" would be useless once the photo lands.
 */
export function PlaceholderImage({
  src,
  alt,
  /** Short caption rendered under the image; explains what belongs here. */
  note,
  className,
  sizes = "(max-width: 768px) 92vw, 45vw",
  priority = false,
}: {
  src: string;
  alt: string;
  note?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div className="relative overflow-hidden rounded-card bg-surface-lilac">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          sizes={sizes}
          priority={priority}
          className="h-full w-full object-cover"
        />
      </div>

      {note ? (
        <figcaption className="text-xs leading-relaxed text-ink-muted">{note}</figcaption>
      ) : null}
    </figure>
  );
}
