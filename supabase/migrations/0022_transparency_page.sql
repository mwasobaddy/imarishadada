-- Imarisha Dada — Phase 5: Transparency page
--
-- This is the first page that leaves `ProseRoute`. The four remaining prose
-- pages (partner, volunteer, annual-report, news) still render from static
-- constants in `lib/data/pages.ts`, whose own comment says "Anything needing a
-- database row or an admin override does not belong there". Transparency needed
-- both, so it becomes a real page and establishes the pattern.
--
-- ## The page's whole argument
--
-- The roadmap: "For an organisation that has not yet been independently
-- examined, this page is mostly about publishing the gaps honestly — which
-- reads as more credible than a polished page implying controls that do not
-- exist."
--
-- So this migration does not invent figures, names or dates. It seeds the two
-- gap lists, which are true today, and the copy around them. The financial
-- section has no data and says so.

-- ===========================================================================
-- 1. `transparency_gaps` holds two different kinds of gap
-- ===========================================================================
-- The table was written for one thing: things we cannot yet *measure*. The
-- roadmap's most important section is a second, different list — things we have
-- not yet *done* (independent examination, board minutes, a named safeguarding
-- officer). Both are gaps, both are published, and they are not the same claim.

alter table public.transparency_gaps
  add column if not exists kind text not null default 'measurement',
  -- An editorial label, because the honest targets are "FY2026/27" and "2026",
  -- which a `date` column cannot hold. `target_date` is left in place for items
  -- that do have a real date.
  add column if not exists target_label text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transparency_gaps_kind_check'
  ) then
    alter table public.transparency_gaps
      add constraint transparency_gaps_kind_check
      check (kind in ('measurement', 'governance'));
  end if;
end $$;

comment on column public.transparency_gaps.kind is
  'measurement = something about our work we cannot yet quantify. governance = something we have not yet put in place. Both are published; they are different claims and must not be merged.';

-- ---------------------------------------------------------------------------
-- The status model, renamed
-- ---------------------------------------------------------------------------
-- The old values were measurement-only: 'not_yet_measured' describes a missing
-- number, not a missing independent examination. `kind` now carries that
-- distinction, so `status` can describe progress alone.
--
-- Dropped before the update and re-added after, because the old check would
-- reject the new value.

alter table public.transparency_gaps
  drop constraint if exists transparency_gaps_status_check;

update public.transparency_gaps
   set status = 'outstanding'
 where status = 'not_yet_measured';

alter table public.transparency_gaps
  alter column status set default 'outstanding';

alter table public.transparency_gaps
  add constraint transparency_gaps_status_check
  check (status in ('outstanding', 'in_progress', 'done', 'published'));

comment on column public.transparency_gaps.status is
  'Progress toward closing the gap. A closed gap is marked done or published rather than deleted — the list is meant to shrink visibly, and a deleted row shrinks it invisibly.';

-- ===========================================================================
-- 1b. `financial_breakdown` cannot say whether a line is income or spending
-- ===========================================================================
-- The roadmap wants two tables — income by source, expenditure by category —
-- and the schema has one flat `category` column with no direction. Without this,
-- the page would have to infer it from category names, which is exactly the kind
-- of convention that breaks silently the first time someone types "Grants"
-- instead of "Institutional grants".

alter table public.financial_breakdown
  add column if not exists direction text not null default 'expenditure';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'financial_breakdown_direction_check'
  ) then
    alter table public.financial_breakdown
      add constraint financial_breakdown_direction_check
      check (direction in ('income', 'expenditure'));
  end if;
end $$;

comment on column public.financial_breakdown.direction is
  'income or expenditure. The transparency page renders two tables and must not guess which one a row belongs to from its category name.';

-- ---------------------------------------------------------------------------
-- A gap is identified by what it says, not by when it was inserted
-- ---------------------------------------------------------------------------
-- Added *before* the insert below, because `on conflict do nothing` only
-- prevents conflicts that would violate an **existing** unique index. With no
-- unique key on the table, nothing conflicts, so every insert succeeds and
-- re-applying the seed duplicates every row.
--
-- That is what happened here: the governance list was seeded twice and rendered
-- twice on the page. The clause was not wrong; the table was missing the key
-- that makes it mean anything.
--
-- With a real unique key, `on conflict (kind, item) do nothing` says what it
-- looks like it says, and a re-applied migration is safe.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transparency_gaps_kind_item_key'
  ) then
    alter table public.transparency_gaps
      add constraint transparency_gaps_kind_item_key unique (kind, item);
  end if;
end $$;

-- ===========================================================================
-- 2. The governance gaps
-- ===========================================================================
-- Every one of these is true today and is already stated somewhere else on the
-- site: the footer says the registration number is not yet issued, the
-- safeguarding policy says no officer has been recorded, and the About page says
-- board members are published only once each has consented to be named.
--
-- `target_label` is deliberately NULL on all of them. The roadmap's example
-- table proposes targets ("FY2026/27", "2026"), but a target is a commitment the
-- organisation makes, not one a migration can make on its behalf. The column is
-- there; the org fills it in.
--
-- `sort_order` starts at 10 so governance items and measurement items can be
-- reordered within their own list without colliding.

insert into public.transparency_gaps (item, kind, status, sort_order, notes) values
  (
    'A named safeguarding officer',
    'governance', 'outstanding', 10,
    'We work with girls from age 9 and with young women. The role is written into our policy and is not yet filled by a named person. Until it is, safeguarding concerns go to the person who picks up the phone, which is not good enough and we know it.'
  ),
  (
    'An independent examination of our accounts',
    'governance', 'outstanding', 11,
    'We have not produced a set of accounts to examine. This is the first thing an institutional funder checks, and it does not exist yet.'
  ),
  (
    'Fully audited financial statements',
    'governance', 'outstanding', 12,
    'An audit follows an examination, not the other way round. Our first financial statement is in preparation and covers 1 April 2025 to 31 March 2026.'
  ),
  (
    'Public board minutes',
    'governance', 'outstanding', 13,
    'We do not yet publish board minutes or the frequency of our board meetings. Our board members are named on the About page only once each has given recorded consent to be named, and none has yet.'
  ),
  (
    'An external safeguarding audit',
    'governance', 'outstanding', 14,
    'Our safeguarding policy is written and published. It has not been reviewed by anyone outside the organisation, so we cannot tell you it meets a standard we have not been measured against.'
  ),
  (
    'A dedicated, monitored complaints address',
    'governance', 'outstanding', 15,
    'Complaints reach us today through the contact form and the phone number on the contact page, both of which are monitored. A separate address with its own response commitments does not exist yet.'
  ),
  (
    'Our NGO registration number',
    'governance', 'outstanding', 16,
    'The registration is in progress with the NGOs Co-ordination Board. We publish the number when it is issued rather than a placeholder now.'
  )
on conflict (kind, item) do nothing;

-- ===========================================================================
-- 3. The page copy
-- ===========================================================================

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, body_secondary,
  cta_label, cta_href, sort_order
) values
  (
    'transparency-hero', 'transparency',
    'Transparency',
    'Here is how we are run, and what we have not yet done.',
    'We are a young organisation. Some of what a funder expects to find on this page does not exist yet, and we would rather tell you than let you find it in a due-diligence questionnaire.',
    null, null, null, 1
  ),
  (
    'transparency-gaps', 'transparency',
    null,
    'What we have not yet done',
    'These are institutional, not operational: the controls, documents and appointments a mature organisation has and we do not. The list is meant to shrink, and we mark items as they land rather than removing them.',
    null, null, null, 2
  ),
  (
    'transparency-measure', 'transparency',
    null,
    'What we cannot yet measure',
    'A different kind of gap. These are things about our own work that we do not yet know — not because we have not looked, but because we have not been running long enough to answer them honestly.',
    null, null, null, 3
  ),
  (
    'transparency-money', 'transparency',
    null,
    'Where the money goes',
    'We publish figures tied to a reporting period, and every figure states how it was counted. Unrestricted gifts go where the need is greatest that term; restricted gifts fund the outcome you selected and are reported against that specific figure.',
    null, null, null, 4
  ),
  (
    -- The status of our financial reporting, not the figures themselves. Today
    -- it says there are none; when the statement is signed off the editor
    -- replaces it with the basis-of-preparation note the roadmap requires.
    'transparency-money-status', 'transparency',
    null,
    'Where this stands',
    'Our first financial statement is in preparation. It covers 1 April 2025 to 31 March 2026 and will be published in full once it is complete and signed off. We would rather publish nothing than publish a number we cannot yet stand behind.',
    null, null, null, 5
  ),
  (
    'transparency-governance', 'transparency',
    null,
    'Governance',
    'Our board members and their roles are published on the About page once each person has given recorded consent to be named. We do not publish names we have not verified, and we do not yet publish how often the board meets.',
    null,
    'See who we are', '/about', 6
  ),
  (
    'transparency-safeguarding', 'transparency',
    null,
    'Safeguarding',
    'We work with children aged 9 and over and with young women at risk of gender-based violence. We operate a written safeguarding policy, and we require separate written consent for any photograph of a participant. A named safeguarding officer has not yet been appointed, and our policy has not been externally audited.',
    'That is the honest position. The full policy, including how to raise a concern, is published.',
    'Read the safeguarding policy', '/legal/safeguarding', 7
  ),
  (
    -- `#complaints` is load-bearing: the footer's "Raise a concern" link points
    -- at /transparency#complaints. Removing this section breaks a live link.
    'transparency-complaints', 'transparency',
    null,
    'Raise a concern',
    'If you have a concern about our work, our finances, or the way we have treated someone, we want to hear it. Raise it through the contact page and say that you want it treated as a complaint — it will be handled by someone who was not involved in the original decision, wherever that is possible.',
    'We acknowledge every complaint and respond through the same channels we use for enquiries. A dedicated complaints address, with its own published response commitments, is on the list above because it does not exist yet.',
    'Contact us', '/contact', 8
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

notify pgrst, 'reload schema';
