"use client";

import { useTranslations } from "next-intl";

import { useId, useMemo } from "react";

import type { Cadence, CurrencyCode, Tier } from "@/lib/donate/money";
import { formatMoney, convertAmount, SETTLEMENT_CURRENCY } from "@/lib/donate/money";

/**
 * Giving tier selector.
 *
 * Built by hand, not from the registry — the spec is explicit that no registry
 * component can do dynamic, admin-editable, locale-formatted tiers.
 *
 * Accessibility notes, because this is the highest-traffic control on the site:
 *   * A real `<fieldset>`/`<legend>`, so the group has a programmatic name.
 *   * Real `<input type="radio">`, visually hidden but still focusable, so
 *     arrow keys, form semantics and screen readers work for free. A click
 *     handler on a `div` would provide none of that.
 *   * `aria-describedby` wires each outcome label to its radio.
 *   * The cadence filter is its own radio group with its own legend, so a
 *     screen reader user can jump between "how often" and "how much" rather
 *     than walking through every card.
 *
 * Selection is announced by the radios themselves; no live region is needed
 * and adding one would double-announce.
 */
export function TierSelector({
  tiers,
  cadence,
  onCadenceChange,
  currency,
  onCurrencyChange,
  selectedSlug,
  onSelect,
  customAmount,
  onCustomAmountChange,
  errorId,
}: {
  tiers: Tier[];
  cadence: Cadence;
  onCadenceChange: (c: Cadence) => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  selectedSlug: string;
  onSelect: (slug: string) => void;
  customAmount: string;
  onCustomAmountChange: (value: string) => void;
  errorId?: string;
}) {
  const t = useTranslations("donate");
  const groupId = useId();
  const customId = useId();

  const visible = useMemo(
    () => tiers.filter((t) => t.cadence === cadence).sort((a, b) => a.sortOrder - b.sortOrder),
    [tiers, cadence],
  );

  // A tier selected under the other cadence must not linger as the submitted
  // value, or we would silently charge the wrong amount.
  const activeSlug =
    visible.some((t) => t.slug === selectedSlug) ? selectedSlug : "";

  return (
    <div className="space-y-8">
      {/* ---- How often ------------------------------------------------- */}
      <fieldset>
        <legend className="text-base font-semibold text-ink">{t("frequency.heading")}</legend>
        <div className="mt-3 flex gap-3" role="radiogroup" aria-label={t("frequency.ariaLabel")}>
          {(["once", "monthly"] as const).map((option) => {
            const value: Cadence = option === "once" ? "one_time" : "monthly";
            const checked = cadence === value;
            return (
              <label
                key={option}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  checked
                    ? "border-brand-600 bg-brand-50 text-brand-600"
                    : "border-border bg-card text-ink-muted hover:border-brand-600/40"
                }`}
              >
                <input
                  type="radio"
                  name={`${groupId}-cadence`}
                  value={option}
                  checked={checked}
                  onChange={() => onCadenceChange(value)}
                  className="sr-only"
                />
                {option === "once" ? t("frequency.once") : t("frequency.monthly")}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ---- Currency -------------------------------------------------- */}
      <div>
        <label
          htmlFor={`${groupId}-currency`}
          className="block text-base font-semibold text-ink"
        >
          Currency
        </label>
        <p className="mt-1 text-sm text-ink-muted">
          You are charged in the currency you choose. We record both amounts.
        </p>
        <select
          id={`${groupId}-currency`}
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
          className="mt-3 min-h-11 rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink"
        >
          <option value="KES">KSh — Kenyan shilling</option>
          <option value="USD">USD — US dollar</option>
          <option value="GBP">GBP — Pound sterling</option>
          <option value="EUR">EUR — Euro</option>
        </select>
      </div>

      {/* ---- Amount ---------------------------------------------------- */}
      <fieldset aria-describedby={errorId}>
        <legend className="text-base font-semibold text-ink">{t("amount.heading")}</legend>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {visible.map((tier) => {
            const checked = activeSlug === tier.slug;
            const display = convertAmount(
              tier.amount,
              SETTLEMENT_CURRENCY,
              currency,
            );
            const outcomeId = `${groupId}-${tier.slug}-outcome`;

            return (
              <label
                key={tier.slug}
                className={`flex min-h-11 cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
                  checked
                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                    : "border-border bg-card hover:border-brand-600/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`${groupId}-amount`}
                    value={tier.slug}
                    checked={checked}
                    onChange={() => onSelect(tier.slug)}
                    aria-describedby={outcomeId}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                      checked ? "border-brand-600" : "border-border"
                    }`}
                  >
                    {checked ? <span className="size-2.5 rounded-full bg-brand-600" /> : null}
                  </span>
                  <span className="text-lg font-semibold text-brand-600">
                    {formatMoney(display, currency)}
                    {tier.cadence === "monthly" ? (
                      <span className="text-sm font-normal text-ink-muted"> / month</span>
                    ) : null}
                  </span>
                </span>
                <span
                  id={outcomeId}
                  className="mt-2 pl-8 text-sm text-ink-muted"
                >
                  {tier.outcomeLabel}
                </span>
              </label>
            );
          })}
        </div>

        {/* Other amount */}
        <label
          className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
            activeSlug === "custom"
              ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
              : "border-border bg-card hover:border-brand-600/40"
          }`}
        >
          <input
            type="radio"
            name={`${groupId}-amount`}
            value="custom"
            checked={activeSlug === "custom"}
            onChange={() => onSelect("custom")}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
              activeSlug === "custom" ? "border-brand-600" : "border-border"
            }`}
          >
            {activeSlug === "custom" ? (
              <span className="size-2.5 rounded-full bg-brand-600" />
            ) : null}
          </span>
          <span className="text-sm font-medium text-ink">{t("amount.other")}</span>
        </label>

        {activeSlug === "custom" ? (
          <div className="mt-3 pl-8">
            <label htmlFor={customId} className="block text-sm text-ink-muted">
              Amount in {currency === "KES" ? "shillings" : currency}
            </label>
            <input
              id={customId}
              type="number"
              inputMode="numeric"
              min={1}
              step={currency === "KES" ? 50 : 1}
              value={customAmount}
              onChange={(e) => onCustomAmountChange(e.target.value)}
              className="mt-1 min-h-11 w-40 rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink"
            />
          </div>
        ) : null}
      </fieldset>
    </div>
  );
}
