"use client";

import { Link } from "@/i18n/navigation";

import { useEffect, useRef, useState, useTransition } from "react";

import { submitEnquiry } from "@/app/[locale]/(site)/contact/actions";
import type { EnquiryTypeOption } from "@/lib/data/contact";

/**
 * Contact form.
 *
 * Accessibility and anti-spam specifics the spec calls out:
 *
 *   * Errors inline, announced via `aria-live="polite"`, tied to inputs with
 *     `aria-describedby`. A status region is used rather than `alert` because a
 *     validation failure is not an emergency and interrupting a screen reader
 *     mid-form loses more than it communicates.
 *   * Focus moves to the first invalid field on a failed submit.
 *   * Submit shows a pending state and is disabled in flight.
 *   * **Success is server-confirmed** — never optimistic.
 *   * Honeypot field: off-screen and `aria-hidden`, but NOT `display:none`,
 *     because bots skip hidden fields.
 *   * Time trap: the render timestamp is compared server-side.
 *
 * Client-side validation is deliberately minimal — required fields only. The
 * authoritative check runs in the Server Action; duplicating the whole Zod
 * schema here would let the two drift.
 */
export function ContactForm({
  enquiryTypes,
}: {
  enquiryTypes: EnquiryTypeOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // Render timestamp for the server-side time trap.
  //
  // Set in an effect rather than `useRef(Date.now())`: the ref argument is
  // re-evaluated on every render, which the React Compiler flags as an impure
  // call during render. An effect runs once on mount, which is also the more
  // accurate baseline — we want time since the donor could first see the form,
  // not time since the last keystroke.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  // Bumped on every failed submit so the focus effect re-runs even when the
  // same field fails twice in a row.
  const [errorAttempt, setErrorAttempt] = useState(0);

  // Move focus to the first invalid field. An effect is used rather than a
  // rAF after setState: the attribute we select on (`aria-invalid`) does not
  // exist until React has re-rendered, and a frame is not a guarantee.
  useEffect(() => {
    if (errorAttempt === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>(
      "[aria-invalid='true']",
    );
    first?.focus();
  }, [errorAttempt]);

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-brand-600/30 bg-brand-50 p-8"
      >
        <h3 className="text-2xl font-semibold text-brand-600">
          Thank you, your message is with us.
        </h3>
        <p className="measure mt-3 text-ink-muted">
          We reply within three working days. If it is urgent, WhatsApp is faster.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          Your reference is{" "}
          <span className="tabular font-medium text-ink">{sent}</span>, quote it if
          you follow up.
        </p>
      </div>
    );
  }

  function handleSubmit(formData: FormData) {
    setFormError(null);
    // Clear prior errors so a stale message never sits beside a fixed field.
    setErrors({});

    const value = (k: string) => String(formData.get(k) ?? "");

    // Cheap client check first, purely to save a round trip. The Server Action
    // re-validates everything regardless — this is a convenience, not a gate.
    const local: Record<string, string> = {};
    const email = value("email").trim();
    if (!email) {
      local.email = "Enter your email address so we can reply.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      local.email = "Enter an email address we can reply to, for example you@example.org.";
    }
    if (value("message").trim().length < 20)
      local.message = "Please write at least 20 characters so we can help.";
    if (!value("enquiryType")) local.enquiryType = "Choose what your message is about.";

    if (Object.keys(local).length > 0) {
      setErrors(local);
      setErrorAttempt((n) => n + 1);
      return;
    }

    startTransition(async () => {
      const result = await submitEnquiry({
        name: value("name"),
        email: value("email"),
        phone: value("phone"),
        enquiryType: value("enquiryType"),
        message: value("message"),
        website: value("website"),
        startedAt: startedAt.current,
      });

      if (result.status === "sent") {
        setSent(result.reference);
        return;
      }

      if (result.status === "invalid") {
        setErrors(result.errors);
        setErrorAttempt((n) => n + 1);
        return;
      }

      setFormError(result.message);
    });
  }

  const describedBy = (key: string) => (errors[key] ? `contact-${key}-error` : undefined);

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <h3 className="text-2xl font-semibold text-brand-600">Send us a message</h3>
      <p className="mt-2 text-ink-muted">
        We reply within three working days.
      </p>

      {/* Honeypot. Off-screen, aria-hidden, tabindex -1, never display:none. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-ink">
            Your name <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          {errors.name ? (
            <p id="contact-name-error" className="mt-1 text-sm text-brand-600">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-ink">
              Email <span className="text-brand-600">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy("email")}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
            />
            {errors.email ? (
              <p id="contact-email-error" className="mt-1 text-sm text-brand-600">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="contact-phone" className="block text-sm font-medium text-ink">
              Phone <span className="text-ink-muted">(optional)</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0712 345 678"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={describedBy("phone")}
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
            />
            {errors.phone ? (
              <p id="contact-phone-error" className="mt-1 text-sm text-brand-600">
                {errors.phone}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="contact-enquiryType" className="block text-sm font-medium text-ink">
            What is this about? <span className="text-brand-600">*</span>
          </label>
          <select
            id="contact-enquiryType"
            name="enquiryType"
            defaultValue="general"
            aria-invalid={errors.enquiryType ? true : undefined}
            aria-describedby={describedBy("enquiryType")}
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
          >
            {enquiryTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.enquiryType ? (
            <p id="contact-enquiryType-error" className="mt-1 text-sm text-brand-600">
              {errors.enquiryType}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-ink">
            Message <span className="text-brand-600">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            required
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message")}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          {errors.message ? (
            <p id="contact-message-error" className="mt-1 text-sm text-brand-600">
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      {/*
        The safeguarding block is MANDATORY, not decorative. A general contact
        form on a girls' organisation's site is a safeguarding risk if a
        disclosure arrives through it and nobody expects it.
      */}
      <div className="mt-6 rounded-xl border-2 border-brand-600/40 bg-brand-50 p-5">
        <p className="text-sm leading-relaxed text-ink">
          <span className="font-semibold text-brand-600">
            Please do not send sensitive personal or safeguarding information
            through this form.
          </span>{" "}
          If you need to report a safeguarding concern about a child, use the{" "}
          <Link href="/legal/safeguarding"
            className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-600"
          >
            safeguarding page
          </Link>{" "}
          instead, so it reaches the right person immediately.
        </p>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-4 min-h-5 text-sm text-brand-600"
      >
        {formError}
      </p>

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="mt-2 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-inverse disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isPending ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-gold-ink/30 border-t-gold-ink"
            />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </button>
    </form>
  );
}
