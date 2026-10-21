import { getAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";

/**
 * The audit trail.
 *
 * ## Why this is a helper and not forty copies of an insert
 *
 * Every action file had its own `supabase.from("audit_log").insert({...})`, and
 * every one of them had the same three faults:
 *
 *   1. **No actor.** The row was written with a service-role client, which
 *      carries no user, so `actor_id` and `actor_email` were never set. The
 *      audit page showed "system" on every row, which made the page's own
 *      promise — "with who made it" — false.
 *   2. **The error was swallowed.** The insert's return value was ignored, so
 *      a rejected row (a CHECK constraint, a bad action name) vanished and
 *      the panel reported a successful change that was never recorded.
 *   3. **It was easy to forget.** Twenty-six of the sixty-seven mutations
 *      wrote no row at all, and nothing caught it.
 *
 * One function, called from every mutation, fixes the first two and gives
 * the third a guard: `tests/unit/audit-coverage.test.ts` fails if a mutation
 * stops calling it.
 *
 * ## Why a failure here does not fail the action
 *
 * The change has already been written by the time the audit row goes in.
 * Throwing would tell the editor "save failed" when it succeeded, which is
 * worse than a missing row. So the failure is written to the server log
 * loudly, where it can be found, rather than being swallowed.
 */
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "approve"
  | "reject"
  | "invite"
  | "revoke";

export async function recordAudit(entry: {
  /** What happened. The database constrains this list. */
  action: AuditAction;
  /** The table the change was made in. */
  tableName: string;
  /** The row's primary key, when it has one. */
  rowId?: string | null;
  /** The row as it was before the change. */
  before?: Json;
  /** The row as it is after the change. */
  after?: Json;
  /** Anything else worth knowing: the key of a text row, a reason, a flag. */
  metadata?: Json;
}): Promise<void> {
  const actor = await currentActor();
  const supabase = createServiceClient();

  const { error } = await supabase.from("audit_log").insert({
    action: entry.action,
    table_name: entry.tableName,
    row_id: entry.rowId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    metadata: entry.metadata ?? null,
    actor_id: actor.id,
    actor_email: actor.email,
  });

  if (error) {
    console.error(
      `[audit] ${entry.action} on ${entry.tableName} was NOT recorded:`,
      error.message,
    );
  }
}

/**
 * Who is making the change.
 *
 * The claims come from the session cookie, so this reads a signed JWT rather
 * than making a query. The email in the token is the one the person signed in
 * with, which is the address a row in the audit trail should carry.
 */
async function currentActor(): Promise<{ id: string | null; email: string | null }> {
  try {
    const supabase = await getAuthServerClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims as { sub?: string; email?: string } | undefined;
    return { id: claims?.sub ?? null, email: claims?.email ?? null };
  } catch {
    // A missing actor is worth recording as "unknown", not worth failing the
    // change over.
    return { id: null, email: null };
  }
}
