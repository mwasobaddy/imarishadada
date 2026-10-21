/**
 * The reporting period.
 *
 * ## Why it is a constant and not a date
 *
 * It is a real, fixed window. It is not derived from `new Date()`, which
 * would change on every render and make the page non-deterministic.
 *
 * ## Why it lives on its own
 *
 * The page renders it six times, and every figure on the page carries the
 * period it covers. It must be one value, and the admin's live preview renders
 * the same components the page does — so it has to be readable from a client
 * component, which `lib/data/impact.ts` is not (it reads the database and
 * `next/cache`).
 */
export const REPORTING_PERIOD = {
  from: "1 April 2025",
  to: "31 March 2026",
  label: "2025–26",
} as const;
