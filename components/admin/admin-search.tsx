"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search as SearchIcon } from "lucide-react";

import {
  searchAdmin,
  type AdminSearchResult,
} from "@/app/[locale]/admin/actions/search";

/**
 * The admin search.
 *
 * ## Why it exists
 *
 * The header had a button that said "Search ⌘K" and did nothing. It was the
 * one control in the admin that looked like it worked and did not, which is
 * worse than not having it: an editor presses it, nothing happens, and they
 * conclude there is no search.
 *
 * ## What it searches
 *
 * The content — a story, a post, a programme, a team member, a photograph.
 * And with nothing typed, the pages of the admin itself, so it doubles as the
 * way to get somewhere.
 *
 * ## The keyboard
 *
 * ⌘K (or Ctrl+K) opens it from anywhere. The arrow keys move through the
 * results, Enter goes to the one that is highlighted, Escape closes it. A
 * search that can only be driven with a mouse is not a search.
 */
export function AdminSearch({
  pages,
}: {
  /** The admin's own pages, for the empty state. */
  pages: { href: string; label: string; group: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(0);
  }, []);

  // ⌘K / Ctrl+K from anywhere in the admin.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  // The input takes the focus as soon as the palette opens, so the first
  // thing typed is a search and not a keystroke that goes nowhere.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Search as they type, once they have typed enough to be worth asking
  // about. Two characters: one character matches most of the database.
  //
  // The reset when the query falls below two characters happens in the input
  // handler rather than here: an effect that clears state it did not set is
  // a render it cannot explain.
  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) return;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        const found = await searchAdmin(trimmed);
        if (!cancelled) {
          setResults(found);
          setActive(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const items = useMemo(() => {
    if (query.trim().length >= 2) {
      return results.map((result) => ({
        href: result.href,
        label: result.label,
        detail: result.detail,
        kind: result.kind,
      }));
    }
    return pages.map((page) => ({
      href: page.href,
      label: page.label,
      detail: page.group,
      kind: "Go to",
    }));
  }, [query, results, pages]);

  function go(href: string) {
    close();
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (items.length === 0 ? 0 : (current + 1) % items.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) =>
        items.length === 0 ? 0 : (current - 1 + items.length) % items.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[active];
      if (item) go(item.href);
    }
  }

  // Keep the highlighted row in view when the arrow keys move it.
  useEffect(() => {
    const list = listRef.current;
    const option = list?.children[active] as HTMLElement | undefined;
    option?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 sm:flex"
        aria-label="Search the admin"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted lg:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 px-4 pt-[10vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search the admin"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <SearchIcon className="h-4 w-4 shrink-0 text-ink-muted" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  if (value.trim().length < 2) {
                    setResults([]);
                    setLoading(false);
                    setActive(0);
                  } else {
                    setLoading(true);
                  }
                }}
                onKeyDown={onKeyDown}
                placeholder="Search stories, posts, people, media…"
                aria-label="Search the admin"
                aria-controls="admin-search-results"
                aria-activedescendant={
                  items.length > 0 ? `admin-search-option-${active}` : undefined
                }
                className="w-full bg-transparent py-4 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={close}
                className="shrink-0 text-xs font-medium text-ink-muted hover:text-ink"
              >
                Esc
              </button>
            </div>

            <ul
              id="admin-search-results"
              ref={listRef}
              role="listbox"
              aria-label="Search results"
              className="max-h-[50vh] overflow-y-auto p-2"
            >
              {items.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-ink-muted">
                  {loading
                    ? "Searching…"
                    : query.trim().length >= 2
                      ? `Nothing found for “${query.trim()}”.`
                      : "Type at least two letters to search."}
                </li>
              ) : (
                items.map((item, index) => (
                  <li
                    key={`${item.href}-${index}`}
                    id={`admin-search-option-${index}`}
                    role="option"
                    aria-selected={index === active}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(item.href)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        index === active ? "bg-brand-50" : "hover:bg-surface-lilac"
                      }`}
                    >
                      <FileText
                        className="h-4 w-4 shrink-0 text-ink-muted"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {item.label}
                        </span>
                        {item.detail ? (
                          <span className="block truncate text-xs text-ink-muted">
                            {item.kind}
                            {item.detail ? ` · ${item.detail}` : ""}
                          </span>
                        ) : (
                          <span className="block text-xs text-ink-muted">
                            {item.kind}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-ink-muted">
              <span>↑↓ to move</span>
              <span>Enter to open</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
