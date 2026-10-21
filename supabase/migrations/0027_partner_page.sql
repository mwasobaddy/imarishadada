-- Imarisha Dada — Phase 5: Partner page
--
-- ## What was wrong
--
-- Two things, one of them a real exposure.
--
--   1. `/partner` was a `ProseRoute` constant. `partner_enquiries` had an admin
--      inbox and no public code ever wrote to it, so the page had no form.
--
--   2. `partners_anon_read` (migration 0009) exposed every row with
--      `active = true` to the anonymous API. Nothing checked `is_test`, and
--      nothing checked the written permission the roadmap requires before a
--      funder's logo can appear. One toggle in the admin would have published
--      an organisation that had never agreed to be named. Nothing rendered it
--      yet, but the database would have served it regardless.
--
-- This migration makes written permission a gate on the row, not a note in
-- the editor, and moves the page copy into `site_sections`.

-- ===========================================================================
-- 1. Written permission is a gate
-- ===========================================================================

alter table public.partners
  add column if not exists permission_confirmed_at timestamptz,
  add column if not exists logo_alt text;

comment on column public.partners.permission_confirmed_at is
  'When written permission to name this organisation, and show its logo, was recorded. Null means it cannot be shown.';

-- A logo is an image, and every image on this site needs alt text.
alter table public.partners drop constraint if exists partners_logo_alt_required;
alter table public.partners add constraint partners_logo_alt_required
  check (logo_path is null or length(btrim(coalesce(logo_alt, ''))) > 0);

-- Active means publicly visible. That requires a test-free row with written
-- permission on file. The database refuses the write; the editor only explains.
alter table public.partners drop constraint if exists partners_live_needs_permission;
alter table public.partners add constraint partners_live_needs_permission
  check (not active or (is_test = false and permission_confirmed_at is not null));

-- The policy states the rule rather than relying on the constraint alone, so
-- a future change to the constraint cannot quietly widen what anon can read.
drop policy if exists partners_anon_read on public.partners;
create policy partners_anon_read on public.partners
  for select to anon
  using (
    active = true
    and is_test = false
    and permission_confirmed_at is not null
  );

-- ===========================================================================
-- 2. Enquiry fields the roadmap asks for
-- ===========================================================================
-- `partnership_type` already exists and means what they are considering
-- (funding, programme, technical, other). `organisation_type` is the separate
-- question the roadmap asks — who they are — and the inbox needs both to triage.

alter table public.partner_enquiries
  add column if not exists organisation_type text,
  add column if not exists contact_role text,
  add column if not exists intended_amount text,
  add column if not exists intended_programme text;

alter table public.partner_enquiries drop constraint if exists partner_enquiries_organisation_type_check;
alter table public.partner_enquiries add constraint partner_enquiries_organisation_type_check
  check (organisation_type is null or organisation_type in ('foundation', 'corporate', 'government', 'ngo', 'individual', 'other'));

-- ===========================================================================
-- 3. The page copy
-- ===========================================================================
-- Structure follows the live page: what we need, what we cannot offer yet, and
-- due diligence. The roadmap's "ways to partner" tabs and "cohort costs" are
-- not seeded. The first would publish offers the organisation has not confirmed
-- (matched giving, cause marketing). The second is omitted until programme staff
-- verify the figures, as the roadmap's own acceptance criteria require.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, body_secondary,
  cta_label, cta_href, steps, sort_order
) values
  (
    'partner-hero', 'partner',
    'Partnership',
    'Partner with us',
    'We are small, accountable and on the ground in Kibera. We say what we are good at, and we say what we are not.',
    null, null, null, null, 1
  ),
  (
    'partner-need', 'partner',
    null,
    'What we actually need',
    'Unrestricted funding is the most useful thing a partner can give us. It lets a participant move between programmes as her needs change, rather than being shaped by whichever grant is easiest to apply for.',
    'We are also open to institutional partners who can help with safeguarding training, legal or registration costs, or professional services we genuinely cannot afford.',
    null, null,
    '[
      {"title": "Multi-year unrestricted funding, which is what makes continuity possible.", "description": ""},
      {"title": "Help with our BRS NGO registration and fiscal sponsorship.", "description": ""},
      {"title": "Safeguarding, data-protection and fundraising training.", "description": ""},
      {"title": "Pro bono legal and financial review.", "description": ""}
    ]'::jsonb,
    2
  ),
  (
    'partner-cannot', 'partner',
    null,
    'What we cannot offer yet',
    'We would rather this page be useful than flattering. The following are real limitations, not modesty.',
    null, null, null,
    '[
      {"title": "We are not yet able to issue receipts that are tax deductible in every jurisdiction.", "description": ""},
      {"title": "We cannot yet report cost-per-participant, because our overhead allocation is not settled.", "description": ""},
      {"title": "We are not yet able to accept unrestricted gifts through every international platform.", "description": ""},
      {"title": "We do not yet have formal partnerships with secondary schools, so we cannot name them.", "description": ""}
    ]'::jsonb,
    3
  ),
  (
    'partner-dd', 'partner',
    null,
    'Due diligence',
    'Institutional funders and diaspora partners will want documentation before they commit. We would rather you ask for it early than discover a gap late.',
    'What we can provide now: our safeguarding policy, our privacy notice, programme figures with the period each one covers, and our methodology for counting. What is still being prepared is marked as such rather than left out.',
    'See what we measure and what we do not yet', '/transparency',
    null, 4
  ),
  (
    -- Shown only when at least one partner is publishable. There is no
    -- placeholder: an empty list of logos on a funder page reads as a claim.
    'partner-partners', 'partner',
    null,
    'Organisations we work with',
    'We name an organisation here only after it has given written permission.',
    null, null, null, null, 5
  ),
  (
    'partner-form', 'partner',
    null,
    'Start a conversation',
    'Tell us what you are considering and we will come back to you within five working days.',
    null, null, null, null, 6
  ),
  (
    'partner-direct', 'partner',
    null,
    'Partnerships',
    'Write to us or message us on WhatsApp. The details below are the same ones on our contact page.',
    null, null, null, null, 7
  )
on conflict (section_key) do update
  set page_key       = excluded.page_key,
      eyebrow        = excluded.eyebrow,
      heading        = excluded.heading,
      body           = excluded.body,
      body_secondary = excluded.body_secondary,
      cta_label      = excluded.cta_label,
      cta_href       = excluded.cta_href,
      steps          = excluded.steps,
      sort_order     = excluded.sort_order;

notify pgrst, 'reload schema';
