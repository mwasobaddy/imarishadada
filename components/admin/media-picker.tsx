"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Search, X } from "lucide-react";

import { getPublishableMedia } from "@/app/[locale]/admin/actions/media";
import { Skeleton } from "@/components/ui/skeleton";
import { STATIC_IMAGES, type StaticImage } from "@/lib/data/image-manifest";
import type { MediaOption } from "@/lib/media/option";

export type { MediaOption };

/**
 * Image picker.
 *
 * ## Why a picker and not a text field
 *
 * Every image field used to be a free-text path. That is how a site ends up
 * with `images/foo.jpg` next to `/images/foo.avif` next to a typo that renders
 * a broken image nobody notices until a funder points at it. A path is not a
 * thing an editor should be typing.
 *
 * ## What it lists
 *
 * Both sources, in one list:
 *
 *  - **Shipped** — the photographs in `public/images/`, read from a manifest
 *    generated at build time. These are the reviewed, consented images the site
 *    actually uses, and they are the ones an editor wants almost every time.
 *  - **Uploaded** — anything in the `media` table, added through the panel.
 *
 * A picker that showed only the database would be an empty grid today.
 *
 * ## Alt text is offered, not forced
 *
 * Selecting an image fills the path. If the image carries alt text (uploaded
 * media always does), the picker offers it with one click rather than
 * overwriting what the editor has already written — the alt for a team portrait
 * and the alt for the same portrait in a story are not the same sentence.
 */
export function MediaPicker({
  value,
  onChange,
  label = "Image",
  hint,
  id,
  onUseAlt,
  compact = false,
}: {
  value: string;
  onChange: (path: string) => void;
  label?: string;
  hint?: string;
  id?: string;
  /**
   * Called when the editor accepts the selected image's alt text.
   *
   * Offered rather than applied: the alt for a team portrait and the alt for
   * the same portrait inside a story are not the same sentence, and silently
   * overwriting what someone has already written is how that gets lost.
   */
  onUseAlt?: (alt: string) => void;
  /**
   * Drop the label row and tighten the trigger.
   *
   * Used inside a repeating list, where the row is already labelled by its
   * position and eight "Image" labels stacked down the page is noise.
   */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * The uploaded files, fetched here rather than passed down.
   *
   * Every editor with a picture field needs them — a post cover, a partner
   * logo, a story photograph, a programme photograph — and threading a list
   * through every page that renders an editor was plumbing with no end. The
   * list is the same everywhere, so the picker asks for it.
   *
   * Only the public bucket is offered: a file in a private one is reached
   * through a signed URL that expires, and a page pointing at it breaks next
   * month.
   */
  const [uploaded, setUploaded] = useState<MediaOption[]>([]);
  /** Whether the uploaded files have arrived yet. */
  const [uploadedLoaded, setUploadedLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getPublishableMedia()
      .then((options) => {
        if (cancelled) return;
        setUploaded(options);
        setUploadedLoaded(true);
      })
      .catch(() => {
        // A staff member who may not read the library still gets the shipped
        // photographs. The list is a convenience, not the feature.
        if (!cancelled) setUploadedLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const all = useMemo<MediaOption[]>(
    () => [
      ...uploaded,
      ...STATIC_IMAGES.map(
        (i: StaticImage): MediaOption => ({
          path: i.path,
          label: i.label,
          group: i.group,
          width: i.width,
          height: i.height,
          alt: i.alt ?? undefined,
          source: "static",
        }),
      ),
    ],
    [uploaded],
  );

  const groups = useMemo(
    () => ["all", ...Array.from(new Set(all.map((i) => i.group))).sort()],
    [all],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((i) => {
      if (group !== "all" && i.group !== group) return false;
      if (!q) return true;
      return (
        i.label.toLowerCase().includes(q) ||
        i.path.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q)
      );
    });
  }, [all, group, query]);

  const selected = all.find((i) => i.path === value);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function choose(option: MediaOption) {
    onChange(option.path);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={wrapRef} className="relative">
      {!compact && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
          {hint && <span className="text-[11px] text-ink-muted/70">{hint}</span>}
        </div>
      )}

      {/* Trigger — shows the current selection, or the empty state. */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={compact ? `${label}: ${selected?.label ?? "choose an image"}` : undefined}
        className={`flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:border-brand-600/40 ${
          compact ? "" : "mt-1.5"
        }`}
      >
        <span
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-lilac ${
            compact ? "h-10 w-10" : "h-12 w-12"
          }`}
        >
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-4 w-4 text-ink-muted" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">
            {selected?.label ?? (value ? value.split("/").pop() : "Choose an image")}
          </span>
          <span className="block truncate font-mono text-[11px] text-ink-muted">
            {value || "No image selected"}
          </span>
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Remove image"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onChange("");
              }
            }}
            className="shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {/* Alt text the image already carries, offered rather than applied. */}
      {value && selected?.alt && onUseAlt && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">Alt on file:</span>{" "}
            {selected.alt}
          </p>
          <button
            type="button"
            onClick={() => onUseAlt(selected.alt!)}
            className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-brand-600 transition-colors hover:border-brand-600"
          >
            Use this
          </button>
        </div>
      )}

      {value && selected && !selected.alt && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-700">
          No alt text on file for this image. Write one — describe what the
          photograph shows, for someone who cannot see it.
        </p>
      )}

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Choose an image"
          className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${all.length} photographs…`}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none"
            />
          </div>

          {/* Group filter */}
          <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  group === g
                    ? "bg-brand-600 text-brand-50"
                    : "bg-surface-lilac text-ink-muted hover:text-ink"
                }`}
              >
                {g === "all" ? "All" : g}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-ink-muted">
                No image matches “{query}”.
              </p>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {/*
                  The uploaded files are on their way. The tile says so
                  rather than the grid simply being shorter than it will be.
                */}
                {!uploadedLoaded ? (
                  <li>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <Skeleton className="block aspect-square w-full rounded-none" />
                      <span className="block px-1.5 py-1 text-[10px] text-ink-muted">
                        Loading…
                      </span>
                    </div>
                  </li>
                ) : null}
                {results.map((option) => {
                  const active = option.path === value;
                  return (
                    <li key={option.path}>
                      <button
                        type="button"
                        onClick={() => choose(option)}
                        title={`${option.label}\n${option.path}`}
                        className={`group block w-full overflow-hidden rounded-lg border text-left transition-colors ${
                          active
                            ? "border-brand-600 ring-2 ring-brand-600/20"
                            : "border-border hover:border-brand-600/50"
                        }`}
                      >
                        <span className="block aspect-square overflow-hidden bg-surface-lilac">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={option.path}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </span>
                        <span className="block truncate px-1.5 py-1 text-[10px] text-ink-muted">
                          {option.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Offer the alt text when the image has one. */}
          {selected?.alt && (
            <div className="border-t border-border bg-surface px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted/60">
                Alt text on file
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {selected.alt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Alt text carried by an uploaded media row, offered to the caller. */
export function altFor(options: MediaOption[], path: string): string | undefined {
  return options.find((o) => o.path === path)?.alt;
}
