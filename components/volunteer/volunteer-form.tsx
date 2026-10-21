"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { submitVolunteerApplication } from "@/app/[locale]/(site)/volunteer/actions";
import type { VolunteerRole } from "@/lib/data/volunteer";
import {
  AVAILABILITY_LABEL,
  LANGUAGE_LABEL,
  MAX_MOTIVATION_LENGTH,
  MIN_MOTIVATION_LENGTH,
  VOLUNTEER_AVAILABILITY,
  VOLUNTEER_LANGUAGES,
  type VolunteerLanguage,
} from "@/lib/volunteer/application";
import { Field, inputClass } from "@/components/forms/form-field";

/**
 * Volunteer application form.
 *
 * ## What it does not ask for
 *
 * No date of birth, no national ID, no ID number. The roadmap is explicit that
 * collecting identity data from unvetted applicants is itself a safeguarding
 * problem, and that screening collects what it needs through a controlled
 * process rather than a public form. There is no field for any of it, and a test
 * asserts that.
 *
 * ## The role field is optional, and has to be
 *
 * `volunteer_roles` is empty. A required select with no options is an unusable
 * form, and the page explicitly invites people to apply before a role exists. So
 * it is a select when roles are open and a plain note when they are not.
 *
 * ## Accessibility
 *
 * Real `<label for>`, `aria-invalid` and `aria-describedby` on every error,
 * `aria-live` on the status line, and focus moved to the first invalid field on
 * submit. `autocomplete` is set where it helps rather than switched off — the
 * roadmap calls that out, and a volunteer filling this on a phone benefits from
 * it more than most.
 */
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; reference: string }
  | { kind: "error"; message: string };

export function VolunteerForm({ roles }: { roles: VolunteerRole[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [availability, setAvailability] = useState("");
  const [languages, setLanguages] = useState<VolunteerLanguage[]>([]);
  const [skillsDetail, setSkillsDetail] = useState("");
  const [motivation, setMotivation] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  // Anti-spam. The honeypot is off-screen and `aria-hidden`; `startedAt` is
  // stamped once on mount.
  //
  // In an effect rather than `useRef(Date.now())`: reading the clock during
  // render is impure and makes the component non-idempotent, which the lint rule
  // catches. By the time anyone can submit, the effect has run.
  const startedAt = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function toggleLanguage(code: VolunteerLanguage) {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      setStatus({ kind: "sending" });

      try {
        const result = await submitVolunteerApplication({
          name,
          email,
          phone,
          roleId: roleId || null,
          availability,
          languages,
          skillsDetail,
          motivation,
          website: "",
          startedAt: startedAt.current ?? undefined,
        });

        if (result.status === "invalid") {
          setErrors(result.errors);
          setStatus({ kind: "idle" });
          // Move focus to the first problem so a keyboard or screen reader user
          // is not left guessing which field broke.
          const first = formRef.current?.querySelector<HTMLElement>(
            "[aria-invalid='true']",
          );
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
        <h3 className="text-xl font-semibold text-brand-600">Application received</h3>
        <p className="measure mt-3 leading-relaxed text-ink-muted">
          Thank you. A person reads every application, and we reply within two
          weeks — including to tell you if we do not have a suitable role right
          now.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          Your reference is <span className="tabular font-medium text-ink">{status.reference}</span>.
          Quote it if you contact us.
        </p>
      </div>
    );
  }

  const sending = status.kind === "sending" || pending;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="rounded-card border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" error={errors.name} required>
          {(props) => (
            <input
              {...props}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={inputClass(!!errors.name)}
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
      </div>

      <div className="mt-5">
        <Field
          label="Mobile number"
          error={errors.phone}
          hint="So we can reach you about a placement."
          required
        >
          {(props) => (
            <input
              {...props}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712 345 678"
              autoComplete="tel"
              className={inputClass(!!errors.phone)}
            />
          )}
        </Field>
      </div>

      {/* ---- Role ---------------------------------------------------- */}
      {roles.length > 0 ? (
        <div className="mt-5">
          <Field
            label="Role you are interested in"
            error={errors.roleId}
            hint="Optional — leave it blank if you are not sure."
          >
            {(props) => (
              <select
                {...props}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className={inputClass(!!errors.roleId)}
              >
                <option value="">No particular role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          No roles are open at the moment, so there is nothing to choose. Apply
          anyway and tell us what you can offer.
        </p>
      )}

      {/* ---- Availability -------------------------------------------- */}
      <div className="mt-5">
        <Field label="How much time can you give?" error={errors.availability} required>
          {(props) => (
            <select
              {...props}
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className={inputClass(!!errors.availability)}
            >
              <option value="">Choose one</option>
              {VOLUNTEER_AVAILABILITY.map((option) => (
                <option key={option} value={option}>
                  {AVAILABILITY_LABEL[option]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      {/* ---- Languages ------------------------------------------------ */}
      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-ink">
          Languages you can work in{" "}
          <span className="font-normal text-ink-muted">(optional)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
          {VOLUNTEER_LANGUAGES.map((code) => (
            <label
              key={code}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={languages.includes(code)}
                onChange={() => toggleLanguage(code)}
                className="size-5 accent-[var(--color-brand)]"
              />
              {LANGUAGE_LABEL[code]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ---- Skills --------------------------------------------------- */}
      <div className="mt-6">
        <Field
          label="Skills and experience"
          error={errors.skillsDetail}
          hint="Optional. What you have done, and what you would be useful at."
        >
          {(props) => (
            <textarea
              {...props}
              value={skillsDetail}
              onChange={(e) => setSkillsDetail(e.target.value)}
              rows={3}
              className={`${inputClass(!!errors.skillsDetail)} resize-y`}
            />
          )}
        </Field>
      </div>

      {/* ---- Motivation ----------------------------------------------- */}
      <div className="mt-6">
        <Field
          label="Why do you want to volunteer with us?"
          error={errors.motivation}
          hint={`At least ${MIN_MOTIVATION_LENGTH} characters. ${motivation.trim().length} so far.`}
          required
        >
          {(props) => (
            <textarea
              {...props}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={5}
              maxLength={MAX_MOTIVATION_LENGTH}
              className={`${inputClass(!!errors.motivation)} resize-y`}
            />
          )}
        </Field>
      </div>

      {/*
        Honeypot. Off-screen rather than `display:none`, because some bots skip
        hidden fields. `aria-hidden` and `tabIndex={-1}` so no real person can
        reach it, by keyboard or screen reader.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="volunteer-website">Website</label>
        <input id="volunteer-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
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
        {sending ? "Sending…" : "Submit application"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        We do not ask for your date of birth or your ID number at this stage.
        Identity is checked during screening, once we have spoken.
      </p>
    </form>
  );
}
