import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { getPageWithSections } from "@/app/[locale]/admin/actions/pages";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import type { MediaOption } from "@/components/admin/media-picker";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { SectionEditor } from "@/components/admin/section-editor";

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

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Pages"
        title={page.label}
        description={page.description ?? undefined}
        count={`${sections.length} ${sections.length === 1 ? "section" : "sections"}`}
        action={
          <a
            href={page.route}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            <span className="font-mono text-xs">{page.route}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      {sections.length === 0 ? (
        <EmptyState
          title="No editable sections yet"
          description="This page's copy is still in code. It moves here when its sections are seeded — see doc/page-editor.md §8."
        />
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-border bg-surface-lilac/40 px-5 py-4">
            <p className="text-sm leading-relaxed text-ink-muted">
              You can change the words, the picture and the button labels. The
              layout, the heading level and the page structure stay in code, so a
              change here cannot break the page outline or its SEO.
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((section) => (
              <SectionEditor
                key={section.section_key}
                section={{
                  ...section,
                  steps: (section.steps as { title: string; description: string }[] | null) ?? null,
                  images: (section.images as { path: string; alt: string }[] | null) ?? null,
                }}
                route={page.route}
                media={media}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
