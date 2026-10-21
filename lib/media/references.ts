import { createServiceClient } from "@/lib/supabase/client";

/**
 * Where a photograph is used.
 *
 * ## The problem
 *
 * A photograph in the media library can be pointed at by a section, a story,
 * a post, a programme, a partner, a school, a team member or an event. The
 * library did not know about any of that, so deleting a file left the page
 * pointing at nothing: a broken image on a live page, with no record of why
 * and no way back except finding the reference by hand.
 *
 * ## The rule
 *
 * A file that is in use cannot be deleted. The editor is told where it is
 * used, with a link to each place, and changes those first.
 *
 * The alternative — delete anyway and leave a broken image — is the worst of
 * the three options. It breaks a live page, it breaks it silently, and on a
 * charity's site a broken photograph of a child is not a small thing.
 *
 * ## How a reference is recognised
 *
 * A reference holds either the storage path (`1760000000-photo.webp`) or the
 * public URL that path resolves to
 * (`https://…/storage/v1/object/public/public-media/1760000000-photo.webp`).
 * Both contain the storage path, so the match is a literal containment
 * check. Containment rather than equality, because the two forms are
 * different strings for the same file.
 *
 * Uploaded paths carry a timestamp and the original file name, so a literal
 * containment match cannot collide with another file in practice.
 */

export type MediaReference = {
  /** Where the file is used, in the editor's words. */
  label: string;
  /** Where to go to change it. */
  href: string;
  /** The table the reference lives in. */
  table: string;
  /** The row the reference lives in. */
  rowId: string;
  /** Whether it is on a live page right now. */
  live: boolean;
};

type Row = Record<string, unknown>;

type Context = {
  /** page_key to the page's label and route. */
  pages: Map<string, { label: string; route: string }>;
};

/**
 * Every place a photograph can be used.
 *
 * The list is explicit rather than discovered, because "every table with a
 * column that looks like a path" is how a reference check starts matching
 * things it should not. Each entry names the column, how to describe the row
 * to an editor, and where the editor goes to change it.
 */
export type ReferenceSource = {
  table: string;
  /** Text columns that can hold the file. */
  columns: string[];
  /** JSON columns holding an array of images. */
  jsonColumns?: string[];
  /** The columns to fetch. */
  select: string;
  label: (row: Row, ctx: Context) => string;
  href: (row: Row, ctx: Context) => string;
  live: (row: Row) => boolean;
};

/**
 * Every place a photograph can be used.
 *
 * Exported so a test can pin the list against the schema: a new column that
 * holds an image must be added here, or the delete guard will let a file be
 * removed while a page still points at it.
 */
export const MEDIA_REFERENCE_SOURCES: ReferenceSource[] = [
  {
    table: "site_sections",
    columns: ["image_path"],
    jsonColumns: ["images"],
    select: "id, section_key, page_key, heading, image_path, images, active",
    label: (row, ctx) => {
      const page = ctx.pages.get(String(row.page_key ?? ""));
      const heading = String(row.heading ?? "").trim();
      const where = page ? `${page.label} page` : "a page";
      return heading ? `${where} — “${heading}”` : where;
    },
    href: (row) => `/admin/pages/${String(row.page_key ?? "")}`,
    live: (row) => row.active !== false,
  },
  {
    table: "stories",
    columns: ["image_path"],
    select: "id, slug, title, image_path, published",
    label: (row) => `the story “${String(row.title ?? "").trim()}”`,
    href: (row) => `/admin/content/stories/${String(row.id)}`,
    live: (row) => row.published === true,
  },
  {
    table: "posts",
    columns: ["cover_path"],
    select: "id, slug, title, cover_path, published",
    label: (row) => `the post “${String(row.title ?? "").trim()}”`,
    href: (row) => `/admin/content/posts/${String(row.id)}`,
    live: (row) => row.published === true,
  },
  {
    table: "programmes",
    columns: ["image_path"],
    select: "id, slug, title, image_path, active",
    label: (row) => `the ${String(row.title ?? "").trim()} programme`,
    href: () => "/admin/content/programmes",
    live: (row) => row.active !== false,
  },
  {
    table: "partners",
    columns: ["logo_path"],
    select: "id, name, logo_path, active",
    label: (row) => `the partner ${String(row.name ?? "").trim()}`,
    href: () => "/admin/content/partners",
    live: (row) => row.active !== false,
  },
  {
    table: "partner_schools",
    columns: ["logo_path"],
    select: "id, name, logo_path, active",
    label: (row) => `the partner school ${String(row.name ?? "").trim()}`,
    href: () => "/admin/content/partners",
    live: (row) => row.active !== false,
  },
  {
    table: "team_members",
    columns: ["photo_path"],
    select: "id, name, photo_path, active",
    label: (row) => `${String(row.name ?? "").trim()} on the team`,
    href: () => "/admin/content/team",
    live: (row) => row.active !== false,
  },
  {
    table: "events",
    columns: ["image_path"],
    select: "id, slug, title, image_path, published",
    label: (row) => `the event “${String(row.title ?? "").trim()}”`,
    href: (row) => `/admin/content/events/${String(row.id)}`,
    live: (row) => row.published === true,
  },
];

/**
 * Whether a stored value points at this file.
 *
 * Both the bare storage path and the public URL contain the path, so one
 * containment check covers both.
 */
export function referenceMatchesFile(value: unknown, filePath: string): boolean {
  if (typeof value !== "string") return false;
  if (!value || !filePath) return false;
  return value === filePath || value.includes(filePath);
}

/** The paths inside a JSON column of images. */
function jsonPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const paths: string[] = [];
  for (const entry of value) {
    const path = (entry as Row | null)?.path;
    if (typeof path === "string" && path) paths.push(path);
  }
  return paths;
}

/**
 * Where each of these files is used.
 *
 * One pass over the referencing tables, whatever the number of files, so the
 * media library can show usage for every file it lists without a query per
 * file.
 */
export async function findMediaUsage(
  filePaths: string[],
): Promise<Map<string, MediaReference[]>> {
  const usage = new Map<string, MediaReference[]>();
  if (filePaths.length === 0) return usage;

  const supabase = createServiceClient();

  // The page labels, so a section can be named by the page it is on rather
  // than by its key.
  const { data: pageRows } = await supabase
    .from("site_pages")
    .select("page_key, label, route");
  const pages = new Map<string, { label: string; route: string }>();
  for (const row of pageRows ?? []) {
    pages.set(String(row.page_key), { label: String(row.label), route: String(row.route) });
  }
  const ctx: Context = { pages };

  await Promise.all(
    MEDIA_REFERENCE_SOURCES.map(async (source) => {
      const columns = [...source.columns, ...(source.jsonColumns ?? [])];
      const { data } = await supabase
        .from(source.table as never)
        .select(source.select)
        .or(columns.map((column) => `${column}.not.is.null`).join(","));

      for (const row of (data ?? []) as Row[]) {
        const values: string[] = [];
        for (const column of source.columns) {
          const value = row[column];
          if (typeof value === "string") values.push(value);
        }
        for (const column of source.jsonColumns ?? []) {
          values.push(...jsonPaths(row[column]));
        }

        for (const path of filePaths) {
          if (!values.some((value) => referenceMatchesFile(value, path))) continue;
          const list = usage.get(path) ?? [];
          list.push({
            label: source.label(row, ctx),
            href: source.href(row, ctx),
            table: source.table,
            rowId: String(row.id),
            live: source.live(row),
          });
          usage.set(path, list);
        }
      }
    }),
  );

  return usage;
}

/** A sentence naming the places a file is used. */
export function describeReferences(references: MediaReference[]): string {
  return references.map((reference) => reference.label).join(", ");
}
