"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink, Plus, X } from "lucide-react";

import { updateSection, toggleSection, type SectionPatch } from "@/app/[locale]/admin/actions/pages";
import { MediaPicker, type MediaOption } from "@/components/admin/media-picker";

type Section = {
  section_key: string;
  page_key: string | null;
  eyebrow: string | null;
  heading: string;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  stat_line: string | null;
  body_secondary: string | null;
  steps: { title: string; description: string }[] | null;
  image_path: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  active: boolean;
};

/** The SEO target range for a page title, from .opencode/rules/seo.md. */
const TITLE_MIN = 50;
const TITLE_MAX = 60;

export function SectionEditor({
  section,
  route,
  media = [],
}: {
  section: Section;
  route: string;
  media?: MediaOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(section);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const dirty =
    JSON.stringify({ ...form, active: section.active }) !==
    JSON.stringify({ ...section, active: section.active });

  function set<K extends keyof Section>(key: K, value: Section[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    startTransition(async () => {
      try {
        const patch: SectionPatch = {
          eyebrow: form.eyebrow || null,
          heading: form.heading,
          body: form.body || null,
          cta_label: form.cta_label || null,
          cta_href: form.cta_href || null,
          cta_secondary_label: form.cta_secondary_label || null,
          cta_secondary_href: form.cta_secondary_href || null,
          stat_line: form.stat_line || null,
          body_secondary: form.body_secondary || null,
          steps: form.steps && form.steps.length > 0 ? form.steps : null,
          image_path: form.image_path || null,
          image_alt: form.image_alt || null,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
        };
        await updateSection(section.section_key, patch);
        toast.success("Saved. The public page updates within seconds.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function toggleActive() {
    startTransition(async () => {
      try {
        await toggleSection(section.section_key, !section.active);
        toast.success(section.active ? "Section hidden" : "Section shown");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const headingLen = form.heading.trim().length;
  const seoLen = (form.seo_title ?? "").trim().length;
  const seoInRange = seoLen === 0 || (seoLen >= TITLE_MIN && seoLen <= TITLE_MAX);

  return (
    <div
      className={`rounded-xl border bg-card shadow-sm transition-colors ${
        section.active ? "border-border" : "border-dashed border-border opacity-70"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-lilac font-mono text-[11px] text-ink-muted">
          {String(section.sort_order).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">
              {form.heading || section.section_key}
            </span>
            {!section.active && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                Hidden
              </span>
            )}
            {dirty && (
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                Unsaved
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-muted">
            {section.section_key}
          </span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-5 border-t border-border px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow" hint="Small label above the heading">
              <input
                value={form.eyebrow ?? ""}
                onChange={(e) => set("eyebrow", e.target.value)}
                placeholder="e.g. Our work"
                className={inputClass}
              />
            </Field>

            <Field
              label="Heading"
              hint={`${headingLen} characters · required`}
              warn={headingLen === 0}
            >
              <input
                value={form.heading}
                onChange={(e) => set("heading", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Body" hint="Supporting paragraph">
            <textarea
              value={form.body ?? ""}
              onChange={(e) => set("body", e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </Field>

          {form.body_secondary !== null && (
            <Field
              label="Second paragraph"
              hint="Used by two-column sections"
            >
              <textarea
                value={form.body_secondary ?? ""}
                onChange={(e) => set("body_secondary", e.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </Field>
          )}

          {form.stat_line !== null && (
            <Field label="Stat line" hint="Figures shown with this section">
              <input
                value={form.stat_line ?? ""}
                onChange={(e) => set("stat_line", e.target.value)}
                className={inputClass}
              />
            </Field>
          )}

          {/* CTAs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary CTA label">
              <input
                value={form.cta_label ?? ""}
                onChange={(e) => set("cta_label", e.target.value)}
                placeholder="Donate"
                className={inputClass}
              />
            </Field>
            <Field label="Primary CTA link">
              <input
                value={form.cta_href ?? ""}
                onChange={(e) => set("cta_href", e.target.value)}
                placeholder="/donate"
                className={inputClass}
              />
            </Field>
            <Field label="Secondary CTA label">
              <input
                value={form.cta_secondary_label ?? ""}
                onChange={(e) => set("cta_secondary_label", e.target.value)}
                placeholder="See our impact"
                className={inputClass}
              />
            </Field>
            <Field label="Secondary CTA link">
              <input
                value={form.cta_secondary_href ?? ""}
                onChange={(e) => set("cta_secondary_href", e.target.value)}
                placeholder="#impact"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Ordered steps */}
          {form.steps !== null && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink">
                  Steps ({form.steps?.length ?? 0})
                </p>
                <span className="text-[11px] text-ink-muted/70">
                  Rendered in this order
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {(form.steps ?? []).map((step, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-lilac font-mono text-[10px] text-ink-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <input
                        value={step.title}
                        onChange={(e) => {
                          const next = [...(form.steps ?? [])];
                          next[i] = { ...next[i]!, title: e.target.value };
                          set("steps", next);
                        }}
                        placeholder="Step title"
                        className="flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                      />
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => {
                          const next = [...(form.steps ?? [])];
                          [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                          set("steps", next);
                        }}
                        aria-label={`Move step ${i + 1} up`}
                        className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={i === (form.steps?.length ?? 0) - 1}
                        onClick={() => {
                          const next = [...(form.steps ?? [])];
                          [next[i], next[i + 1]] = [next[i + 1]!, next[i]!];
                          set("steps", next);
                        }}
                        aria-label={`Move step ${i + 1} down`}
                        className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "steps",
                            (form.steps ?? []).filter((_, j) => j !== i),
                          )
                        }
                        aria-label={`Remove step ${i + 1}`}
                        className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={step.description}
                      onChange={(e) => {
                        const next = [...(form.steps ?? [])];
                        next[i] = { ...next[i]!, description: e.target.value };
                        set("steps", next);
                      }}
                      placeholder="What happens at this step"
                      rows={2}
                      className="mt-2 w-full resize-y rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                    />
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  set("steps", [
                    ...(form.steps ?? []),
                    { title: "", description: "" },
                  ])
                }
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
              >
                <Plus className="h-3.5 w-3.5" />
                Add step
              </button>
            </div>
          )}

          {/* Image */}
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaPicker
              id="section-image"
              label="Image"
              hint="48 photographs available"
              value={form.image_path ?? ""}
              onChange={(path) => set("image_path", path)}
              uploaded={media}
            />
            <Field
              label="Alt text"
              hint="Required when an image is set"
              warn={!!form.image_path && !form.image_alt?.trim()}
            >
              <input
                value={form.image_alt ?? ""}
                onChange={(e) => set("image_alt", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {/* SEO */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-muted/60">
              Metadata
            </p>
            <div className="space-y-4">
              <Field
                label="Page title"
                hint={`${seoLen} / ${TITLE_MAX} characters`}
                warn={!seoInRange}
              >
                <input
                  value={form.seo_title ?? ""}
                  onChange={(e) => set("seo_title", e.target.value)}
                  placeholder="Leave blank to keep the code default"
                  className={inputClass}
                />
              </Field>
              <Field label="Meta description" hint="140–160 characters">
                <textarea
                  value={form.seo_description ?? ""}
                  onChange={(e) => set("seo_description", e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={save}
              disabled={pending || !dirty}
              className="inline-flex min-h-10 items-center rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={toggleActive}
              disabled={pending}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              {section.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {section.active ? "Hide section" : "Show section"}
            </button>
            <a
              href={route}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              View on site
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

function Field({
  label,
  hint,
  warn,
  children,
}: {
  label: string;
  hint?: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-ink">{label}</label>
        {hint && (
          <span className={`text-[11px] ${warn ? "text-amber-600" : "text-ink-muted/70"}`}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
