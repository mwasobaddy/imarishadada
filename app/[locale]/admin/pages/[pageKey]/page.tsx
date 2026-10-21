import { notFound } from "next/navigation";

import { getPageWithSections } from "@/app/[locale]/admin/actions/pages";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { PagesEditor } from "@/components/admin/pages-editor";
import { loadPreviewData } from "@/lib/admin/preview-data";
import { toPreviewSection, toSectionForm } from "@/lib/admin/section-form";

export default async function PageSectionsPage({
  params,
}: {
  params: Promise<{ pageKey: string }>;
}) {
  const { pageKey } = await params;
  const { page, sections } = await getPageWithSections(pageKey);

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
            previewData={previewData}
          />
        </>
      )}
    </div>
  );
}
