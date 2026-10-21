import type { ReactNode } from "react";

/**
 * Shared field chrome for the public forms (volunteer, partner).
 *
 * `Field` wires the label, hint and error text to the control, so
 * `aria-describedby` and `aria-invalid` are set in one place. Doing this by hand
 * at every call site is how one of them ends up missing an id.
 *
 * The id comes from the label. That is unique as long as a page holds one form,
 * which every public form on this site does.
 */
export function inputClass(invalid: boolean): string {
  return `mt-1.5 block w-full min-h-11 rounded-lg border bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-border focus:border-brand-600 focus:ring-brand-600/20"
  }`;
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: {
    id: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    required?: boolean;
  }) => ReactNode;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-accent-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        required,
      })}

      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
