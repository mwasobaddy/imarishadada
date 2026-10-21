"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { submitPartnerEnquiry } from "@/app/[locale]/(site)/partner/actions";
import { Field, inputClass } from "@/components/forms/form-field";
import {
  INTENDED_PROGRAMMES,
  MAX_PARTNER_MESSAGE_LENGTH,
  MIN_PARTNER_MESSAGE_LENGTH,
  PARTNERSHIP_TYPE_LABEL,
  PARTNERSHIP_TYPES,
  PARTNER_ORGANISATION_LABEL,
  PARTNER_ORGANISATION_TYPES,
  type PartnershipType,
  type PartnerOrganisationType,
} from "@/lib/partner/enquiry";

/**
 * Partner enquiry form.
 *
 * Same accessibility and anti-spam as the volunteer form: labels tied to inputs,
 * `aria-invalid` and `aria-describedby` on errors, focus moved to the first
 * problem on submit, and a status line that is announced. The honeypot is off
 * screen, and the time trap starts on mount rather than during render.
 *
 * The message field states its minimum length as the sender types. An institution
 * writing a single line is more likely to be a bot or a mistake than a funder, and
 * a counter explains the rule before the server has to reject the message.
 */

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; reference: string }
  | { kind: "error"; message: string };

export function PartnerForm() {
  const [organisation, setOrganisation] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [organisationType, setOrganisationType] = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [intendedAmount, setIntendedAmount] = useState("");
  const [intendedProgramme, setIntendedProgramme] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  const startedAt = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      setStatus({ kind: "sending" });

      try {
        const result = await submitPartnerEnquiry({
          organisation,
          contactName,
          email,
          phone,
          contactRole,
          organisationType,
          partnershipType,
          intendedAmount,
          intendedProgramme,
          message,
          website: "",
          startedAt: startedAt.current ?? undefined,
        });

        if (result.status === "invalid") {
          setErrors(result.errors);
          setStatus({ kind: "idle" });
          const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
          first?.focus();
          return;
        }

        if (result.status === "rate_limited" || result.status === "failed") {
          setErrors({});
          setStatus({ kind: "error", message: result.message });
          return;
        }

        setErrors({});
        setStatus({ kind: "sent", reference: result.reference });
      } catch {
        setStatus({
          kind: "error",
          message:
            "Something went wrong on our side. Nothing has been sent — please try again, or message us on WhatsApp.",
        });
      }
    });
  }

  if (status.kind === "sent") {
    return (
      <div
        className="rounded-card border border-brand-600/30 bg-brand-50 p-8"
        role="status"
        aria-live="polite"
      >
        <h3 className="text-xl font-semibold text-brand-600">Enquiry received</h3>
        <p className="measure mt-3 leading-relaxed text-ink-muted">
          Thank you. A person reads every partnership enquiry, and we reply within five
          working days.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          Your reference is <span className="tabular font-medium text-ink">{status.reference}</span>.
          Quote it if you contact us.
        </p>
      </div>
    );
  }

  const sending = status.kind === "sending" || pending;
  const messageLength = message.trim().length;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="rounded-card border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organisation" error={errors.organisation} required>
          {(props) => (
            <input
              {...props}
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              autoComplete="organization"
              className={inputClass(!!errors.organisation)}
            />
          )}
        </Field>

        <Field label="Your name" error={errors.contactName} required>
          {(props) => (
            <input
              {...props}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              autoComplete="name"
              className={inputClass(!!errors.contactName)}
            />
          )}
        </Field>

        <Field label="Your role" error={errors.contactRole} hint="Optional.">
          {(props) => (
            <input
              {...props}
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              autoComplete="organization-title"
              className={inputClass(!!errors.contactRole)}
            />
          )}
        </Field>

        <Field label="Email" error={errors.email} required>
          {(props) => (
            <input
              {...props}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass(!!errors.email)}
            />
          )}
        </Field>

        <Field label="Phone" error={errors.phone} hint="Optional. Include the country code if you are outside Kenya.">
          {(props) => (
            <input
              {...props}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className={inputClass(!!errors.phone)}
            />
          )}
        </Field>

        <Field label="Type of organisation" error={errors.organisationType} required>
          {(props) => (
            <select
              {...props}
              value={organisationType}
              onChange={(e) => setOrganisationType(e.target.value)}
              className={inputClass(!!errors.organisationType)}
            >
              <option value="">Choose one</option>
              {PARTNER_ORGANISATION_TYPES.map((value: PartnerOrganisationType) => (
                <option key={value} value={value}>
                  {PARTNER_ORGANISATION_LABEL[value]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="What are you considering?" error={errors.partnershipType} required>
          {(props) => (
            <select
              {...props}
              value={partnershipType}
              onChange={(e) => setPartnershipType(e.target.value)}
              className={inputClass(!!errors.partnershipType)}
            >
              <option value="">Choose one</option>
              {PARTNERSHIP_TYPES.map((value: PartnershipType) => (
                <option key={value} value={value}>
                  {PARTNERSHIP_TYPE_LABEL[value]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Intended amount"
          error={errors.intendedAmount}
          hint="Optional. KES or USD, or a range. It helps us size the conversation."
        >
          {(props) => (
            <input
              {...props}
              value={intendedAmount}
              onChange={(e) => setIntendedAmount(e.target.value)}
              className={inputClass(!!errors.intendedAmount)}
            />
          )}
        </Field>

        <Field label="Programme of interest" error={errors.intendedProgramme} hint="Optional.">
          {(props) => (
            <select
              {...props}
              value={intendedProgramme}
              onChange={(e) => setIntendedProgramme(e.target.value)}
              className={inputClass(!!errors.intendedProgramme)}
            >
              <option value="">Not chosen</option>
              {INTENDED_PROGRAMMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="mt-6">
        <Field
          label="What are you considering, and why us?"
          error={errors.message}
          hint={`At least ${MIN_PARTNER_MESSAGE_LENGTH} characters. ${messageLength} so far.`}
          required
        >
          {(props) => (
            <textarea
              {...props}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={MAX_PARTNER_MESSAGE_LENGTH}
              className={`${inputClass(!!errors.message)} resize-y`}
            />
          )}
        </Field>
      </div>

      {/*
        Honeypot. Off-screen rather than `display:none`, because some bots skip
        hidden fields. `aria-hidden` and `tabIndex={-1}` keep it from any real
        person, by keyboard or by screen reader.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="partner-website">Website</label>
        <input id="partner-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p role="status" aria-live="polite" className="mt-6 min-h-5 text-sm text-brand-600">
        {status.kind === "error" ? status.message : null}
      </p>

      <button
        type="submit"
        disabled={sending}
        aria-busy={sending}
        className="mt-4 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {sending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
