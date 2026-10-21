"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EyeOff, ImageIcon } from "lucide-react";

import {
  previewHeading,
  previewKind,
  stepsAreQuestions,
  type SectionForm,
} from "@/lib/admin/section-form";
import {
  ExactSectionPreview,
  EXACT_SECTION_KEYS,
} from "@/components/admin/section-preview-registry";
import type { PreviewData } from "@/lib/admin/preview-data";

/**
 * The section being edited, drawn the way the page draws it.
 *
 * ## Two kinds of preview, and the editor is told which
 *
 * **Exact.** Where the page renders a section through a component, the preview
 * calls that same component with the words the editor has typed. The masthead
 * is the real masthead; the programme cards are the real programme cards. When
 * the page changes its layout, this changes with it, because there is only one
 * implementation.
 *
 * **Approximate.** Several pages still compose parts of themselves inline.
 * Those parts have no component to call, so the preview draws them from the
 * section's own fields. The label under the frame says so, rather than
 * letting an editor believe an impression is the page.
 *
 * ## Why the frame is `inert`
 *
 * The exact preview contains the real components, and those contain links,
 * buttons and — in the contact section — a form. A preview must not be
 * operable: a tab stop inside a picture of a page is a keyboard trap, and a
 * link that looks clickable but navigates the admin away is worse.
 * `inert` takes the whole frame out of the tab order and the accessibility
 * tree, and `aria-hidden` keeps a screen reader from announcing a second copy
 * of words that are already in the labelled fields beside it.
 */
export function SectionPreview({
  form,
  active,
  data,
}: {
  form: SectionForm;
  /** Visibility comes from the server, not the form: it has its own action. */
  active: boolean;
  data: PreviewData;
}) {
  const isExact = EXACT_SECTION_KEYS.has(form.section_key);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted/60">
          Live preview
        </p>
        <p
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isExact
              ? "bg-brand-50 text-brand-600"
              : "bg-surface-lilac text-ink-muted"
          }`}
        >
          {isExact ? "The real section" : "Approximate"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-lilac/50 p-2">
        <div
          inert
          aria-hidden="true"
          className="max-h-[640px] overflow-y-auto overscroll-contain rounded-lg bg-surface shadow-sm"
        >
          {!active && (
            <p className="flex items-center gap-1.5 border-b border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
              <EyeOff className="h-3.5 w-3.5" />
              Hidden — readers will not see this section.
            </p>
          )}

          {isExact ? (
            <PageWidthFrame>
              <ExactSectionPreview form={form} data={data} />
            </PageWidthFrame>
          ) : (
            <ApproximatePreview form={form} />
          )}
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-muted/70">
        {isExact
          ? "This is the section as the page renders it, with the words you have typed. Use the page preview for the full page and for the phone layout."
          : "This section is still composed inside the page, so this is an approximation of it. The words are exact."}
      </p>
    </div>
  );
}

/**
 * The page's width, scaled to fit the pane.
 *
 * ## Why the width matters
 *
 * Tailwind's breakpoints are the *viewport's*, not the container's. A section
 * rendered into a 600px pane still gets the desktop layout — two columns,
 * page-wide padding — and it looks squeezed rather than like the page. The
 * editor would be judging a layout nobody sees.
 *
 * So the section is rendered at the width the page renders it at, and the
 * result is scaled down to fit the pane. The proportions are the page's
 * proportions: the same column widths, the same wrapping, the same line
 * breaks. It is what a design tool shows you, and it is the only way to see
 * the real layout in a pane this narrow.
 *
 * ## How the height is known
 *
 * A scaled element still occupies its unscaled height in layout, which would
 * leave a large empty band under it. The inner box is measured with a
 * `ResizeObserver` and the outer box is given the scaled height, so the
 * frame fits the content exactly.
 */
const PAGE_WIDTH = 1280;

function PageWidthFrame({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const frame = outer.current;
    const content = inner.current;
    if (!frame || !content) return;

    const measure = () => {
      const width = frame.clientWidth;
      if (!width) return;
      const next = width / PAGE_WIDTH;
      setScale(next);
      setHeight(content.scrollHeight * next);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(content);
    measure();

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outer}
      className="overflow-hidden"
      style={height === null ? undefined : { height: `${height}px` }}
    >
      <div
        ref={inner}
        style={{ width: `${PAGE_WIDTH}px`, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The fallback drawing, for the sections the page still composes inline.
 *
 * It follows the site's own type scale, colours and spacing, and it shows a
 * blank field as a blank field rather than hiding it — the editor needs to
 * see that the heading is empty.
 */
function ApproximatePreview({ form }: { form: SectionForm }) {
  const kind = previewKind(form);

  if (kind === "hero") {
    return (
      <div className="relative overflow-hidden bg-surface-lilac px-6 py-10 sm:px-8 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_15%_0%,var(--color-surface-pink)_0%,transparent_60%),radial-gradient(50%_70%_at_85%_20%,var(--color-brand-50)_0%,transparent_65%)]"
        />
        <div className="relative">
          <Eyebrow text={form.eyebrow} />
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl ${
              form.heading.trim() ? "text-brand-600" : "text-ink-muted/40"
            }`}
          >
            {previewHeading(form)}
          </p>
          <Body form={form} />
          <PreviewButtons form={form} />
          <StatLine form={form} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <Eyebrow text={form.eyebrow} />
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${
          form.heading.trim() ? "text-brand-600" : "text-ink-muted/40"
        }`}
      >
        {previewHeading(form)}
      </p>
      <Body form={form} />
      <PreviewButtons form={form} />
      <StatLine form={form} />
      <StepsOrGallery form={form} />
      {form.image_path.trim() ? <SingleImage form={form} /> : null}
    </div>
  );
}

function Eyebrow({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{text}</p>
  );
}

function Body({ form }: { form: SectionForm }) {
  const paragraphs = [form.body, form.body_secondary].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  if (paragraphs.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="max-w-[62ch] text-base leading-relaxed text-ink-muted">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function PreviewButtons({ form }: { form: SectionForm }) {
  const primary = form.cta_label.trim();
  const secondary = form.cta_secondary_label.trim();
  if (!primary && !secondary) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {primary ? (
        <span
          className={`inline-flex min-h-10 items-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-brand-50 ${
            form.cta_href.trim() ? "" : "outline-2 outline-dashed outline-amber-500"
          }`}
        >
          {primary}
        </span>
      ) : null}
      {secondary ? (
        <span
          className={`inline-flex min-h-10 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 ${
            form.cta_secondary_href.trim() ? "" : "outline-2 outline-dashed outline-amber-500"
          }`}
        >
          {secondary} →
        </span>
      ) : null}
    </div>
  );
}

function StatLine({ form }: { form: SectionForm }) {
  if (!form.stat_line?.trim()) return null;
  return (
    <p className="mt-6 border-t border-brand/20 pt-4 text-sm text-ink-muted">
      {form.stat_line}
    </p>
  );
}

function StepsOrGallery({ form }: { form: SectionForm }) {
  if (form.images && form.images.length > 0) return <Gallery form={form} />;
  if (form.steps && form.steps.length > 0) return <Steps form={form} />;
  return null;
}

function Steps({ form }: { form: SectionForm }) {
  const steps = form.steps ?? [];
  const questions = stepsAreQuestions(form);

  return (
    <ol className="mt-6 space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="rounded-lg border border-border bg-surface p-3">
          <div className="flex gap-2.5">
            {!questions && (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surface-lilac font-mono text-[10px] text-ink-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.title.trim() ? "text-ink" : "text-amber-700"
                }`}
              >
                {step.title.trim() || "Untitled step"}
              </p>
              {step.description.trim() ? (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {step.description}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Gallery({ form }: { form: SectionForm }) {
  const images = form.images ?? [];

  return (
    <div className="mt-6 grid grid-cols-2 gap-2">
      {images.map((image, i) => (
        <figure key={i}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-lilac">
            {image.path.trim() ? (
              <Image
                src={image.path}
                alt=""
                fill
                sizes="(min-width: 1024px) 200px, 40vw"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-ink-muted/40">
                <ImageIcon className="h-5 w-5" />
              </span>
            )}
          </div>
          {image.caption?.trim() ? (
            <figcaption className="mt-1 text-[11px] leading-snug text-ink-muted">
              {image.caption}
            </figcaption>
          ) : null}
          {image.path.trim() && !image.alt.trim() ? (
            <p className="mt-1 text-[11px] font-medium text-amber-700">Needs alt text</p>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function SingleImage({ form }: { form: SectionForm }) {
  return (
    <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-lg bg-surface-lilac">
      <Image
        src={form.image_path}
        alt=""
        fill
        sizes="(min-width: 1024px) 480px, 90vw"
        className="object-cover"
      />
    </div>
  );
}
