-- Imarisha Dada — Phase 5: Volunteer page
--
-- ## What this page was
--
-- A `ProseRoute` page with `draft: true`, rendering a static constant. Meanwhile
-- two tables sat fully wired on the admin side and unreachable from the public
-- site:
--
--   * `volunteer_roles` — read only by `/admin/volunteer-roles`.
--   * `volunteer_applications` — has an inbox, status transitions
--     (`new → reviewing → accepted / declined / withdrawn`) and a dashboard
--     count, and **nothing public ever wrote a row.** The inbox could not fill.
--
-- This migration seeds the page copy and adds the one column the application
-- form needs. It does not invent roles — none are open, and the page says so.

-- ===========================================================================
-- 1. One column the application form needs
-- ===========================================================================
-- The roadmap's form collects "Skills and experience" as free text. The table
-- has `skills text[]` and nothing for prose, so without this the field would
-- either be dropped or crammed into `motivation`.
--
-- `skills` (the existing array) holds the **languages** the applicant offers.
-- That is a slight stretch of the name and is recorded on the column rather than
-- left for someone to infer.

alter table public.volunteer_applications
  add column if not exists skills_detail text;

comment on column public.volunteer_applications.skills is
  'Languages the applicant offers, as locale codes (en, sw, fr, de, pt). Chosen as a multi-select on the public form.';

comment on column public.volunteer_applications.skills_detail is
  'Free-text skills and experience, as typed by the applicant. Optional.';

-- ===========================================================================
-- 2. What the form must never collect
-- ===========================================================================
-- The roadmap is explicit: "Do not collect date of birth, national ID, or a
-- national identification number at application stage. We do not need it, and
-- collecting identity data from unvetted applicants is itself a safeguarding
-- problem."
--
-- So there is no column for them and none is added. Identity is collected during
-- screening, through a controlled process, not through a public form.
-- `tests/unit/volunteer-application.test.ts` asserts the schema has no such
-- field, because a future edit adding one is exactly the kind of change that
-- would look reasonable in a diff.

-- ===========================================================================
-- 3. The page copy
-- ===========================================================================

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, body_secondary,
  cta_label, cta_href, sort_order
) values
  (
    'volunteer-hero', 'volunteer',
    'Volunteer',
    'Volunteer with us',
    -- Leading with screening is deliberate. It filters casual applicants and
    -- reassures parents and funders, which is worth more than the applications
    -- it costs.
    'Every volunteer is screened and trained before working with a girl. That is not a formality — it is the job.',
    null, null, null, 1
  ),
  (
    'volunteer-roles', 'volunteer',
    null,
    'Where help is genuinely useful',
    'We list roles only when we have a real need and someone able to supervise. A vague volunteering offer wastes your time and ours.',
    null, null, null, 2
  ),
  (
    -- Shown when `volunteer_roles` has no active rows, which is the case today.
    -- An empty roles section would read as a broken page rather than as an
    -- organisation that has nothing open.
    'volunteer-roles-empty', 'volunteer',
    null,
    'No roles are open right now',
    'We open a role when we have a real need and someone able to supervise it. That is not the case at the moment. Tell us what you can offer and we will come back to you when something fits — including if you are not in Kenya.',
    null, null, null, 3
  ),
  (
    'volunteer-process', 'volunteer',
    null,
    'What is involved',
    'Six steps, and we do not skip any of them. The screening step is the one that matters most, and it is the one people ask us to drop.',
    null, null, null, 4
  ),
  (
    'volunteer-safeguarding', 'volunteer',
    null,
    'Working with children',
    'Some roles involve direct contact with girls aged 9 to 16. For those roles we require all of the following, and we require them before the first session.',
    null,
    'Read our safeguarding policy', '/legal/safeguarding', 5
  ),
  (
    'volunteer-form', 'volunteer',
    null,
    'Apply to volunteer',
    'We read every application and reply within two weeks — including to tell you if we do not have a suitable role right now.',
    null, null, null, 6
  ),
  (
    'volunteer-remote', 'volunteer',
    null,
    'Not in Kibera?',
    'A lot of what we need can be done from anywhere: translation, design, data work, fundraising and professional advice. Apply and say what you can offer rather than waiting for a role to be advertised.',
    null,
    'Apply and tell us what you can do', '#apply', 7
  )
on conflict (section_key) do update
  set page_key       = excluded.page_key,
      eyebrow        = excluded.eyebrow,
      heading        = excluded.heading,
      body           = excluded.body,
      body_secondary = excluded.body_secondary,
      cta_label      = excluded.cta_label,
      cta_href       = excluded.cta_href,
      sort_order     = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- The six process steps
-- ---------------------------------------------------------------------------

update public.site_sections
   set steps = '[
     {
       "title": "Apply",
       "description": "Tell us who you are, what you can offer, and which role you are interested in."
     },
     {
       "title": "Conversation",
       "description": "We speak within two weeks. This is a two-way conversation — it is as much for you to decide whether we are worth your time."
     },
     {
       "title": "Screening",
       "description": "An identity check and two references. Required for every role that involves contact with children, without exception."
     },
     {
       "title": "Training",
       "description": "Safeguarding training, our programme model, and whatever is specific to the role you will do."
     },
     {
       "title": "Placement",
       "description": "Matched to a programme and a schedule that fits you, with a named staff contact."
     },
     {
       "title": "Support",
       "description": "Supervised throughout. If something is not working, tell us early rather than disappearing — a mentor who stops attending damages a girl''s trust more than never starting."
     }
   ]'::jsonb
 where section_key = 'volunteer-process';

-- ---------------------------------------------------------------------------
-- The five screening requirements
-- ---------------------------------------------------------------------------
-- These are the gate, not a suggestion. The component renders the "no
-- exceptions" line from code rather than from copy, so an editor can reword the
-- list but cannot remove the requirement — the same reasoning as
-- PATHWAY_UNVERIFIED on /programmes and the consent tiers.

update public.site_sections
   set steps = '[
     {
       "title": "An identity check",
       "description": "Confirmed in person or by video call before any placement."
     },
     {
       "title": "Two references",
       "description": "Taken by us, by phone, from people who have worked or volunteered with you."
     },
     {
       "title": "Safeguarding training",
       "description": "Our own training, completed before your first session. It is not optional and it is not a video to skim."
     },
     {
       "title": "A signed code of conduct",
       "description": "Including the two-adult rule and how to raise a concern about another adult."
     },
     {
       "title": "A confidentiality agreement",
       "description": "Participants'' stories belong to them. Nothing said in a session leaves the room."
     }
   ]'::jsonb
 where section_key = 'volunteer-safeguarding';

notify pgrst, 'reload schema';
