import { Skeleton, SkeletonLines, SkeletonStatus } from "@/components/ui/skeleton";

/**
 * The skeleton for the page editor.
 *
 * ## Why the editor needs one
 *
 * The editor reads every section on a page and the published data the
 * previews render alongside them. That is the heaviest read in the admin, and
 * on a metered connection it is the difference between a screen that appears
 * and a screen that waits.
 *
 * ## What it mirrors
 *
 * The toolbar, the row of section chips, the rail of sections down the left,
 * and the cards down the right — each with a number, a label and a line of
 * context, exactly as the real editor draws them. The first card is open in
 * the real editor, so the first card is open here, with the field groups it
 * opens into.
 */
export function PagesEditorSkeleton() {
  return (
    <div aria-busy="true">
      <SkeletonStatus label="Loading the page editor" />

      {/* The toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="ml-auto h-3 w-56" />
      </div>

      {/* The section chips */}
      <div className="mb-3 flex gap-2 overflow-hidden pb-1">
        {[120, 96, 140, 88, 110].map((width, index) => (
          <Skeleton
            key={index}
            className="h-8 shrink-0 rounded-full"
            style={{ width }}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        {/* The rail */}
        <nav aria-hidden="true" className="hidden xl:block">
          <div className="sticky top-20 space-y-1">
            <Skeleton className="mb-2 h-3 w-20" />
            {[92, 78, 104, 84, 96].map((width, index) => (
              <Skeleton key={index} className="h-8 w-full" style={{ width }} />
            ))}
          </div>
        </nav>

        {/* The sections */}
        <div className="min-w-0 space-y-3">
          {[0, 1, 2].map((index) => (
            <article
              key={index}
              className="rounded-xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="mt-1.5 h-3 w-32" />
                </span>
                <Skeleton className="hidden h-3 w-10 sm:block" />
              </div>

              {/* The first card is open, and opens into the field groups. */}
              {index === 0 ? (
                <div className="border-t border-border px-4 py-5 sm:px-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Skeleton className="h-4 w-20" />
                        <div className="mt-3 space-y-3">
                          <Skeleton className="h-10 w-full rounded-full" />
                          <Skeleton className="h-10 w-full rounded-full" />
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <Skeleton className="h-4 w-24" />
                        <SkeletonLines lines={3} className="mt-3" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="mt-3 aspect-[3/2] w-full rounded-lg" />
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
