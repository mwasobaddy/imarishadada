import Link from "next/link";
import { FileText, Image as ImageIcon } from "lucide-react";

import { getPages, getSectionCounts } from "@/app/[locale]/admin/actions/pages";
import { PageHeader } from "@/components/admin/page-header";

export default async function PagesListPage() {
  const [pages, counts] = await Promise.all([getPages(), getSectionCounts()]);

  const editable = pages.filter((p) => (counts[p.page_key] ?? 0) > 0);
  const pending = pages.filter((p) => (counts[p.page_key] ?? 0) === 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Pages"
        title="Page copy"
        description="Edit the words and pictures on the fixed pages. The layout stays in code, so a change here cannot break the page structure."
        count={`${editable.length} of ${pages.length} pages editable`}
      />

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-muted/60">
          Editable now
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editable.map((page) => (
            <Link
              key={page.page_key}
              href={`/admin/pages/${page.page_key}`}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-brand-600/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-ink">{page.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-lilac text-ink-muted transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-ink-muted">{page.route}</p>
              {page.description && (
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                  {page.description}
                </p>
              )}
              <p className="mt-3 text-xs text-ink-muted">
                {counts[page.page_key]} {counts[page.page_key] === 1 ? "section" : "sections"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-muted/60">
            Not yet migrated
          </h2>
          <p className="mb-3 max-w-2xl text-sm text-ink-muted">
            These pages still have their copy in code. They move here one at a
            time — see <code className="font-mono text-xs">doc/page-editor.md</code> §8.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((page) => (
              <div
                key={page.page_key}
                className="rounded-xl border border-dashed border-border bg-surface px-5 py-4"
              >
                <p className="text-sm font-medium text-ink-muted">{page.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink-muted/70">
                  {page.route}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex items-start gap-3 rounded-xl border border-border bg-surface-lilac/40 p-5">
        <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        <p className="text-sm leading-relaxed text-ink-muted">
          Images come from the media library, which requires alt text and strips
          EXIF on upload. Location metadata in a photograph of a participant is a
          safeguarding risk, so it never reaches the server.
        </p>
      </div>
    </div>
  );
}
