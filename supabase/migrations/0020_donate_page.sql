-- Imarisha Dada — Phase 5: Donate page copy
--
-- Stage 6 of doc/page-editor.md, one page at a time.
--
-- ## What this migration does NOT touch
--
-- `/donate` has three sources of truth and only one of them is copy:
--
--   * **Amounts** live in `giving_tiers`, edited at `/admin/giving-tiers`.
--   * **Payment rails, bank details and tax wording** live in `settings`,
--     edited at `/admin/settings`, and are gated behind dual confirmation
--     because they are financial.
--   * **Copy** lives in `site_sections`, edited at `/admin/pages/donate`.
--
-- This migration only adds the third. The donate spec's hard rule is that no
-- amount, paybill or bank detail is ever hardcoded in a component, and nothing
-- here changes that — it adds prose, not figures.

-- ===========================================================================
-- 1. What `donations.fee` means
-- ===========================================================================
-- The fee is now a donor choice rather than a silent addition, so the column
-- needs a definition that survives the change.
--
-- `fee` is **the processing fee added to the donor's charge**, not the fee the
-- organisation incurred. When a donor declines to cover it, `fee` is 0 and
-- `total` equals `display_amount`.
--
-- The invariant `total = display_amount + fee` holds in both cases, which is
-- what makes the column safe to sum. The organisation's own cost when a donor
-- declines is a settlement fact, not a donor fact, and belongs in
-- reconciliation rather than in the donor's row.

comment on column public.donations.fee is
  'The processing fee ADDED TO THE DONOR''S CHARGE. Zero when the donor declined to cover it, in which case total = display_amount. Not the fee the organisation incurred.';

comment on column public.donations.total is
  'What actually left the donor''s account. Always display_amount + fee.';

-- ===========================================================================
-- 2. The donate page copy
-- ===========================================================================
-- The heading moves out of `messages/en.json` (`donate.title`) and into
-- `site_sections`, like every other migrated page. The *form* strings stay in
-- the message catalogue, because they are rendered inside the client flow and
-- are part of it; the page copy around the flow is editorial.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body,
  cta_label, cta_href, sort_order
) values
  (
    'donate-hero', 'donate',
    'Give',
    'Give a girl in Kibera her future.',
    'Every amount below is tied to a specific outcome. Give monthly and a mentor''s continuity matters as much as a single emergency.',
    null, null, 1
  ),
  (
    'donate-impact', 'donate',
    -- Rendered `sr-only`. The band is an aside and needs an accessible name;
    -- it does not need a visible one competing with the h1 above it.
    null,
    'Why it matters',
    'Every one of them was someone nobody was watching.',
    'Read why one of them returned', '/stories', 2
  )
on conflict (section_key) do update
  set page_key   = excluded.page_key,
      eyebrow    = excluded.eyebrow,
      heading    = excluded.heading,
      body       = excluded.body,
      cta_label  = excluded.cta_label,
      cta_href   = excluded.cta_href,
      sort_order = excluded.sort_order;

-- ===========================================================================
-- 3. Where the figure in the band comes from
-- ===========================================================================
-- Not from this file, and not from copy. The band renders the **first active
-- row in `impact_stats` by `sort_order`**, so:
--
--   * the number is a real, dated figure the organisation already publishes on
--     /impact, with its own period;
--   * an editor chooses which figure leads by reordering at `/admin/impact` —
--     no deploy, and no way to type a number that is not in the ledger of
--     published stats.
--
-- The copy above is only the sentence *around* the figure. That split is the
-- same one the Impact page uses for the reporting period: the fact is rendered,
-- the prose refers to it, and the two cannot drift.

notify pgrst, 'reload schema';
