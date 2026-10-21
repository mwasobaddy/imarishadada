/**
 * The volunteer role vocabulary.
 *
 * ## Why it is its own module
 *
 * The type and the one pure helper about a role are needed by the public
 * volunteer page, by the admin's live preview — which renders the real
 * components from the browser — and by the database reader. A client component
 * cannot import a module that reads the database, so the parts that do not
 * read it live here.
 */
export type VolunteerRole = {
  id: string;
  title: string;
  description: string | null;
  commitment: string | null;
  requirements: string | null;
  location: string | null;
  timeCommitment: string | null;
  skillsNeeded: string[];
  positionsAvailable: number;
  positionsFilled: number;
  sortOrder: number;
};

/** Places still open on a role. Never negative, whatever the database says. */
export function placesRemaining(role: {
  positionsAvailable: number;
  positionsFilled: number;
}): number {
  return Math.max(0, role.positionsAvailable - role.positionsFilled);
}
