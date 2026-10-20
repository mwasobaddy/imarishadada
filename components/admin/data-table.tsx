import type { ReactNode } from "react";

/**
 * Table shell for the admin panel.
 *
 * Every list page renders the same table chrome: a sticky-ish header row with
 * small caps labels, hairline row dividers, and a hover state. Centralising
 * it means a new list page inherits the look rather than reinventing it.
 */
export function DataTable({
  headers,
  children,
  caption,
}: {
  headers: string[];
  children: ReactNode;
  caption?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-border bg-surface">
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted/70"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/** A coloured status pill. */
export function StatusBadge({
  tone,
  children,
}: {
  tone: "active" | "draft" | "inactive" | "warning" | "info" | "neutral";
  children: ReactNode;
}) {
  const tones = {
    active: "bg-green-50 text-green-700 ring-green-600/20",
    draft: "bg-gray-100 text-gray-600 ring-gray-500/20",
    inactive: "bg-gray-100 text-gray-500 ring-gray-500/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
    info: "bg-brand-50 text-brand-700 ring-brand-600/20",
    neutral: "bg-surface-lilac text-ink-muted ring-ink-muted/20",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** A row action link. */
export function RowAction({
  href,
  children,
  tone = "default",
}: {
  href: string;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <a
      href={href}
      className={`text-sm font-medium transition-colors ${
        tone === "danger"
          ? "text-red-600 hover:text-red-700 hover:underline"
          : "text-brand-600 hover:text-brand-700 hover:underline"
      }`}
    >
      {children}
    </a>
  );
}
