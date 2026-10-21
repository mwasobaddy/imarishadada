/**
 * When a partner may be shown publicly.
 *
 * The rule lives in three places and must agree: this function (which gives the
 * editor a plain-English reason), the `partners_live_needs_permission` CHECK
 * constraint (which refuses the write), and the `partners_anon_read` policy
 * (which hides the row from the anonymous API). The constraint is the gate; this
 * function exists so the admin can be told why, instead of being shown a raw
 * constraint name.
 *
 * Written permission is a rule, not a preference. The roadmap is explicit that
 * a logo must not render before the partnership is signed, and a list of names
 * on a funder's due-diligence page reads as a claim.
 */

export type PartnerVisibilityInput = {
  active: boolean;
  is_test: boolean;
  permission_confirmed_at: string | null | undefined;
};

/** Why this partner cannot be active, or `null` if it can. */
export function activationBlocker(p: PartnerVisibilityInput): string | null {
  if (!p.active) return null;
  if (p.is_test) {
    return "A test partner cannot be active. Untick Test partner, or untick Active.";
  }
  if (!p.permission_confirmed_at) {
    return "Record written permission from the organisation before making it active. Until then it stays hidden.";
  }
  return null;
}
