"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Search, X } from "lucide-react";

import { STATIC_IMAGES, type StaticImage } from "@/lib/data/image-manifest";

export type MediaOption = {
  path: string;
  label: string;
  group: string;
  width: number;
  height: number;
  /** Alt text if we have it. Static images do not carry one; uploaded media does. */
  alt?: string;
  /** Present only for uploaded media. */
  consentTier?: string;
  /** `static` = shipped in the repo, `uploaded` = in the media table. */
  source: "static" | "uploaded";
};

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
  uploaded = [],
  id,
}: {
  value: string;
  onChange: (path: string) => void;
  label?: string;
  hint?: string;
  /** Rows from the `media` table, passed down from the server. */
  uploaded?: MediaOption[];
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint && <span className="text-[11px] text-ink-muted/70">{hint}</span>}
      </div>

      {/* Trigger — shows the current selection, or the empty state. */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="mt-1.5 flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:border-brand-600/40"
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-lilac">
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
              placeholder="Search 48 photographs…"
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
