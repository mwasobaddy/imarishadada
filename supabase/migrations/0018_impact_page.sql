-- Imarisha Dada — Phase 5: Impact page copy
--
-- Stage 6 of doc/page-editor.md, one page at a time. Impact is the credibility
-- page, so two things here are treated differently from the pages before it.

-- ===========================================================================
-- 1. Photographs can carry a caption
-- ===========================================================================
-- `site_sections.images` is `[{path, alt}]`. The About carousel uses one caption
-- for the whole set (the section's `body`), which is right for a carousel: six
-- photographs, one line under the stage.
--
-- The Impact page is not a carousel. It is a grid where each photograph is
-- argued separately — "the cohort behind the 2025–26 figures", "what a gift
-- becomes on the ground". A single caption for the set would lose that.
--
-- No schema change: `images` is jsonb, so `caption` is a third key. Documented
-- on the column rather than constrained, because a missing caption is a layout
-- choice and not a defect.

comment on column public.site_sections.images is
  'Ordered photographs: [{ "path": text, "alt": text, "caption"?: text }]. Renders in array order. `alt` is required per image — a photograph of a participant with no alt is an accessibility defect. `caption` is optional and shown under the image where the layout supports it.';

-- ===========================================================================
-- 2. The measurement gaps move out of code
-- ===========================================================================
-- `MEASUREMENT_GAPS` in lib/data/impact.ts and the bullets on the transparency
-- page were the same four gaps written twice, in two different phrasings. Both
-- now read `transparency_gaps`, which has been seeded since migration 0007 and
-- public since 0009 — it was simply never filled.
--
-- One canonical phrasing. The status column is what makes the list grow: when a
-- gap is closed it becomes 'measured' rather than disappearing, and the page can
-- say so.

insert into public.transparency_gaps (item, status, sort_order, notes) values
  (
    'Long-term retention beyond twelve months.',
    'not_yet_measured', 1,
    'We can state re-enrolment for the reporting period. We cannot yet state whether a girl is still in school two years later.'
  ),
  (
    'Income change for participants funded with start-up capital.',
    'not_yet_measured', 2,
    'We record that capital was disbursed and acknowledged. We do not yet track what the business earned afterwards.'
  ),
  (
    'Whether re-enrolment holds once follow-through funding ends.',
    'not_yet_measured', 3,
    'The reporting period is shorter than the support we commit to, so the honest answer is that we do not know yet.'
  ),
  (
    'Cost per participant.',
    'not_yet_measured', 4,
    'Our overhead allocation is not settled, so any figure we published would be a guess dressed as an accounting fact.'
  )
on conflict do nothing;

-- ===========================================================================
-- 3. Seed the Impact sections
-- ===========================================================================
-- Copy is lifted from the page. One deliberate change: the reporting period is
-- NOT written into any of these strings.
--
-- It appears six times on the page and must agree with `impact_stats.period` on
-- every row. As editable copy it would drift the first time someone updated a
-- figure without updating the prose. The components render it; the copy
-- describes it. See §4.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, body_secondary,
  cta_label, cta_href, sort_order
) values
  (
    'impact-hero', 'impact',
    'Our impact',
    'Numbers, and how we got them.',
    'Every figure on this page covers the same fixed reporting period, stated below. Where we do not have a number, we say so rather than estimate.',
    null, null, null, 1
  ),
  (
    'impact-headline', 'impact',
    null,
    'The headline numbers',
    'Every figure below carries the period it covers.',
    null, null, null, 2
  ),
  (
    'impact-by-programme', 'impact',
    null,
    'By programme',
    null,
    null, null, null, 3
  ),
  (
    'impact-methodology', 'impact',
    'Methodology',
    'How we count',
    'A number without a definition is a claim. These are ours.',
    null, null, null, 4
  ),
  (
    'impact-gaps', 'impact',
    null,
    'What we do not yet measure',
    'Anyone can publish a percentage. These are the things we cannot claim, and a funder should be able to see them without asking.',
    null, null, null, 5
  ),
  (
    'impact-reports', 'impact',
    null,
    'Reports and documents',
    'The written record behind the numbers. A number with no picture behind it is an assertion, so the photographs below sit beside the figures.',
    null, null, null, 6
  )
on conflict (section_key) do update
  set page_key        = excluded.page_key,
      eyebrow         = excluded.eyebrow,
      heading         = excluded.heading,
      body            = excluded.body,
      body_secondary  = excluded.body_secondary,
      cta_label       = excluded.cta_label,
      cta_href        = excluded.cta_href,
      sort_order      = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- The four methodology definitions
-- ---------------------------------------------------------------------------
-- Term and definition map onto the `steps` shape the pathway already uses
-- (`{title, description}`), so an editor meets the same widget twice rather
-- than learning a second one for the same idea.

update public.site_sections
   set steps = '[
     {"title":"Participants","description":"A girl or young woman who attended at least one programme session."},
     {"title":"Re-enrolment","description":"Confirmed by written confirmation from the receiving school, not by the participant''s word alone."},
     {"title":"Start-up capital","description":"Disbursed and acknowledged in writing by the recipient."},
     {"title":"Safe spaces","description":"A location running a scheduled, staffed programme that participants attend without referral."}
   ]'::jsonb
 where section_key = 'impact-methodology';

-- ---------------------------------------------------------------------------
-- The four field photographs
-- ---------------------------------------------------------------------------
-- Captions are the page's own. Alt text describes the photograph; the caption
-- says what it is evidence of. They are not the same sentence and neither
-- substitutes for the other.

update public.site_sections
   set images = '[
     {
       "path":"/images/impact/impact-group-with-banner.avif",
       "alt":"The full group of participants photographed with the organisation''s banner",
       "caption":"The cohort behind the 2025–26 figures"
     },
     {
       "path":"/images/impact/impact-supplies-distributed.avif",
       "alt":"Participants handing out supplies to families at the community centre",
       "caption":"What a gift becomes on the ground"
     },
     {
       "path":"/images/impact/impact-community-meal.avif",
       "alt":"A community meal served at the community centre in Kibera",
       "caption":"Community outreach, Kibera"
     },
     {
       "path":"/images/impact/impact-group-outdoors.avif",
       "alt":"Participants and staff standing together outside the community centre, smiling",
       "caption":"The team and the girls, Kibera"
     }
   ]'::jsonb
 where section_key = 'impact-reports';

-- ===========================================================================
-- 4. Why the reporting period is not editable copy
-- ===========================================================================
-- It is tempting to move `REPORTING_PERIOD` into `settings` and let an editor
-- change the window. That would be a mistake, and the reasoning belongs here
-- rather than in a commit message.
--
-- The window has to agree with `impact_stats.period`, which is per row and set
-- when a figure is recorded. If the two disagree, the page states that a number
-- covers a period it does not. That is the one error this page cannot afford,
-- because the whole page is an argument about how carefully the numbers are
-- kept.
--
-- So the period is a code constant that changes alongside the figures, in the
-- same review. The copy describes it ("the reporting period stated below") and
-- the components render it. Nothing here needs to change to keep them in step.
--
-- The same reasoning keeps the two document cards below in code for now: the
-- annual report's title is derived from the period label, and a document is a
-- row in a table (title, description, file, published date) rather than a
-- paragraph. That table is the next piece of work, not this one.

notify pgrst, 'reload schema';
