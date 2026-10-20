"use client";

import { forwardRef, type ReactNode } from "react";

/**
 * Pill input for the auth forms.
 *
 * The reference design uses fully-rounded inputs with a leading icon and a
 * trailing action (the password eye). Matching that here keeps the three
 * auth pages consistent with each other and with the card.
 */
export const AuthInput = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label?: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
    minLength?: number;
    /** Icon rendered at the start of the field. */
    icon?: ReactNode;
    /** Control rendered at the end of the field (e.g. the eye toggle). */
    trailing?: ReactNode;
    /** Right-aligned helper under the field, e.g. "Forgot password?". */
    hint?: ReactNode;
  }
>(function AuthInput(
  {
    id,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    autoComplete,
    required,
    minLength,
    icon,
    trailing,
    hint,
  },
  ref,
) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative mt-1.5">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full rounded-full border border-border bg-card py-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors ${
            icon ? "pl-11" : "pl-4"
          } ${trailing ? "pr-11" : "pr-4"}`}
        />
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        )}
      </div>
      {hint && <div className="mt-2 text-right text-xs">{hint}</div>}
    </div>
  );
});
