"use client";

import { useTranslations } from "next-intl";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

import type { CurrencyCode, PaymentRail } from "@/lib/donate/money";
import { formatMoney } from "@/lib/donate/money";
import type { TaxReceipt } from "@/lib/data/donate";
import { PHONE_DISPLAY, WHATSAPP_LINK } from "@/lib/contact/channels";

/**
 * Order summary and the Pay button.
 *
 * ## The fee is a question, not a line item
 *
 * The card networks charge the organisation, not the donor. The previous
 * version passed that cost on silently — `KES 500 + KES 15.05 = KES 515.05`,
 * with no explanation and no way to decline, as the last thing a donor saw
 * before paying.
 *
 * It is now a checkbox, ticked by default, that **is** the fee line: ticked,
 * the total includes it; unticked, the row disappears and the organisation
 * absorbs it. Fundraise Up reports 92% of donors cover the fee when asked, so
 * asking keeps more money and gives the donor the choice.
 *
 * ## The trust strip says only what is true
 *
 * It used to be four hardcoded lines with emoji icons, and two of them were
 * wrong on the live page:
 *
 *   * "Tax receipt emailed immediately" sat directly above the real tax
 *     statement, "Receipts issued on request." Two contradictory claims about
 *     tax, one screen apart. The roadmap is explicit that tax language must be
 *     accurate — it is a legal claim, not marketing copy.
 *   * "M-Pesa gives directly to Imarisha Dada" was shown while the M-Pesa rail
 *     was disabled.
 *
 * So the lines are now built from the rail configuration and the actual tax
 * setting. A claim cannot drift from the thing it describes.
 *
 * Icons are inline SVG. The project's design rules forbid emoji as UI icons.
 *
 * ## Pay states
 *
 * idle → aria-busy + spinner → success/error. There is no optimistic success
 * anywhere in this flow: a donor who sees "thank you" for a payment that failed
 * will not donate again, and will tell everyone.
 */
export function OrderSummary({
  amount,
  currency,
  feeIfCovered,
  coverFee,
  onCoverFeeChange,
  total,
  cadence,
  outcomeLabel,
  rail,
  rails,
  tax,
  status,
  error,
  onPay,
  pendingLabel,
  canPay = true,
}: {
  amount: number;
  currency: CurrencyCode;
  /** What the fee would be if the donor ticked the box. Drives the label. */
  feeIfCovered: number;
  coverFee: boolean;
  onCoverFeeChange: (next: boolean) => void;
  total: number;
  cadence: "one_time" | "monthly";
  outcomeLabel: string;
  rail: PaymentRail | null;
  /** Rail configuration, so the trust strip only claims what is switched on. */
  rails: Record<PaymentRail, { enabled: boolean }>;
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

  const showFeeChoice = feeIfCovered > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-brand-600">{t("summary.heading")}</h2>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">
            {t("summary.amount")}
            {cadence === "monthly" ? ` ${t("summary.monthlySuffix")}` : ""}
          </dt>
          <dd className="font-semibold text-ink tabular">
            {formatMoney(amount, currency)}
          </dd>
        </div>
      </dl>

      {/*
        The checkbox is the fee line. Real `<input type="checkbox">` so the
        keyboard, the screen reader and the form semantics all work; a styled
        `div` with an onClick would give none of them.
      */}
      {showFeeChoice ? (
        <label className="mt-3 flex cursor-pointer gap-3 rounded-lg border border-border bg-brand-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={coverFee}
            onChange={(e) => onCoverFeeChange(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]"
          />
          <span className="leading-relaxed">
            <span className="font-medium text-ink">
              {t("summary.coverFeeLabel", {
                fee: formatMoney(feeIfCovered, currency),
              })}
            </span>{" "}
            <span className="text-ink-muted">
              {t("summary.coverFeeWhy", { amount: formatMoney(amount, currency) })}
            </span>
            {!coverFee ? (
              <span className="mt-1 block text-xs text-ink-muted">
                {t("summary.coverFeeDeclined")}
              </span>
            ) : null}
          </span>
        </label>
      ) : null}

      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-border pt-3 text-base">
        <span className="font-semibold text-ink">{t("summary.total")}</span>
        <span className="font-semibold text-brand-600 tabular">
          {formatMoney(total, currency)}
        </span>
      </div>

      {outcomeLabel ? (
        <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-ink">
          {t("summary.funds")} <span className="font-medium">{outcomeLabel}</span>.
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

      <InteractiveHoverButton
        type="button"
        onClick={onPay}
        disabled={disabled}
        aria-busy={busy}
        aria-label={
          busy
            ? pendingLabel
            : `Give ${formatMoney(total, currency)}${rail ? ` by ${rail}` : ""}`
        }
        className="mt-4 min-h-13 w-full rounded-full bg-gold px-8 text-base font-semibold text-gold-ink disabled:cursor-not-allowed disabled:opacity-70"
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
      </InteractiveHoverButton>

      {/* ---- Trust. Built from the live configuration, never hardcoded. ---- */}
      <ul className="mt-6 space-y-2.5 text-sm text-ink-muted">
        <li className="flex gap-2.5">
          <LockIcon />
          <span>{t("trust.encrypted")}</span>
        </li>

        {rails.mpesa.enabled ? (
          <li className="flex gap-2.5">
            <PhoneIcon />
            <span>{t("trust.mpesa")}</span>
          </li>
        ) : null}

        {/* The real tax setting, not a friendlier paraphrase of it. */}
        <li className="flex gap-2.5">
          <ReceiptIcon />
          <span>{tax.statement}</span>
        </li>

        <li className="flex gap-2.5">
          <QuestionIcon />
          <span>
            {t("trust.questions")}{" "}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
            >
              WhatsApp {PHONE_DISPLAY}
            </a>
          </span>
        </li>
      </ul>

      {tax.mode === "fiscal_sponsor" && tax.fiscalSponsor ? (
        <p className="mt-3 text-xs text-ink-muted">
          {t("trust.fiscalSponsor", { sponsor: tax.fiscalSponsor })}
        </p>
      ) : null}
    </div>
  );
}

const ICON = "mt-0.5 size-4 shrink-0 text-brand-600";

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
