"use client";

import { useCallback, useState } from "react";
import { ExternalLink, Eye, EyeOff, RefreshCw, Smartphone, Monitor, X } from "lucide-react";

import { SectionEditor } from "@/components/admin/section-editor";
import type { MediaOption } from "@/components/admin/media-picker";
import { sectionLabel, type SectionForm } from "@/lib/admin/section-form";
import type { PreviewData } from "@/lib/admin/preview-data";

/**
 * The page editor.
 *
 * ## One section at a time
 *
 * All sections stay mounted, so switching does not throw away unsaved words —
 * only the open one renders its fields. The rail is there to move between them
 * without scrolling a page-length stack.
 *
 * ## The preview above the editor is the real page
 *
 * The section preview beside the fields is live but approximate about the
 * surrounding layout. This one is the actual page, in an iframe, at the width
 * the editor chooses. It shows saved data, so it refreshes after a save rather
 * than on every keystroke — anything else would be a second public page with
 * unpublished words on it.
 */
export function PagesEditor({
  page,
  sections,
  media,
  previewData,
  canEditSeo,
}: {
  page: { label: string; route: string };
  sections: SectionForm[];
  media: MediaOption[];
  /** The published data the exact previews render alongside the copy. */
  previewData: PreviewData;
  canEditSeo: boolean;
}) {
  const [openKey, setOpenKey] = useState<string | null>(sections[0]?.section_key ?? null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const handleDirty = useCallback((key: string, value: boolean) => {
    setDirty((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const unsavedCount = Object.values(dirty).filter(Boolean).length;

  function select(key: string) {
    setOpenKey(key);
    requestAnimationFrame(() => {
      document
        .getElementById(`section-${key}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen((open) => !open)}
          aria-expanded={previewOpen}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          <Eye className="h-4 w-4" />
          {previewOpen ? "Hide page preview" : "Preview the page"}
        </button>
        <a
          href={page.route}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          <span className="font-mono text-xs">{page.route}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <p className="ml-auto text-xs text-ink-muted">
          {unsavedCount > 0
            ? `${unsavedCount} ${unsavedCount === 1 ? "section has" : "sections have"} unsaved changes`
            : "One section at a time. Edits stay here until you press Save."}
        </p>
      </div>

      {previewOpen && (
        <LivePagePreview
          route={page.route}
          version={version}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Phone and tablet: a row of chips. The rail below takes over at xl. */}
      <nav aria-label="Sections on this page" className="mb-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
        {sections.map((section, index) => (
          <button
            key={section.section_key}
            type="button"
            onClick={() => select(section.section_key)}
            aria-current={openKey === section.section_key ? "true" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              openKey === section.section_key
                ? "border-brand-600 bg-brand-50 text-brand-600"
                : "border-border bg-card text-ink-muted"
            }`}
          >
            <span className="font-mono text-[10px] opacity-60">
              {String(index + 1).padStart(2, "0")}
            </span>
            {sectionLabel(section)}
            {!section.active && <EyeOff className="h-3 w-3" />}
          </button>
        ))}
      </nav>

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Sections on this page" className="hidden xl:block">
          <div className="sticky top-20">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-muted/60">
              On this page
            </p>
            <ol className="space-y-0.5">
              {sections.map((section, index) => {
                const selected = openKey === section.section_key;
                const isDirty = Boolean(dirty[section.section_key]);
                return (
                  <li key={section.section_key}>
                    <button
                      type="button"
                      onClick={() => select(section.section_key)}
                      aria-current={selected ? "true" : undefined}
                      title={sectionLabel(section)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                        selected
                          ? "bg-brand-50 font-medium text-brand-600"
                          : "text-ink-muted hover:bg-surface-lilac hover:text-ink"
                      }`}
                    >
                      <span className="w-4 shrink-0 font-mono text-[10px] opacity-60">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{sectionLabel(section)}</span>
                      {!section.active && (
                        <>
                          <EyeOff
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-ink-muted/70"
                          />
                          <span className="sr-only">Hidden</span>
                        </>
                      )}
                      {isDirty && (
                        <>
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                          />
                          <span className="sr-only">Unsaved changes</span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        <div className="min-w-0 space-y-3">
          {sections.map((section, index) => (
            <SectionEditor
              key={section.section_key}
              index={index + 1}
              section={section}
              route={page.route}
              media={media}
              previewData={previewData}
              open={openKey === section.section_key}
              onToggle={() =>
                setOpenKey((current) =>
                  current === section.section_key ? null : section.section_key,
                )
              }
              onSaved={() => setVersion((value) => value + 1)}
              onDirtyChange={handleDirty}
              canEditSeo={canEditSeo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The saved page, in a frame, at the width the editor picks. */
function LivePagePreview({
  route,
  version,
  onClose,
}: {
  route: string;
  version: number;
  onClose: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reload, setReload] = useState(0);

  return (
    <section aria-label="Page preview" className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <p className="text-sm font-medium text-ink">Page preview</p>
        <p className="text-xs text-ink-muted">
          Shows the saved page. Save a section to see its change here.
        </p>

        <div className="ml-auto flex items-center gap-1">
          <div
            role="group"
            aria-label="Preview width"
            className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
          >
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-pressed={device === "desktop"}
              aria-label="Desktop width"
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                device === "desktop" ? "bg-brand-600 text-brand-50" : "text-ink-muted"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-pressed={device === "mobile"}
              aria-label="Phone width"
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                device === "mobile" ? "bg-brand-600 text-brand-50" : "text-ink-muted"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            aria-label="Reload preview"
            title="Reload preview"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            title="Close preview"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-surface-lilac/40 p-3">
        <div className={device === "mobile" ? "mx-auto w-[390px] max-w-full" : "w-full"}>
          <iframe
            key={`${route}-${device}-${reload}-${version}`}
            src={route}
            title="The saved page"
            className="h-[70vh] min-h-[480px] w-full rounded-lg border border-border bg-white"
          />
        </div>
      </div>
    </section>
  );
}
