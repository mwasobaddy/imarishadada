/**
 * Row types for the admin panel.
 *
 * The generated `Database` type is the source of truth, but writing
 * `Database["public"]["Tables"]["giving_tiers"]["Insert"]` at every call site
 * is unreadable. These aliases keep the admin actions type-safe without
 * reaching for `any`.
 *
 * `Insert` and `Update` are deliberately distinct: `Insert` makes every
 * NOT NULL column without a default required, `Update` makes everything
 * optional. Using the wrong one is how a nullable column quietly gets
 * written as `null` instead of being left alone.
 */

import type { Database, Json } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];

export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];

/**
 * The `before`/`after` columns on `audit_log` hold arbitrary JSON.
 *
 * A table row is valid JSON, but `Row` is not assignable to `Json` directly
 * because the generated `Json` does not include `undefined` values. The
 * `as unknown as Json` cast at the call site is the honest way to say "this
 * is a row, treat it as JSON" — and it keeps the column typed as `Json`
 * rather than widening it to `any`.
 */
export type AuditSnapshot = Json;

/**
 * Insert types for tables whose slug is auto-generated from the title when
 * the editor leaves it blank. `slug` is NOT NULL in the database, but making
 * it required in the action signature would force the form to compute it —
 * and the form does not know the uniqueness rules.
 */
export type WithOptionalSlug<T extends keyof Tables> = Omit<Insert<T>, "slug"> & {
  slug?: string;
};
