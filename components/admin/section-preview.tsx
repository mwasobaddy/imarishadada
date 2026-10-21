"use client";

import Image from "next/image";
import { EyeOff, ImageIcon, Monitor, Smartphone } from "lucide-react";

import {
  previewHeading,
  previewKind,
  stepsAreQuestions,
  type SectionForm,
} from "@/lib/admin/section-form";

export type PreviewDevice = "desktop" | "mobile";

/**
 * The section being edited, drawn the way the page draws it.
 *
 * ## What this is, and what it is not
 *
 * It is a **live** preview: every keystroke in the form updates it, with no
 * request and no debounce, because it reads the same state the inputs do.
 *
 * It is not a screenshot of the real page. The page composes these sections
 * inline in twelve different files, and copying that composition into the admin
 * would be a second implementation that drifts the first time a page changes. So
 * this mirrors the site's own type scale, colours, spacing and button shapes, and
 * the note underneath says plainly that the surrounding layout may differ. The
 * page preview above the editor shows the real thing, from the saved data.
 *
 * ## Accessibility
 *
 * The preview is `aria-hidden`: every word in it is already in a labelled input
 * beside it, and announcing both would double every field for a screen reader.
 * Nothing in it is focusable or clickable for the same reason.
 */
export function SectionPreview({
  form,
  active,
  device,
  onDeviceChange,
}: {
  form: SectionForm;
  /** Visibility comes from the server, not the form: it has its own action. */
  active: boolean;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
}) {
  const kind = previewKind(form);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted/60">
          Live preview
        </p>
        <div
          role="group"
          aria-label="Preview width"
          className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
        >
          <DeviceButton
            active={device === "desktop"}
            label="Desktop width"
            onClick={() => onDeviceChange("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" />
          </DeviceButton>
          <DeviceButton
            active={device === "mobile"}
            label="Phone width"
            onClick={() => onDeviceChange("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </DeviceButton>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-lilac/50 p-2">
        <div className={device === "mobile" ? "mx-auto w-[390px] max-w-full" : "w-full"}>
          <div
            aria-hidden="true"
            className="max-h-[560px] overflow-y-auto overscroll-contain rounded-lg bg-surface shadow-sm"
          >
            {!active && (
              <p className="flex items-center gap-1.5 border-b border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                <EyeOff className="h-3.5 w-3.5" />
                Hidden — readers will not see this section.
              </p>
            )}

            {kind === "hero" ? (
              <HeroPreview form={form} />
            ) : (
              <CopyPreview form={form} />
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-muted/70">
        The live page keeps its own width and spacing around these words.
      </p>
    </div>
  );
}

function DeviceButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
        active ? "bg-brand-600 text-brand-50" : "text-ink-muted hover:bg-surface-lilac"
      }`}
    >
      {children}
    </button>
  );
}

/** The masthead treatment, matching `components/site/page-hero.tsx`. */
function HeroPreview({ form }: { form: SectionForm }) {
  const gold = form.page_key === "home";

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
        <PreviewButtons form={form} gold={gold} />
        <StatLine form={form} />
      </div>
    </div>
  );
}

/** The ordinary section: label, heading, paragraph, buttons, then its parts. */
function CopyPreview({ form }: { form: SectionForm }) {
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

function PreviewButtons({ form, gold = false }: { form: SectionForm; gold?: boolean }) {
  const primary = form.cta_label.trim();
  const secondary = form.cta_secondary_label.trim();
  if (!primary && !secondary) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {primary ? (
        <span
          className={`inline-flex min-h-10 items-center rounded-full px-5 text-sm font-semibold ${
            gold ? "bg-gold text-gold-ink" : "bg-brand-600 text-brand-50"
          } ${form.cta_href.trim() ? "" : "outline-2 outline-dashed outline-amber-500"}`}
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
