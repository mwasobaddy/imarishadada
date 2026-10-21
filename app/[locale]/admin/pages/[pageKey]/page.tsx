import { notFound } from "next/navigation";

import { getPageWithSections } from "@/app/[locale]/admin/actions/pages";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { PagesEditor } from "@/components/admin/pages-editor";
import type { MediaOption } from "@/components/admin/media-picker";
import { loadPreviewData } from "@/lib/admin/preview-data";
import { toPreviewSection, toSectionForm } from "@/lib/admin/section-form";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

/** Uploaded media for the picker. Empty is fine — the 48 shipped photographs still list. */
async function loadUploadedMedia(): Promise<MediaOption[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("media")
    .select("file_path, file_name, alt_text, consent_tier, width, height")
    .order("created_at", { ascending: false });
  return (data ?? []).map((m) => ({
    path: m.file_path,
    label: m.file_name,
    group: "uploaded",
    width: m.width ?? 0,
    height: m.height ?? 0,
    alt: m.alt_text,
    consentTier: m.consent_tier,
    source: "uploaded" as const,
  }));
}

export default async function PageSectionsPage({
  params,
}: {
  params: Promise<{ pageKey: string }>;
}) {
  const { pageKey } = await params;
  const [{ page, sections }, media] = await Promise.all([
    getPageWithSections(pageKey),
    loadUploadedMedia(),
  ]);

  if (!page) notFound();

  // The exact previews render the page's own components, which need the
  // published data beside the copy — the programme cards, the giving tiers,
  // the partners. Only the pages that render those load them.
  const forms = sections.map((section) => toSectionForm(section));
  const previewData = await loadPreviewData(
    pageKey,
    forms.map((form) => toPreviewSection(form)),
  );

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Pages"
        title={page.label}
        description={page.description ?? undefined}
        count={`${sections.length} ${sections.length === 1 ? "section" : "sections"}`}
      />

      {sections.length === 0 ? (
        <EmptyState
          title="No editable sections yet"
          description="This page's copy is still in code. It moves here when its sections are seeded — see doc/page-editor.md §8."
        />
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-border bg-surface-lilac/40 px-5 py-3.5">
            <p className="text-sm leading-relaxed text-ink-muted">
              Change the words, pictures and buttons. The layout and page structure stay in
              code, so nothing here can break the page outline. Each section shows only
              the fields its own page reads, so there is nothing to type into that goes
              nowhere. Search titles and descriptions are written page by page in code.
            </p>
          </div>

          <PagesEditor
            page={{ label: page.label, route: page.route }}
            sections={forms}
            media={media}
            previewData={previewData}
          />
        </>
      )}
    </div>
  );
}
