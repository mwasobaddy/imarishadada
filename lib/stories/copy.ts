/**
 * Pure helpers for story copy.
 *
 * Kept out of the data layer and out of components so they can be tested
 * without a database or a DOM. Three of them enforce rules that matter enough
 * to have a name.
 */

/**
 * Truncate an excerpt to a word budget.
 *
 * ## Why this is not CSS
 *
 * The roadmap is explicit: *"Excerpts must be truncated in the data layer, not
 * with CSS `line-clamp` only — otherwise the full text is in the DOM and
 * indexable as duplicate content."*
 *
 * A `line-clamp` card still ships the whole paragraph to every crawler and
 * every screen reader, and the story body is then indexed twice under two
 * URLs. Trimming here means the full text exists in exactly one place: the
 * story's own page.
 *
 * ## Word-count, not character-count
 *
 * A character cut lands mid-word and reads as a bug ("...the first time anyone
 * wrote her na"). Cutting on a word boundary and appending an ellipsis reads as
 * deliberate.
 */
export function truncateExcerpt(text: string, maxWords = 30): string {
  // Collapse newlines and runs of whitespace first: an excerpt is one line, and
  // a raw "\n\n" from the admin textarea would otherwise survive into the card.
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const words = clean.split(" ");
  if (words.length <= maxWords) return clean;

  return `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * Fill `{token}` placeholders in editor-managed copy.
 *
 * Two pieces of the story detail copy vary per story — the participant's name
 * in the consent banner, and the reporting period in the cohort line. Both are
 * editable sentences with one varying part, so they are stored as templates
 * rather than as fixed strings.
 *
 * ## Unknown tokens are left alone, deliberately
 *
 * If an editor writes `{nmae}`, this leaves `{nmae}` on the page. That is ugly,
 * and that is the point: it is visible in review and someone fixes it. Blanking
 * it would silently produce " has given written permission", which reads as a
 * finished sentence and ships.
 */
export function fillTemplate(
  copy: string,
  vars: Record<string, string | null | undefined>,
): string {
  return copy.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return typeof value === "string" && value.trim() ? value : match;
  });
}

/** Words too common to be a name, and too short to be worth matching. */
const NAME_STOPWORDS = new Set([
  "the", "and", "her", "his", "she", "him", "from", "with", "for", "not",
  "was", "are", "but", "her", "they", "them", "kibera", "nairobi", "kenya",
]);

/** Split a name-ish string into comparable tokens. */
function nameTokens(value: string): string[] {
  return value
    .toLowerCase()
    // Keep letters only, so "Amina's" and "Amina," both yield "amina".
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !NAME_STOPWORDS.has(t));
}

/**
 * Does a story title contain the participant's name?
 *
 * ## Why this exists
 *
 * The roadmap requires that an `anonymised` story *"never exposes the name in
 * `<title>`, `<meta description>`, OG tags, or JSON-LD"*. Nothing enforced that.
 * An editor could set the tier to `anonymised`, leave the title as
 * "Amina's story", and publish a story whose entire promise is that Amina
 * cannot be identified — with her name in the search result.
 *
 * The tier withholds the *attribution*; it knows nothing about the title. So
 * this compares the title against the name the editor recorded in
 * `attribution` before the tier was lowered.
 *
 * ## What it cannot do
 *
 * It cannot catch a name the editor never wrote down, and it does not read the
 * body. It is a gate on the most likely mistake, not a guarantee. The runtime
 * defence is separate and stronger: `generateMetadata` never uses an
 * anonymised story's title or excerpt at all, so a leak here cannot reach a
 * `<title>` tag regardless.
 *
 * @param title        The story title, as typed.
 * @param attribution  The recorded name, e.g. "Amina, 19 · Kibera".
 */
export function titleLeaksName(title: string, attribution: string | null): boolean {
  if (!attribution?.trim() || !title.trim()) return false;

  const name = nameTokens(attribution);
  if (name.length === 0) return false;

  const titleTokens = new Set(nameTokens(title));
  return name.some((token) => titleTokens.has(token));
}
