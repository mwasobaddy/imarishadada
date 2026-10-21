/**
 * A publish date for display, in Nairobi time.
 *
 * Pinned to the site's own timezone so a post published at 23:30 Nairobi time
 * reads as that day on the server and in every visitor's browser, rather than
 * shifting with the reader's clock.
 */
export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(date);
}

/** The ISO value for a `<time dateTime>` attribute, date only. */
export function postDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Nairobi",
  }).format(date);
}
