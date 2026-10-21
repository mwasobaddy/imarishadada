import type { SectionPatch } from "@/app/[locale]/admin/actions/pages";
import type { SiteSection } from "@/lib/data/types";

/**
 * The section form, and the rules it obeys.
 *
 * ## Why this is not inside the component
 *
 * The editor is the only place these rules are applied, but they are the kind of
 * thing that silently rots: a field added to the form but not to `toPatch` is
 * never saved, and a warning that stops matching the server gate tells the editor
 * a write is fine when it is not. Keeping them here makes both testable without a
 * browser or a database, and `tests/unit/section-form.test.ts` pins them.
 *
 * ## Two kinds of empty
 *
 * `body_secondary` and `stat_line` are `null` when the section does not use them
 * at all, and `""` when the field is present but blank. Those are different
 * states, so they are not collapsed. Every other text field is a plain string,
 * and `toPatch` turns a blank one into `null` on the way out.
 */

export type SectionStep = { title: string; description: string };
export type SectionImage = { path: string; alt: string; caption?: string };

export type SectionForm = {
  section_key: string;
  page_key: string | null;
  sort_order: number;
  /**
   * Carried for display only. Visibility has its own action and is never saved
   * through this form, so `isDirty` ignores it and the editor reads it from the
   * server prop rather than from the stale local copy.
   */
  active: boolean;
  eyebrow: string;
  heading: string;
  body: string;
  body_secondary: string | null;
  stat_line: string | null;
  cta_label: string;
  cta_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  steps: SectionStep[] | null;
  images: SectionImage[] | null;
  image_path: string;
  image_alt: string;
  seo_title: string;
  seo_description: string;
};

/** The row shape the admin action returns. Loose on purpose: JSON columns are unknown. */
export type SectionRow = {
  section_key: string;
  page_key: string | null;
  sort_order: number;
  active: boolean;
  eyebrow: string | null;
  heading: string;
  body: string | null;
  body_secondary: string | null;
  stat_line: string | null;
  cta_label: string | null;
  cta_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  steps: unknown;
  images: unknown;
  image_path: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

/** From `.opencode/rules/seo.md`. Warnings only for metadata: the action is the gate. */
export const SEO_TITLE_MIN = 50;
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MIN = 140;
export const SEO_DESCRIPTION_MAX = 160;

/** The fields an editor can change. `active` is toggled by its own action. */
const COMPARED = [
  "eyebrow",
  "heading",
  "body",
  "body_secondary",
  "stat_line",
  "cta_label",
  "cta_href",
  "cta_secondary_label",
  "cta_secondary_href",
  "steps",
  "images",
  "image_path",
  "image_alt",
  "seo_title",
  "seo_description",
] as const satisfies readonly (keyof SectionForm)[];

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normaliseSteps(value: unknown): SectionStep[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((step) => {
    const row = (step ?? {}) as Record<string, unknown>;
    return { title: text(row.title), description: text(row.description) };
  });
}

export function normaliseImages(value: unknown): SectionImage[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((image) => {
    const row = (image ?? {}) as Record<string, unknown>;
    return {
      path: text(row.path),
      alt: text(row.alt),
      caption: text(row.caption),
    };
  });
}

export function toSectionForm(row: SectionRow): SectionForm {
  return {
    section_key: row.section_key,
    page_key: row.page_key,
    sort_order: row.sort_order,
    active: row.active,
    eyebrow: row.eyebrow ?? "",
    heading: row.heading ?? "",
    body: row.body ?? "",
    // Kept as null: the editor uses null to mean "this section has no such field".
    body_secondary: row.body_secondary,
    stat_line: row.stat_line,
    cta_label: row.cta_label ?? "",
    cta_href: row.cta_href ?? "",
    cta_secondary_label: row.cta_secondary_label ?? "",
    cta_secondary_href: row.cta_secondary_href ?? "",
    steps: normaliseSteps(row.steps),
    images: normaliseImages(row.images),
    image_path: row.image_path ?? "",
    image_alt: row.image_alt ?? "",
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
  };
}

function blankToNull(value: string): string | null {
  return value.trim().length > 0 ? value : null;
}

export function toPatch(form: SectionForm): SectionPatch {
  return {
    eyebrow: blankToNull(form.eyebrow),
    heading: form.heading,
    body: blankToNull(form.body),
    body_secondary:
      form.body_secondary === null ? null : blankToNull(form.body_secondary),
    stat_line: form.stat_line === null ? null : blankToNull(form.stat_line),
    cta_label: blankToNull(form.cta_label),
    cta_href: blankToNull(form.cta_href),
    cta_secondary_label: blankToNull(form.cta_secondary_label),
    cta_secondary_href: blankToNull(form.cta_secondary_href),
    steps:
      form.steps && form.steps.length > 0
        ? form.steps.map((step) => ({
            title: step.title,
            description: step.description,
          }))
        : null,
    images:
      form.images && form.images.length > 0
        ? form.images.map((image) => ({
            path: image.path,
            alt: image.alt,
            ...(image.caption?.trim() ? { caption: image.caption } : {}),
          }))
        : null,
    image_path: blankToNull(form.image_path),
    image_alt: blankToNull(form.image_alt),
    seo_title: blankToNull(form.seo_title),
    seo_description: blankToNull(form.seo_description),
  };
}

/**
 * The other direction: a resolved section back into a form.
 *
 * Used where the page's copy is already resolved — the preview data loader
 * hands the same sections to the preview, and a section that was read as a
 * `SiteSection` still has to become a form to be edited.
 */
export function fromSiteSection(section: SiteSection): SectionForm {
  return {
    section_key: section.key,
    page_key: null,
    sort_order: 0,
    active: section.active,
    eyebrow: section.eyebrow ?? "",
    heading: section.heading ?? "",
    body: section.body ?? "",
    body_secondary: section.bodySecondary ?? null,
    stat_line: section.statLine ?? null,
    cta_label: section.ctaLabel ?? "",
    cta_href: section.ctaHref ?? "",
    cta_secondary_label: section.ctaSecondaryLabel ?? "",
    cta_secondary_href: section.ctaSecondaryHref ?? "",
    steps: section.steps ?? null,
    images: section.images ?? null,
    image_path: section.imagePath ?? "",
    image_alt: section.imageAlt ?? "",
    seo_title: "",
    seo_description: "",
  };
}

/**
 * The form as the page sees it.
 *
 * The public components take a `SiteSection` — the resolved shape, with
 * `ctaLabel`, `statLine` and so on. The form holds the raw column names. This
 * is the one place the two meet, and it is what lets the admin preview hand
 * the *real* component the words the editor has just typed.
 */
export function toPreviewSection(form: SectionForm): SiteSection {
  return {
    key: form.section_key,
    eyebrow: form.eyebrow || null,
    heading: form.heading,
    body: form.body || null,
    ctaLabel: form.cta_label || null,
    ctaHref: form.cta_href || null,
    ctaSecondaryLabel: form.cta_secondary_label || null,
    ctaSecondaryHref: form.cta_secondary_href || null,
    statLine: form.stat_line,
    bodySecondary: form.body_secondary,
    steps: form.steps,
    images: form.images,
    imagePath: form.image_path || null,
    imageAlt: form.image_alt || null,
    active: form.active,
  };
}

/**
 * Whether the form differs from what was saved.
 *
 * Arrays are compared by value through JSON. The fields are short, so this is
 * cheap, and it avoids a hand-written comparator that forgets the next field
 * somebody adds.
 */
export function isDirty(form: SectionForm, saved: SectionForm): boolean {
  return COMPARED.some(
    (key) => JSON.stringify(form[key] ?? null) !== JSON.stringify(saved[key] ?? null),
  );
}

/** A fresh copy of the saved values, safe to edit without touching `saved`. */
export function discardChanges(saved: SectionForm): SectionForm {
  return {
    ...saved,
    steps: saved.steps ? saved.steps.map((step) => ({ ...step })) : null,
    images: saved.images ? saved.images.map((image) => ({ ...image })) : null,
  };
}

/**
 * What is wrong with this section, in the editor's words.
 *
 * Every item here corresponds to either a write the server will reject, or a
 * page defect a reader would see. Nothing here blocks typing; `updateSection`
 * remains the gate. The editor is told before it presses save.
 */
export function sectionWarnings(form: SectionForm): string[] {
  const warnings: string[] = [];

  if (!form.heading.trim()) {
    warnings.push("Add a heading. The page outline needs one.");
  }

  if (form.image_path.trim() && !form.image_alt.trim()) {
    warnings.push("Describe the image for someone who cannot see it.");
  }

  (form.images ?? []).forEach((image, i) => {
    if (!image.path.trim()) {
      warnings.push(`Photograph ${i + 1} has no image selected. Add one, or remove the row.`);
    } else if (!image.alt.trim()) {
      warnings.push(`Photograph ${i + 1} has no description. Add one, or remove the row.`);
    }
  });

  (form.steps ?? []).forEach((step, i) => {
    if (!step.title.trim()) {
      warnings.push(`Step ${i + 1} needs a title. Remove the row or fill it in.`);
    }
  });

  const primaryLabel = form.cta_label.trim();
  const primaryHref = form.cta_href.trim();
  if (primaryLabel && !primaryHref) {
    warnings.push("The main button has text but no link, so it does nothing.");
  }
  if (!primaryLabel && primaryHref) {
    warnings.push("The main button has a link but no text, so it will not be shown.");
  }

  const secondaryLabel = form.cta_secondary_label.trim();
  const secondaryHref = form.cta_secondary_href.trim();
  if (secondaryLabel && !secondaryHref) {
    warnings.push("The second button has text but no link, so it does nothing.");
  }
  if (!secondaryLabel && secondaryHref) {
    warnings.push("The second button has a link but no text, so it will not be shown.");
  }

  const title = form.seo_title.trim();
  if (title && (title.length < SEO_TITLE_MIN || title.length > SEO_TITLE_MAX)) {
    warnings.push(
      title.length < SEO_TITLE_MIN
        ? `The search title is ${title.length} characters. Aim for ${SEO_TITLE_MIN}–${SEO_TITLE_MAX}.`
        : `The search title is ${title.length} characters. Search results cut off around ${SEO_TITLE_MAX}.`,
    );
  }

  const description = form.seo_description.trim();
  if (
    description &&
    (description.length < SEO_DESCRIPTION_MIN || description.length > SEO_DESCRIPTION_MAX)
  ) {
    warnings.push(
      description.length < SEO_DESCRIPTION_MIN
        ? `The search description is ${description.length} characters. Aim for ${SEO_DESCRIPTION_MIN}–${SEO_DESCRIPTION_MAX}.`
        : `The search description is ${description.length} characters. Search results cut off around ${SEO_DESCRIPTION_MAX}.`,
    );
  }

  return warnings;
}

/** A short label for the section rail. */
export function sectionLabel(form: Pick<SectionForm, "heading" | "section_key">): string {
  return form.heading.trim() || "Untitled section";
}

export type PreviewKind = "hero" | "steps" | "gallery" | "copy";

/**
 * Which preview layout to use.
 *
 * This is a hint for the preview only, never for the public page. Hero sections
 * share the masthead treatment; a gallery or a step list needs the right shape so
 * the editor can see what a list of six steps will look like. Anything else is a
 * headline block.
 */
export function previewKind(form: Pick<SectionForm, "section_key" | "steps" | "images">): PreviewKind {
  if (form.section_key.endsWith("-hero")) return "hero";
  if (form.images && form.images.length > 0) return "gallery";
  if (form.steps && form.steps.length > 0) return "steps";
  return "copy";
}

/** The value used for the heading in the preview when the field is blank. */
export function previewHeading(form: Pick<SectionForm, "heading">): string {
  return form.heading.trim() || "Your heading appears here";
}

/**
 * Cut a string to a character budget, on a word boundary where possible.
 * Used by the search-result preview, which must show what Google truncates.
 */
export function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * The search result an editor is writing towards.
 *
 * Falls back to the heading and the first paragraph, because that is what a
 * search engine has to work with when no metadata is set. Showing the fallback
 * makes an empty metadata field look like a decision rather than a blank box.
 */
export function searchPreview(form: {
  seo_title: string;
  seo_description: string;
  heading: string;
  body: string;
  body_secondary: string | null;
}): { title: string; description: string } {
  return {
    title: truncate(form.seo_title.trim() || form.heading.trim(), SEO_TITLE_MAX),
    description: truncate(
      form.seo_description.trim() ||
        form.body.trim() ||
        form.body_secondary?.trim() ||
        "",
      SEO_DESCRIPTION_MAX,
    ),
  };
}

/** Whether the section's steps are questions rather than ordered stages. */
export function stepsAreQuestions(form: Pick<SectionForm, "section_key">): boolean {
  return form.section_key.includes("faq");
}
