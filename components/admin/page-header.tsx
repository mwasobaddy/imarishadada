import type { ReactNode } from "react";

/**
 * The header every admin page opens with.
 *
 * One pattern for all of them: an eyebrow for the section, an H1 for the
 * page, a line explaining what the page is for, and the primary action on
 * the right. When the action is a "New …" link it belongs on the right of
 * the title on a wide screen and below it on a narrow one.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  count,
}: {
  /** Small caps label for the section, e.g. "Content". */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Primary action — usually a "New …" link. */
  action?: ReactNode;
  /** Optional count shown next to the title, e.g. "12 items". */
  count?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-brand-600/70">
            {eyebrow}
          </p>
        )}
        <div className="flex items-baseline gap-3">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {count && <span className="text-sm text-ink-muted">{count}</span>}
        </div>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** The "New …" button used in page headers. */
export function PrimaryAction({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
      {children}
    </a>
  );
}

/** Empty state for a table with no rows. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-lilac">
        <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h7m3-3l4 4m-1.5-8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Toolbar shell for search + filters above a table. */
export function TableToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}

/** Search input used in table toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
      </svg>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
      />
    </div>
  );
}
