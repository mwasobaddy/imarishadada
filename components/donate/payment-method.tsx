"use client";

import { useTranslations } from "next-intl";

import type { PaymentRail } from "@/lib/donate/money";
import type { PaymentRails } from "@/lib/data/donate";

/**
 * Payment method selector.
 *
 * All three rails get equal visual weight. The spec is explicit that they must
 * not be hidden behind geo-detect or a locale heuristic — a donor in Nairobi
 * and a donor in Berlin see the same three options in the same order.
 *
 * A disabled rail stays visible with a reason. Silently dropping M-Pesa while
 * Daraja is unapproved would leave every Kenyan donor wondering where their
 * national payment method went, which reads as a broken page rather than a
 * deliberate choice.
 */
export function PaymentMethod({
  rails,
  selected,
  onSelect,
  bankUnavailableReason,
  errorId,
}: {
  rails: PaymentRails;
  selected: PaymentRail | null;
  onSelect: (rail: PaymentRail) => void;
  bankUnavailableReason?: string;
  errorId?: string;
}) {
  const t = useTranslations("donate");
  const order: PaymentRail[] = ["mpesa", "card", "bank"];

  return (
    <fieldset aria-describedby={errorId}>
      <legend className="text-base font-semibold text-ink">
        How would you like to give?
      </legend>

      <div className="mt-4 space-y-3" role="radiogroup" aria-label={t("method.ariaLabel")}>
        {order.map((rail) => {
          const config = rails[rail];
          if (!config) return null;

          // The bank reason must disable ONLY the bank rail. Applying it
          // globally would switch off every method because bank details happen
          // to be missing — leaving a donor with no way to give at all.
          const bankBlocked = rail === "bank" && Boolean(bankUnavailableReason);
          const disabled = !config.enabled || bankBlocked;
          const checked = selected === rail;

          return (
            <label
              key={rail}
              className={`flex min-h-11 items-start gap-3 rounded-xl border p-4 transition-colors ${
                disabled
                  ? "cursor-not-allowed border-border bg-surface-lilac opacity-70"
                  : checked
                    ? "cursor-pointer border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                    : "cursor-pointer border-border bg-card hover:border-brand-600/40"
              }`}
            >
              <input
                type="radio"
                name="payment-rail"
                value={rail}
                checked={checked}
                disabled={disabled}
                onChange={() => onSelect(rail)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                  checked ? "border-brand-600" : "border-border"
                }`}
              >
                {checked ? <span className="size-2.5 rounded-full bg-brand-600" /> : null}
              </span>

              <span className="flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{config.label}</span>
                  {config.recommended && config.enabled ? (
                    <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                      Recommended
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {disabled && rail === "bank" && bankUnavailableReason
                    ? bankUnavailableReason
                    : config.hint}
                </span>
                {/*
                  A recommendation must say why. "Recommended" with no reason is
                  exactly the dark pattern the spec warns about.
                */}
                {config.recommended && config.enabled && config.recommendedReason ? (
                  <span className="mt-1 block text-sm text-ink-muted">
                    {config.recommendedReason}
                  </span>
                ) : null}
                {!config.enabled && rail !== "bank" ? (
                  <span className="mt-1 block text-sm text-ink-muted">
                    Coming soon — we are completing setup.
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
