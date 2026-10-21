/**
 * The fields each section's page actually reads.
 *
 * ## Why this exists
 *
 * The editor offered every field to every section: a label above the heading, a
 * paragraph, a second paragraph, a figures line, two buttons, a picture, a
 * list of steps, a gallery, and a search listing. Most sections use a handful
 * of those, and the rest were traps — an editor could type into "figures
 * line" on the About page and watch it go nowhere.
 *
 * A field that does nothing is worse than no field: it looks like it works.
 *
 * ## How the list was worked out
 *
 * By reading the components, not by guessing. Each section's preview renders
 * the same component the page renders, so the fields a section reads are the
 * ones its component reads. The list below is that reading, kept next to the
 * registry that renders it.
 *
 * ## The search listing is not here
 *
 * `seo_title` and `seo_description` are read by nothing on the site. The
 * page's search title and description are written in code, page by page, and
 * the section rows carry nothing. The editor showed a search-result preview of
 * a listing that was never going to exist, so the group is gone. See
 * `doc/page-editor.md` §21 for what wiring it would take.
 */
export type SectionField =
  | "eyebrow"
  | "heading"
  | "body"
  | "body_secondary"
  | "stat_line"
  | "cta"
  | "cta_secondary"
  | "image"
  | "steps"
  | "images";

export const SECTION_FIELDS: Record<string, readonly SectionField[]> = {
  /* ---- Home ---- */
  // The hero's own label is code (":: KIBERA, NAIROBI ::"), so the section's
  // eyebrow is not one of its fields.
  "home-hero": ["heading", "body", "cta", "cta_secondary", "stat_line", "image"],
  "home-programmes": ["eyebrow", "heading", "body", "cta"],
  "home-giving": ["eyebrow", "heading", "body"],
  "home-partners": ["eyebrow", "heading", "body"],

  /* ---- About ---- */
  "about-hero": ["eyebrow", "heading", "body"],
  "about-story": ["eyebrow", "heading", "body"],
  "about-quote": ["eyebrow", "heading"],
  "about-vision": ["eyebrow", "heading", "body"],
  "about-mission": ["eyebrow", "heading", "body"],
  // The six values come from their own table; this section is the heading.
  "about-values": ["eyebrow", "heading"],
  "about-work": ["eyebrow", "heading", "body", "cta"],
  "about-approach": ["eyebrow", "heading"],
  "about-team": ["eyebrow", "heading", "body"],
  // The photographs are the carousel; the body is its caption.
  "about-carousel": ["heading", "body", "images"],

  /* ---- Contact ---- */
  "contact-hero": ["eyebrow", "heading", "body"],
  "contact-methods": ["eyebrow", "heading", "body"],
  // A heading over the secondary channels, not a section of its own.
  "contact-methods-other": ["heading"],
  "contact-form": ["heading", "body"],
  "contact-faqs": ["heading", "steps"],
  "contact-partner": ["heading", "body", "cta"],

  /* ---- Donate ---- */
  "donate-hero": ["eyebrow", "heading", "body"],
  "donate-impact": ["heading", "body", "cta"],

  /* ---- FAQ ---- */
  "faq-hero": ["eyebrow", "heading", "body"],
  "faq-empty": ["heading", "body", "cta"],
  "faq-contact": ["heading", "body", "cta"],

  /* ---- Impact ---- */
  "impact-hero": ["eyebrow", "heading", "body"],
  "impact-headline": ["heading", "body"],
  "impact-by-programme": ["heading", "body"],
  "impact-methodology": ["eyebrow", "heading", "body", "steps"],
  "impact-gaps": ["heading", "body"],
  "impact-reports": ["heading", "body", "images"],

  /* ---- News ---- */
  "news-hero": ["eyebrow", "heading", "body"],
  "news-empty": ["heading", "body", "cta"],

  /* ---- Partner ---- */
  "partner-hero": ["eyebrow", "heading", "body"],
  "partner-need": ["heading", "body", "body_secondary", "steps"],
  "partner-cannot": ["heading", "body", "steps"],
  "partner-dd": ["heading", "body", "body_secondary", "cta"],
  "partner-partners": ["heading", "body"],
  "partner-form": ["heading", "body"],
  "partner-direct": ["heading", "body"],

  /* ---- Programmes ---- */
  "programmes-hero": ["eyebrow", "heading", "body"],
  "programmes-pathway": ["eyebrow", "heading", "body", "steps"],
  "programmes-measure": ["heading", "body", "cta"],
  "programmes-unrestricted": ["heading", "body", "body_secondary", "cta"],

  /* ---- Stories ---- */
  "stories-hero": ["eyebrow", "heading", "body"],
  // Only the heading: the page renders the card under it, not a paragraph.
  "stories-featured": ["heading"],
  "stories-grid": ["heading", "body"],
  "stories-empty": ["heading", "body", "cta"],
  "stories-consent": ["heading", "body", "cta"],
  "stories-ladies-room": ["eyebrow", "heading", "body"],
  // The story detail page's own sections.
  "story-consent-banner": ["heading", "body"],
  "story-anonymised": ["heading", "body", "cta"],
  "story-cohort": ["heading", "body"],
  "story-more": ["heading"],
  "story-share": ["heading", "body"],

  /* ---- Transparency ---- */
  "transparency-hero": ["eyebrow", "heading", "body"],
  "transparency-gaps": ["heading", "body", "body_secondary", "cta"],
  "transparency-measure": ["heading", "body", "body_secondary", "cta"],
  "transparency-money": ["heading", "body", "body_secondary", "cta"],
  "transparency-money-status": ["heading", "body"],
  "transparency-governance": ["heading", "body", "body_secondary", "cta"],
  "transparency-safeguarding": ["heading", "body", "body_secondary", "cta"],
  "transparency-complaints": ["heading", "body", "body_secondary", "cta"],

  /* ---- Volunteer ---- */
  "volunteer-hero": ["eyebrow", "heading", "body"],
  "volunteer-roles": ["heading", "body"],
  "volunteer-roles-empty": ["heading", "body"],
  "volunteer-process": ["heading", "body", "steps"],
  "volunteer-safeguarding": ["heading", "body", "steps", "cta"],
  "volunteer-form": ["heading", "body"],
  "volunteer-remote": ["heading", "body", "cta"],

  /* ---- Ways to give ---- */
  "ways-hero": ["eyebrow", "heading", "body"],
  "ways-ladder": ["eyebrow", "heading", "body"],
  "ways-rails": ["heading", "body", "cta"],
  "ways-transparency": ["heading", "body", "steps"],
  "ways-organisation": ["heading", "body", "cta"],
  "ways-other": ["heading", "body", "steps"],

  /* ---- The programme pages ---- */
  "reentry-lead": ["eyebrow", "heading", "body"],
  "reentry-story": ["eyebrow", "heading", "body", "steps"],
  "econ-lead": ["eyebrow", "heading", "body"],
  "econ-story": ["eyebrow", "heading", "body", "steps"],
  "dada-lead": ["eyebrow", "heading", "body"],
  "dada-problems": ["eyebrow", "heading", "body", "steps"],
  "dada-why": ["eyebrow", "heading", "body", "steps"],
  "dada-how": ["eyebrow", "heading", "body", "steps"],
  // A position, not a block of copy.
  "dada-quote": ["eyebrow", "heading"],
  "hub-lead": ["eyebrow", "heading", "body"],
  "hub-what": ["eyebrow", "heading", "body"],
};

/** Every field, for a section the map does not know about. */
export const ALL_SECTION_FIELDS: readonly SectionField[] = [
  "eyebrow",
  "heading",
  "body",
  "body_secondary",
  "stat_line",
  "cta",
  "cta_secondary",
  "image",
  "steps",
  "images",
];

/** The fields a section reads. */
export function fieldsFor(sectionKey: string): readonly SectionField[] {
  return SECTION_FIELDS[sectionKey] ?? ALL_SECTION_FIELDS;
}
