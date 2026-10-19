"use client";

import { useTranslations } from "next-intl";

import type { CurrencyCode, PaymentRail } from "@/lib/donate/money";
import { formatMoney } from "@/lib/donate/money";
import type { TaxReceipt } from "@/lib/data/donate";
import { PHONE_DISPLAY } from "@/lib/contact/channels";

/**
 * Order summary and the Pay button.
 *
 * The fee is shown **before** Pay is pressed. The spec is blunt that "KSh 500
 * + KSh 18 processing" beats a surprise at confirmation — international donors
 * hit non-obvious conversion fees, and disclosing it here is the difference
 * between a donor and a chargeback.
 *
 * Pay states are idle → aria-busy + spinner → success/error. There is no
 * optimistic success anywhere in this flow: a donor who sees "thank you" for a
 * payment that failed will not donate again, and will tell everyone.
 */
export function OrderSummary({
  amount,
  currency,
  fee,
  total,
  cadence,
  outcomeLabel,
  rail,
  tax,
  status,
  error,
  onPay,
  pendingLabel,
  canPay = true,
}: {
  amount: number;
  currency: CurrencyCode;
  fee: number;
  total: number;
  cadence: "one_time" | "monthly";
  outcomeLabel: string;
  rail: PaymentRail | null;
  tax: TaxReceipt;
  status: "idle" | "pending" | "error";
  error?: string | null;
  onPay: () => void;
  pendingLabel: string;
  /** False until an amount and a rail are chosen; disables Pay. */
  canPay?: boolean;
}) {
  const t = useTranslations("donate");
  const busy = status === "pending";
  const disabled = busy || !canPay;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-brand-600">{t("summary.heading")}</h2>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">
            Amount
            {cadence === "monthly" ? " (monthly)" : ""}
          </dt>
          <dd className="font-semibold text-ink tabular">
            {formatMoney(amount, currency)}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">{t("summary.processingFee")}</dt>
          <dd className="text-ink tabular">
            {fee > 0 ? formatMoney(fee, currency) : t("summary.noFee")}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
          <dt className="font-semibold text-ink">{t("summary.total")}</dt>
          <dd className="font-semibold text-brand-600 tabular">
            {formatMoney(total, currency)}
          </dd>
        </div>
      </dl>

      {outcomeLabel ? (
        <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-ink">
          This funds <span className="font-medium">{outcomeLabel}</span>.
        </p>
      ) : null}

      {/*
        Errors are announced. `aria-live="polite"` rather than an alert, because
        a failed payment is not an emergency — interrupting a screen reader
        mid-form loses more than it communicates.
      */}
      <p
        role="status"
        aria-live="polite"
        className="mt-4 min-h-5 text-sm text-brand-600"
      >
        {status === "error" && error ? error : null}
      </p>

      <button
        type="button"
        onClick={onPay}
        disabled={disabled}
        aria-busy={busy}
        aria-label={
          busy
            ? pendingLabel
            : `Give ${formatMoney(total, currency)}${rail ? ` by ${rail}` : ""}`
        }
        className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-inverse disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-gold-ink/30 border-t-gold-ink"
            />
            {pendingLabel}
          </>
        ) : (
          <>{t("summary.give", { amount: formatMoney(total, currency) })}</>
        )}
      </button>

      {/* ---- Trust ----------------------------------------------------- */}
      <ul className="mt-6 space-y-2 text-sm text-ink-muted">
        <li>🔒 Encrypted payment. We never store your card details.</li>
        <li>🇰🇪 M-Pesa gives directly to Imarisha Dada.</li>
        <li>🧾 Tax receipt emailed immediately.</li>
        <li>❓ Questions? WhatsApp {PHONE_DISPLAY}</li>
      </ul>

      <p className="mt-4 text-xs text-ink-muted">{tax.statement}</p>
    </div>
  );
}
