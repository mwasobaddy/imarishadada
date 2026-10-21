"use server";

import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

/**
 * Search across the admin.
 *
 * ## What it searches
 *
 * The content an editor writes, not the database. A story, a post, an event,
 * a programme, a FAQ, a team member, a partner, a photograph, a volunteer
 * role, a page of copy.
 *
 * ## What it does not do
 *
 * It does not search what the caller may not read. Each source names the
 * permission it needs, and a source the caller cannot read is not searched
 * at all — not searched and hidden afterwards. A search that lists what
 * somebody is not allowed to see is a way of showing it to them.
 *
 * ## The shape of a result
 *
 * A label, a line of context, and somewhere to go. Where a row has its own
 * page, the result goes there; where the editor is a list with a modal, the
 * result goes to the list and the context line says which item it is.
 */
export type AdminSearchResult = {
  id: string;
  /** What the thing is called. */
  label: string;
  /** The line under the label: a slug, a role, a location. */
  detail: string;
  /** Where to go. */
  href: string;
  /** What kind of thing it is — "Story", "Partner". */
  kind: string;
};

type Source = {
  /** The permission that has to hold for this source to be searched. */
  resource: string;
  table: string;
  /** The column the query is matched against. */
  column: string;
  select: string;
  kind: string;
  /** Where a match goes. */
  href: (row: Record<string, unknown>) => string;
  /** The line under the label. */
  detail: (row: Record<string, unknown>) => string;
};

const SOURCES: Source[] = [
  {
    resource: "stories",
    table: "stories",
    column: "title",
    select: "id, title, slug, published",
    kind: "Story",
    href: (row) => `/admin/content/stories/${String(row.id)}`,
    detail: (row) => (row.published ? "Published" : "Draft"),
  },
  {
    resource: "posts",
    table: "posts",
    column: "title",
    select: "id, title, slug, category, published",
    kind: "Post",
    href: (row) => `/admin/content/posts/${String(row.id)}`,
    detail: (row) => String(row.category ?? ""),
  },
  {
    resource: "events",
    table: "events",
    column: "title",
    select: "id, title, location, published",
    kind: "Event",
    href: (row) => `/admin/content/events/${String(row.id)}`,
    detail: (row) => String(row.location ?? ""),
  },
  {
    resource: "programmes",
    table: "programmes",
    column: "title",
    select: "id, title, stat_label",
    kind: "Programme",
    href: () => "/admin/content/programmes",
    detail: (row) => String(row.stat_label ?? ""),
  },
  {
    resource: "faqs",
    table: "faqs",
    column: "question",
    select: "id, question, category",
    kind: "FAQ",
    href: () => "/admin/content/faqs",
    detail: (row) => String(row.category ?? ""),
  },
  {
    resource: "team_members",
    table: "team_members",
    column: "name",
    select: "id, name, role, title",
    kind: "Team",
    href: () => "/admin/content/team",
    detail: (row) => String(row.role ?? row.title ?? ""),
  },
  {
    resource: "partners",
    table: "partners",
    column: "name",
    select: "id, name, tier",
    kind: "Partner",
    href: () => "/admin/content/partners",
    detail: (row) => String(row.tier ?? ""),
  },
  {
    resource: "media",
    table: "media",
    column: "file_name",
    select: "id, file_name, alt_text",
    kind: "Media",
    href: () => "/admin/media",
    detail: (row) => String(row.alt_text ?? ""),
  },
  {
    resource: "volunteer_roles",
    table: "volunteer_roles",
    column: "title",
    select: "id, title, location",
    kind: "Volunteer role",
    href: () => "/admin/volunteer-roles",
    detail: (row) => String(row.location ?? ""),
  },
  {
    resource: "pages",
    table: "site_pages",
    column: "label",
    select: "id, page_key, label, route",
    kind: "Page",
    href: (row) => `/admin/pages/${String(row.page_key)}`,
    detail: (row) => String(row.route ?? ""),
  },
];

/**
 * Escape the wildcards in what the user typed.
 *
 * `_` is a single-character wildcard in `ilike` and `%` matches anything, so
 * a search for "50%" would otherwise match every row that has a percent sign
 * anywhere — or, worse, every row.
 */
function escapeLike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** How many results one kind of thing may contribute. */
const PER_SOURCE = 5;

/**
 * Search the admin.
 *
 * An empty query returns nothing: the palette shows the pages of the admin
 * instead, which is what someone opening it with nothing in mind wants.
 */
export async function searchAdmin(query: string): Promise<AdminSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const pattern = `%${escapeLike(trimmed)}%`;
  const supabase = createServiceClient();

  const results: AdminSearchResult[] = [];

  await Promise.all(
    SOURCES.map(async (source) => {
      if (!(await hasPermission(source.resource, "read"))) return;

      const { data } = await supabase
        .from(source.table as never)
        .select(source.select)
        .ilike(source.column, pattern)
        .limit(PER_SOURCE);

      for (const row of (data ?? []) as Record<string, unknown>[]) {
        const label = String(row[source.column] ?? "").trim();
        if (!label) continue;
        results.push({
          id: `${source.table}-${String(row.id)}`,
          label,
          detail: source.detail(row),
          href: source.href(row),
          kind: source.kind,
        });
      }
    }),
  );

  // The sources run in parallel, so the order they arrive in is the order
  // they finished. Sorting puts the closest match first: a title that starts
  // with what was typed beats one that has it in the middle.
  return results.sort((a, b) => {
    const aStarts = a.label.toLowerCase().startsWith(trimmed.toLowerCase()) ? 0 : 1;
    const bStarts = b.label.toLowerCase().startsWith(trimmed.toLowerCase()) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.label.localeCompare(b.label);
  });
}
