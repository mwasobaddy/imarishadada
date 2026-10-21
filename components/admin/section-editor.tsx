"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Search,
  X,
} from "lucide-react";

import { toggleSection, updateSection } from "@/app/[locale]/admin/actions/pages";
import { MediaPicker, type MediaOption } from "@/components/admin/media-picker";
import { SectionPreview } from "@/components/admin/section-preview";
import { SECTIONS_WITH_IMAGE } from "@/components/admin/section-preview-registry";
import type { PreviewData } from "@/lib/admin/preview-data";
import {
  discardChanges,
  isDirty,
  searchPreview,
  sectionLabel,
  sectionWarnings,
  toPatch,
  SEO_DESCRIPTION_MAX,
  SEO_DESCRIPTION_MIN,
  SEO_TITLE_MAX,
  SEO_TITLE_MIN,
  type SectionForm,
} from "@/lib/admin/section-form";

/**
 * One editable section.
 *
 * ## Why the form is grouped
 *
 * The fields used to be one flat stack — eyebrow, heading, body, four CTA
 * fields, steps, a gallery, a single image, alt text, SEO — with no indication
 * of which ones a given section actually uses. Grouping them by what an editor
 * is trying to do ("words", "buttons", "pictures") means the first screen holds
 * the three fields that matter for almost every edit.
 *
 * ## Why the preview is beside the fields
 *
 * The editor is not looking for a form. They are looking for the page. The
 * preview updates on every keystroke from the same state the inputs write to, so
 * there is no round trip, no debounce, and no "did it save?".
 *
 * ## Save is still a deliberate act
 *
 * Changes are local until Save. Leaving the editor open on a laptop does not
 * change the public page, and Discard is always available. This is the one
 * thing that must not be a live write.
 */
export function SectionEditor({
  section,
  route,
  media,
  previewData,
  index,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
  canEditSeo,
}: {
  section: SectionForm;
  route: string;
  media: MediaOption[];
  /** The published data the exact previews render alongside the copy. */
  previewData: PreviewData;
  /** Where this section sits on the page, counting from one. */
  index: number;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (key: string, dirty: boolean) => void;
  canEditSeo: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SectionForm>(section);
  const [pending, startTransition] = useTransition();

  const dirty = isDirty(form, section);
  const warnings = sectionWarnings(form);
  const idPrefix = `section-${section.section_key}`;

  // Tell the rail about this section's state. The parent's handler is stable, so
  // this runs on the transition only, not on every keystroke.
  useEffect(() => {
    onDirtyChange(section.section_key, dirty);
  }, [dirty, section.section_key, onDirtyChange]);


  function set<K extends keyof SectionForm>(key: K, value: SectionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      try {
        await updateSection(section.section_key, toPatch(form));
        toast.success("Saved. The page updates within seconds.");
        router.refresh();
        onSaved();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  }

  function discard() {
    setForm(discardChanges(section));
    toast("Changes discarded.");
  }

  function toggleActive() {
    startTransition(async () => {
      try {
        await toggleSection(section.section_key, !section.active);
        toast.success(section.active ? "Section hidden" : "Section shown");
        router.refresh();
        onSaved();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed");
      }
    });
  }

  const headingLength = form.heading.trim().length;
  const seoTitleLength = form.seo_title.trim().length;
  const seoDescriptionLength = form.seo_description.trim().length;
  const search = searchPreview(form);

  return (
    <article
      id={idPrefix}
      className={`scroll-mt-20 rounded-xl border bg-card shadow-sm transition-colors ${
        section.active ? "border-border" : "border-dashed border-border"
      }`}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ---------------------------------------------------------------- */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${idPrefix}-fields`}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-surface-lilac/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:px-5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-lilac font-mono text-[11px] text-ink-muted">
          {String(index).padStart(2, "0")}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">{sectionLabel(form)}</span>
            {!section.active && <StatusChip tone="neutral">Hidden</StatusChip>}
            {dirty && <StatusChip tone="amber">Unsaved</StatusChip>}
            {warnings.length > 0 && (
              <StatusChip tone="amber">
                {warnings.length} {warnings.length === 1 ? "thing" : "things"} to fix
              </StatusChip>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-muted">
            {form.eyebrow?.trim() || form.section_key}
          </span>
        </span>

        <span className="hidden shrink-0 text-[11px] text-ink-muted sm:block">
          {open ? "Editing" : "Edit"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div id={`${idPrefix}-fields`} className="border-t border-border px-4 py-5 sm:px-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            {/* -------------------------------------------------------- */}
            {/* Fields                                                    */}
            {/* -------------------------------------------------------- */}
            <div className="min-w-0 space-y-4">
              <Group title="Words" hint="What readers see in this section.">
                <Field
                  id={`${idPrefix}-eyebrow`}
                  label="Label above the heading"
                  hint="Optional"
                >
                  <input
                    id={`${idPrefix}-eyebrow`}
                    value={form.eyebrow}
                    onChange={(event) => set("eyebrow", event.target.value)}
                    placeholder="e.g. Our work"
                    className={inputClass}
                  />
                </Field>

                <Field
                  id={`${idPrefix}-heading`}
                  label="Heading"
                  hint={`${headingLength} characters · required`}
                  warn={headingLength === 0}
                >
                  <input
                    id={`${idPrefix}-heading`}
                    value={form.heading}
                    onChange={(event) => set("heading", event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field id={`${idPrefix}-body`} label="Paragraph" hint="Optional">
                  <textarea
                    id={`${idPrefix}-body`}
                    value={form.body}
                    onChange={(event) => set("body", event.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </Field>

                {form.body_secondary !== null && (
                  <Field
                    id={`${idPrefix}-body-secondary`}
                    label="Second paragraph"
                    hint="Used by side-by-side sections"
                  >
                    <textarea
                      id={`${idPrefix}-body-secondary`}
                      value={form.body_secondary}
                      onChange={(event) => set("body_secondary", event.target.value)}
                      rows={2}
                      className={`${inputClass} resize-y`}
                    />
                  </Field>
                )}

                {form.stat_line !== null && (
                  <Field
                    id={`${idPrefix}-stat-line`}
                    label="Figures line"
                    hint="Shown under a divider"
                  >
                    <input
                      id={`${idPrefix}-stat-line`}
                      value={form.stat_line}
                      onChange={(event) => set("stat_line", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                )}
              </Group>

              <Group
                title="Buttons"
                hint="Leave both fields blank to show no button. A button needs text and a link."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id={`${idPrefix}-cta-label`} label="Main button text">
                    <input
                      id={`${idPrefix}-cta-label`}
                      value={form.cta_label}
                      onChange={(event) => set("cta_label", event.target.value)}
                      placeholder="Donate"
                      className={inputClass}
                    />
                  </Field>
                  <Field id={`${idPrefix}-cta-href`} label="Main button link">
                    <input
                      id={`${idPrefix}-cta-href`}
                      value={form.cta_href}
                      onChange={(event) => set("cta_href", event.target.value)}
                      placeholder="/donate"
                      className={inputClass}
                    />
                  </Field>
                  <Field id={`${idPrefix}-cta2-label`} label="Second button text">
                    <input
                      id={`${idPrefix}-cta2-label`}
                      value={form.cta_secondary_label}
                      onChange={(event) => set("cta_secondary_label", event.target.value)}
                      placeholder="See our impact"
                      className={inputClass}
                    />
                  </Field>
                  <Field id={`${idPrefix}-cta2-href`} label="Second button link">
                    <input
                      id={`${idPrefix}-cta2-href`}
                      value={form.cta_secondary_href}
                      onChange={(event) => set("cta_secondary_href", event.target.value)}
                      placeholder="#impact"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Group>

              {/*
                Shown when the section has a picture, or when its public
                component has a place to put one — the homepage hero, whose
                portrait an editor can now replace. For every other section an
                empty picker would be a control that changes nothing.
              */}
              {(form.image_path !== "" || SECTIONS_WITH_IMAGE.has(section.section_key)) && (
                <Group
                  title="Picture"
                  hint={
                    SECTIONS_WITH_IMAGE.has(section.section_key)
                      ? "This is the photograph on the page. Every photograph needs a description."
                      : "Choose from the library. Every photograph needs a description."
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MediaPicker
                      id={`${idPrefix}-image`}
                      label="Image"
                      hint="Optional"
                      value={form.image_path}
                      onChange={(path) => set("image_path", path)}
                      onUseAlt={(alt) => set("image_alt", alt)}
                      uploaded={media}
                    />
                    <Field
                      id={`${idPrefix}-image-alt`}
                      label="Image description"
                      hint="For screen readers"
                      warn={Boolean(form.image_path) && !form.image_alt.trim()}
                    >
                      <input
                        id={`${idPrefix}-image-alt`}
                        value={form.image_alt}
                        onChange={(event) => set("image_alt", event.target.value)}
                        placeholder="What the image shows"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </Group>
              )}

              {form.steps !== null && (
                <Group
                  title={`Steps (${form.steps.length})`}
                  hint="One title and one sentence each, shown in this order."
                >
                  <StepsEditor
                    idPrefix={idPrefix}
                    steps={form.steps}
                    onChange={(steps) => set("steps", steps)}
                  />
                </Group>
              )}

              {form.images !== null && (
                <Group
                  title={`Photographs (${form.images.length})`}
                  hint="Shown in this order. Every photograph needs a description."
                >
                  <ImagesEditor
                    idPrefix={idPrefix}
                    images={form.images}
                    media={media}
                    onChange={(images) => set("images", images)}
                  />
                </Group>
              )}

              <SearchListing
                form={form}
                search={search}
                canEditSeo={canEditSeo}
                set={set}
                seoTitleLength={seoTitleLength}
                seoDescriptionLength={seoDescriptionLength}
                idPrefix={idPrefix}
              />

              {warnings.length > 0 && (
                <div
                  role="status"
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
                >
                  <p className="flex items-center gap-1.5 text-sm font-medium text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    Before you save
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-amber-900/90">
                    {warnings.map((warning) => (
                      <li key={warning} className="flex gap-2">
                        <span aria-hidden="true">·</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* -------------------------------------------------------- */}
            {/* Preview                                                   */}
            {/* -------------------------------------------------------- */}
            <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
              <SectionPreview form={form} active={section.active} data={previewData} />
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Visibility                                                  */}
          {/* ---------------------------------------------------------- */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                {section.active ? "Visible on the page" : "Hidden from the page"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                Hiding removes the whole section, heading included. Nothing is deleted, and
                you can show it again at any time.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleActive}
              disabled={pending}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 disabled:opacity-40"
            >
              {section.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {section.active ? "Hide section" : "Show section"}
            </button>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Save bar                                                    */}
          {/* ---------------------------------------------------------- */}
          <div className="sticky bottom-3 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={save}
              disabled={pending || !dirty}
              className="inline-flex min-h-10 items-center rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={discard}
              disabled={pending || !dirty}
              className="inline-flex min-h-10 items-center rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
            >
              Discard
            </button>
            <span className="hidden text-xs text-ink-muted sm:inline">
              {dirty ? "You have unsaved changes." : "All changes saved."}
            </span>
            <a
              href={route}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto hidden min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 sm:inline-flex"
            >
              View on site
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

function StepsEditor({
  idPrefix,
  steps,
  onChange,
}: {
  idPrefix: string;
  steps: NonNullable<SectionForm["steps"]>;
  onChange: (steps: NonNullable<SectionForm["steps"]>) => void;
}) {
  function update(index: number, patch: Partial<{ title: string; description: string }>) {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...steps];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-lilac font-mono text-[10px] text-ink-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <input
                id={`${idPrefix}-step-${index}-title`}
                aria-label={`Step ${index + 1} title`}
                value={step.title}
                onChange={(event) => update(index, { title: event.target.value })}
                placeholder="Step title"
                className="min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
              <OrderButton
                label={`Move step ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </OrderButton>
              <OrderButton
                label={`Move step ${index + 1} down`}
                disabled={index === steps.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </OrderButton>
              <RemoveButton
                label={`Remove step ${index + 1}`}
                onClick={() => onChange(steps.filter((_, i) => i !== index))}
              />
            </div>
            <textarea
              aria-label={`Step ${index + 1} description`}
              value={step.description}
              onChange={(event) => update(index, { description: event.target.value })}
              placeholder="What happens at this step"
              rows={2}
              className="mt-2 w-full resize-y rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </li>
        ))}
      </ol>

      <AddButton onClick={() => onChange([...steps, { title: "", description: "" }])}>
        Add step
      </AddButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

function ImagesEditor({
  idPrefix,
  images,
  media,
  onChange,
}: {
  idPrefix: string;
  images: NonNullable<SectionForm["images"]>;
  media: MediaOption[];
  onChange: (images: NonNullable<SectionForm["images"]>) => void;
}) {
  function update(index: number, patch: Partial<{ path: string; alt: string; caption: string }>) {
    onChange(images.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div>
      <ul className="space-y-3">
        {images.map((image, index) => (
          <li key={index} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-lilac font-mono text-[10px] text-ink-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-muted">
                {image.path || "No image selected"}
              </span>
              <OrderButton
                label={`Move photograph ${index + 1} earlier`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </OrderButton>
              <OrderButton
                label={`Move photograph ${index + 1} later`}
                disabled={index === images.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </OrderButton>
              <RemoveButton
                label={`Remove photograph ${index + 1}`}
                onClick={() => onChange(images.filter((_, i) => i !== index))}
              />
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <MediaPicker
                compact
                id={`${idPrefix}-image-${index}`}
                label={`Photograph ${index + 1}`}
                value={image.path}
                onChange={(path) => update(index, { path })}
                onUseAlt={(alt) => update(index, { alt })}
                uploaded={media}
              />
              <Field
                id={`${idPrefix}-image-${index}-alt`}
                label="Description"
                hint="Required"
                warn={!image.alt.trim()}
              >
                <textarea
                  id={`${idPrefix}-image-${index}-alt`}
                  value={image.alt}
                  onChange={(event) => update(index, { alt: event.target.value })}
                  placeholder="What the photograph shows"
                  rows={2}
                  className={`${inputClass} resize-y ${!image.alt.trim() ? "border-amber-400" : ""}`}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field
                id={`${idPrefix}-image-${index}-caption`}
                label="Caption"
                hint="Optional"
              >
                <input
                  id={`${idPrefix}-image-${index}-caption`}
                  value={image.caption ?? ""}
                  onChange={(event) => update(index, { caption: event.target.value })}
                  placeholder="Leave blank to show no caption"
                  className={inputClass}
                />
              </Field>
            </div>
          </li>
        ))}
      </ul>

      <AddButton onClick={() => onChange([...images, { path: "", alt: "", caption: "" }])}>
        Add photograph
      </AddButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Search listing                                                             */
/* -------------------------------------------------------------------------- */

function SearchListing({
  form,
  search,
  canEditSeo,
  set,
  seoTitleLength,
  seoDescriptionLength,
  idPrefix,
}: {
  form: SectionForm;
  search: { title: string; description: string };
  canEditSeo: boolean;
  set: <K extends keyof SectionForm>(key: K, value: SectionForm[K]) => void;
  seoTitleLength: number;
  seoDescriptionLength: number;
  idPrefix: string;
}) {
  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
        <Search className="h-4 w-4 text-ink-muted" />
        <span className="text-sm font-medium text-ink">Search listing</span>
        <span className="text-xs text-ink-muted">
          {form.seo_title.trim() || form.seo_description.trim()
            ? "Customised"
            : "Using the heading and paragraph"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="ml-auto h-4 w-4 text-ink-muted transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-border px-4 py-4">
        {!canEditSeo ? (
          <p className="text-sm leading-relaxed text-ink-muted">
            You do not have permission to change search metadata. It stays as it is.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-ink-muted">
              Optional. Blank uses this section&apos;s heading and paragraph. A careless
              title costs rankings, which is why it is a separate permission.
            </p>

            <Field
              id={`${idPrefix}-seo-title`}
              label="Search title"
              hint={`${seoTitleLength} / ${SEO_TITLE_MAX} characters`}
              warn={
                seoTitleLength > 0 &&
                (seoTitleLength < SEO_TITLE_MIN || seoTitleLength > SEO_TITLE_MAX)
              }
            >
              <input
                id={`${idPrefix}-seo-title`}
                value={form.seo_title}
                onChange={(event) => set("seo_title", event.target.value)}
                placeholder="Leave blank to keep the code default"
                className={inputClass}
              />
            </Field>

            <Field
              id={`${idPrefix}-seo-description`}
              label="Search description"
              hint={`${seoDescriptionLength} / ${SEO_DESCRIPTION_MAX} characters`}
              warn={
                seoDescriptionLength > 0 &&
                (seoDescriptionLength < SEO_DESCRIPTION_MIN ||
                  seoDescriptionLength > SEO_DESCRIPTION_MAX)
              }
            >
              <textarea
                id={`${idPrefix}-seo-description`}
                value={form.seo_description}
                onChange={(event) => set("seo_description", event.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <div className="rounded-lg border border-border bg-surface px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted/60">
                How it may look in search
              </p>
              <p className="mt-2 truncate text-[13px] text-[#1a0dab] dark:text-blue-300">
                {search.title || "Page title"}
              </p>
              <p className="text-[11px] text-[#006621] dark:text-emerald-400">
                www.imarishadada.org
              </p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-muted">
                {search.description || "No description yet."}
              </p>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{hint}</p>}
      </div>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  warn,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint && (
          <span className={`shrink-0 text-[11px] ${warn ? "text-amber-600" : "text-ink-muted/70"}`}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function StatusChip({
  tone,
  children,
}: {
  tone: "amber" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        tone === "amber"
          ? "bg-amber-100 text-amber-800"
          : "bg-surface-lilac text-ink-muted"
      }`}
    >
      {children}
    </span>
  );
}

function OrderButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
    >
      <Plus className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
