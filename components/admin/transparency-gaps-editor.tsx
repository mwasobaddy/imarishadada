"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/page-header";
import {
  createTransparencyGap,
  deleteTransparencyGap,
  updateTransparencyGap,
} from "@/app/[locale]/admin/actions/financial";
import type { Insert } from "@/lib/supabase/row-types";

/**
 * The transparency gaps editor.
 *
 * ## Why this exists
 *
 * The roadmap calls the gaps list "the most important section on this page" and
 * gives it one instruction: *"Mark items complete as they land. A gaps list that
 * never shrinks signals performative transparency."*
 *
 * That requires an editor. The Server Actions for `transparency_gaps` have
 * existed since migration 0007 — `create`, `update`, `delete`, all permission-
 * gated and audited — and nothing ever rendered them. `/admin/transparency` only
 * showed the financial breakdown, so the most important list on the page could
 * not be touched without SQL.
 *
 * ## The status select saves on change, and the rest does not
 *
 * Marking an item done is the action that happens often and should cost one
 * click. Rewriting an item's wording happens rarely and should be deliberate.
 * So the select writes immediately and the text fields wait for a Save button —
 * a single dirty-tracked row, not a form-wide submit that could silently save
 * something half-edited.
 */
type Row = {
  id: string;
  item: string;
  kind: string;
  status: string;
  target_label: string | null;
  notes: string | null;
  sort_order: number;
};

const KINDS = [
  {
    value: "governance",
    label: "What we have not yet done",
    hint: "Institutional: controls, documents and appointments. Published above the measurement list.",
  },
  {
    value: "measurement",
    label: "What we cannot yet measure",
    hint: "Things about our work we cannot yet quantify. Also read by /impact.",
  },
] as const;

const STATUSES = [
  { value: "outstanding", label: "Not yet in place" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "published", label: "Published" },
] as const;

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export function TransparencyGapsEditor({ gaps: initial }: { gaps: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [pending, startTransition] = useTransition();

  function setRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  /** The one-click action. Writes the whole row so the update is not partial. */
  function changeStatus(row: Row, status: string) {
    const previous = row.status;
    setRow(row.id, { status });
    startTransition(async () => {
      try {
        await updateTransparencyGap(row.id, toPayload({ ...row, status }));
        toast.success(
          status === "outstanding"
            ? "Marked as outstanding"
            : `Marked ${STATUSES.find((s) => s.value === status)?.label.toLowerCase()}`,
        );
      } catch (e) {
        // Put the select back rather than leaving the UI claiming a write that
        // did not happen.
        setRow(row.id, { status: previous });
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  function saveText(row: Row) {
    startTransition(async () => {
      try {
        await updateTransparencyGap(row.id, toPayload(row));
        toast.success("Gap saved. The transparency page updates within seconds.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function addGap(kind: string) {
    startTransition(async () => {
      try {
        const created = await createTransparencyGap({
          item: "A new gap",
          kind,
          status: "outstanding",
          target_label: null,
          notes: null,
          sort_order: (rows.at(-1)?.sort_order ?? 0) + 1,
        } as Insert<"transparency_gaps">);
        setRows((prev) => [...prev, created as Row]);
        toast.success("Added. Reword it before publishing.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not add");
      }
    });
  }

  function remove(row: Row) {
    if (
      !confirm(
        "Delete this gap?\n\nA closed gap should be marked done or published instead — the roadmap is explicit that the list is meant to shrink visibly, and a deleted row shrinks it invisibly.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteTransparencyGap(row.id);
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        toast.success("Gap deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Transparency gaps"
        description="Published on /transparency. Mark items done as they land — do not delete them."
      />

      {KINDS.map((kind) => {
        const kindRows = rows.filter((r) => r.kind === kind.value);

        return (
          <section key={kind.value} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-ink">{kind.label}</h2>
                <p className="mt-0.5 text-xs text-ink-muted">{kind.hint}</p>
              </div>
              <button
                type="button"
                onClick={() => addGap(kind.value)}
                disabled={pending}
                className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {kindRows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-ink-muted">
                Nothing here. An empty list on a page whose argument is honesty reads
                as an oversight, not as good news.
              </p>
            ) : null}

            <ul className="space-y-3">
              {kindRows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <input
                      value={row.item}
                      onChange={(e) => setRow(row.id, { item: e.target.value })}
                      aria-label="Gap"
                      className={`${inputClass} mt-0 min-w-0 flex-1 font-medium`}
                    />

                    <select
                      value={row.status}
                      onChange={(e) => changeStatus(row, e.target.value)}
                      disabled={pending}
                      aria-label="Status"
                      className="min-h-10 rounded-lg border border-border bg-card px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={pending}
                      className="min-h-10 rounded-lg px-3 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                    <div>
                      <label className="text-xs font-medium text-ink-muted">
                        Target
                      </label>
                      <input
                        value={row.target_label ?? ""}
                        onChange={(e) =>
                          setRow(row.id, { target_label: e.target.value })
                        }
                        placeholder="e.g. FY2026/27"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-muted">
                        Why it is still open
                      </label>
                      <textarea
                        value={row.notes ?? ""}
                        onChange={(e) => setRow(row.id, { notes: e.target.value })}
                        rows={2}
                        placeholder="What is true about this today, in plain words"
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => saveText(row)}
                      disabled={pending}
                      className="inline-flex min-h-9 items-center rounded-full bg-brand-600 px-4 text-xs font-medium text-brand-50 transition-colors hover:bg-brand-700 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <span className="text-xs text-ink-muted">
                      Target and notes are optional. The target column is hidden on the
                      page until at least one gap has one.
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** The Server Action takes a full `Insert`, so partial edits send the whole row. */
function toPayload(row: Row): Insert<"transparency_gaps"> {
  return {
    item: row.item,
    kind: row.kind,
    status: row.status,
    target_label: row.target_label || null,
    notes: row.notes || null,
    sort_order: row.sort_order,
  } as Insert<"transparency_gaps">;
}
