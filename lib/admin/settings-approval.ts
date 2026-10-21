/**
 * The rules for a staged setting change.
 *
 * ## Why these are here and not in the action
 *
 * A financial setting is staged for approval rather than applied, because it
 * needs two people: the person who changes it and somebody else who decides
 * it. Three rules make that true, and each of them is easy to break by
 * accident:
 *
 *   1. **A change can only be decided once.** Without this the button applied
 *      the value on every press and wrote an audit row each time.
 *   2. **The person who staged a change cannot approve it.** Without this the
 *      two-person rule is a sentence in a comment.
 *   3. **Only the newest waiting change for a setting can be approved.** Two
 *      proposals for the same setting are two different decisions, and
 *      approving the older one would apply a value the organisation has
 *      already moved past.
 *
 * They are pure, so they can be reasoned about and tested without a database.
 * The action applies them, the database enforces them, and
 * `tests/unit/settings-approval.test.ts` pins them.
 */

export type StagedChangeStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "superseded";

export type StagedChange = {
  id: string;
  key: string;
  status: StagedChangeStatus;
  /** The staff member who staged it. Null for the auto-versioned history. */
  changed_by: string | null;
  changed_at: string;
};

/** Whether a change is still waiting for a decision. */
export function canApprove(change: StagedChange): boolean {
  return change.status === "pending";
}

/**
 * Whether this person may approve this change.
 *
 * A change that has already been decided cannot be applied again, and the
 * person who staged it cannot approve it. With `changed_by` empty — the
 * auto-versioned history rows — there is nobody to compare against, and the
 * approval stands on the permission alone.
 */
export function mayApprove(change: StagedChange, staffId: string | null): boolean {
  if (!canApprove(change)) return false;
  if (!staffId) return false;
  if (!change.changed_by) return true;
  return change.changed_by !== staffId;
}

/** Whether this change is the one waiting for a setting. */
export function isNewestWaiting(
  change: StagedChange,
  all: StagedChange[],
): boolean {
  return !all.some(
    (other) =>
      other.key === change.key &&
      other.status === "pending" &&
      other.changed_at > change.changed_at,
  );
}
