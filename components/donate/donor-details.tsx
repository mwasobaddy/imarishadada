"use client";

import { useTranslations } from "next-intl";

import { useId } from "react";

import type { Cadence } from "@/lib/donate/money";

/**
 * Donor details.
 *
 * Deliberately minimal. The spec forbids collecting postal address, date of
 * birth or ID number — none are needed for an e-receipt, and every extra field
 * costs completions and adds safeguarding risk for a charity working with
 * girls aged 9–16.
 *
 * Email is required because it is the receipt. Name and phone are optional.
 *
 * The recurring consent block appears only for a monthly gift, and must be
 * explicitly ticked. Ticking "monthly" is not consent to be charged monthly:
 * a silent recurring charge is the fastest way to lose a regulator.
 */
export function DonorDetails({
  email,
  name,
  phone,
  onEmailChange,
  onNameChange,
  onPhoneChange,
  cadence,
  consentRecurring,
  consentUpdates,
  onConsentRecurringChange,
  onConsentUpdatesChange,
  showPhoneHint,
  errors,
}: {
  email: string;
  name: string;
  phone: string;
  onEmailChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  cadence: Cadence;
  consentRecurring: boolean;
  consentUpdates: boolean;
  onConsentRecurringChange: (v: boolean) => void;
  onConsentUpdatesChange: (v: boolean) => void;
  /** M-Pesa needs the number to be collectable, so it becomes required there. */
  showPhoneHint: boolean;
  errors: Record<string, string>;
}) {
  const t = useTranslations("donate");
  // The validation messages live in a top-level `errors` namespace, not under
  // `donate`, so they need their own translator.
  const te = useTranslations("errors");
  const id = useId();

  const field = (key: string) =>
    errors[key] ? `${id}-${key}-error` : undefined;

  const describedBy = (key: string) =>
    [errors[key] ? `${id}-${key}-error` : null, key === "phone" && showPhoneHint ? `${id}-phone-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-medium text-ink">
          Email <span className="text-brand-600">*</span>
        </label>
        <p className="mt-1 text-sm text-ink-muted">
          We send your receipt here immediately.
        </p>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink"
        />
        {errors.email ? (
          <p id={field("email")} className="mt-1 text-sm text-brand-600">
            {te(errors.email)}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="block text-sm font-medium text-ink">
            Name <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id={`${id}-name`}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label htmlFor={`${id}-phone`} className="block text-sm font-medium text-ink">
            Mobile number{" "}
            <span className="text-ink-muted">
              {showPhoneHint ? "" : "(optional)"}
            </span>
          </label>
          {showPhoneHint ? (
            <p id={`${id}-phone-hint`} className="mt-1 text-sm text-ink-muted">
              Required for M-Pesa. We send the payment prompt to this number.
            </p>
          ) : null}
          <input
            id={`${id}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required={showPhoneHint}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="0712 345 678"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone")}
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink"
          />
          {errors.phone ? (
            <p id={field("phone")} className="mt-1 text-sm text-brand-600">
              {te(errors.phone)}
            </p>
          ) : null}
        </div>
      </div>

      {/* ---- Consent --------------------------------------------------- */}
      {cadence === "monthly" ? (
        <fieldset className="rounded-xl border border-brand-600/40 bg-brand-50 p-4">
          <legend className="px-1 text-sm font-semibold text-brand-600">
            {t("consent.heading")}
          </legend>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={consentRecurring}
              onChange={(e) => onConsentRecurringChange(e.target.checked)}
              aria-invalid={errors.consentRecurring ? true : undefined}
              aria-describedby={field("consentRecurring")}
              className="mt-1 size-5 shrink-0 accent-[#5B2A86]"
            />
            <span>
              {t("consent.body")}
              <span className="text-brand-600"> *</span>
            </span>
          </label>

          {errors.consentRecurring ? (
            <p id={field("consentRecurring")} className="mt-2 pl-8 text-sm text-brand-600">
              {te(errors.consentRecurring)}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={consentUpdates}
          onChange={(e) => onConsentUpdatesChange(e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-[#5B2A86]"
        />
        <span>{t("receipt.optIn")}</span>
      </label>
    </div>
  );
}
