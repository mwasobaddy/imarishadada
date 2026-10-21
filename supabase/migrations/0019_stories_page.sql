-- Imarisha Dada — Phase 5: Stories page copy
--
-- Stage 6 of doc/page-editor.md, one page at a time.
--
-- `site_pages` has carried a `stories` row since 0013, so `/admin/pages/stories`
-- already resolves — it simply had nothing to show. This seeds the copy for
-- both the archive and the story detail, because they are one editorial surface:
-- an editor who changes "How we share these stories" on the index expects the
-- consent banner on a story to be next to it, not in a different page.
--
-- Story *records* live in `/admin/content/stories` (the `stories` table). This
-- file is only the copy around them.

-- ===========================================================================
-- 1. A story photograph needs alt text
-- ===========================================================================
-- `stories.image_path` has existed since 0001 with no `image_alt` beside it, so
-- a story's hero photograph — the largest image on the page, of a named
-- participant — had nowhere to describe itself.
--
-- Same rule as `programmes_alt_required_with_image` (migration 0016), enforced
-- the same way and for the same reason: an image without alt text is an
-- accessibility defect, not a warning, and a form can be bypassed where a
-- constraint cannot.

alter table public.stories
  add column if not exists image_alt text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stories_alt_required_with_image'
  ) then
    alter table public.stories
      add constraint stories_alt_required_with_image
      check (
        image_path is null
        or (image_alt is not null and length(btrim(image_alt)) > 0)
      );
  end if;
end $$;

comment on column public.stories.image_alt is
  'Alt text for the story photograph. Required whenever image_path is set. Describe what the photograph shows, for someone who cannot see it — not the filename.';

-- ===========================================================================
-- 2. The archive
-- ===========================================================================

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body,
  cta_label, cta_href, sort_order
) values
  (
    'stories-hero', 'stories',
    'Stories',
    'Their words, on their terms.',
    'We publish a story only when consent is recorded, and the tier decides what appears — never our judgement on the day. Some stories carry a name and a face. Some carry neither. All of them are real.',
    null, null, 1
  ),
  (
    'stories-featured', 'stories',
    null,
    'Featured story',
    null,
    null, null, 2
  ),
  (
    'stories-grid', 'stories',
    null,
    'All stories',
    'Newest first. Every card shows exactly what that participant agreed to share.',
    null, null, 3
  ),
  (
    'stories-empty', 'stories',
    null,
    'No stories published here yet',
    'We publish a story only when the participant has given recorded consent and we are certain the consent covers it. This space fills as stories are cleared, and not before.',
    'See the programmes instead', '/programmes', 4
  ),
  (
    'stories-consent', 'stories',
    null,
    'How we share these stories',
    'No story is published without a recorded consent tier, and the tier decides what appears. A name withheld is withheld — we will not reveal it to a funder or a journalist. For participants under 18 we require written consent from both the participant and her guardian.',
    'Read the photography and consent policy', '/legal/safeguarding#photography', 5
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
-- 3. The story detail
-- ===========================================================================
-- Two of these are templates. `{name}` and `{period}` are filled at render time
-- by `fillTemplate()` in lib/stories/copy.ts, because they are the only parts
-- that vary per story and they must never be typed by hand per story — the
-- reporting period has to agree with `impact_stats.period` on every row.
--
-- Unknown tokens are left visible rather than blanked, so a typo like `{nmae}`
-- is caught in review instead of shipping as an empty sentence.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body,
  cta_label, cta_href, sort_order
) values
  (
    'story-consent-banner', 'stories',
    null,
    -- Rendered `sr-only`. A banner needs an accessible name to be a landmark;
    -- it does not need a visible one.
    'Consent',
    '{name} has given us written permission to share her name and photograph. She has read this story and approved these words.',
    null, null, 10
  ),
  (
    'story-anonymised', 'stories',
    null,
    'Why there is no name here',
    'This story is published with the participant''s consent to share her words, but not her name and not her photograph. We will not reveal either to anyone — funder, journalist, or partner.',
    'Read the photography and consent policy', '/legal/safeguarding#photography', 11
  ),
  (
    'story-cohort', 'stories',
    null,
    'This is one of',
    'young mothers who returned to education with our support in {period}.',
    null, null, 12
  ),
  (
    'story-more', 'stories',
    null,
    'More stories',
    null,
    null, null, 13
  ),
  (
    'story-share', 'stories',
    null,
    'Share this story',
    'Copy the link, or send it directly. No third-party share buttons — they would tell someone else that you read this.',
    null, null, 14
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
-- 4. What is NOT here, on purpose
-- ===========================================================================
-- The consent tier is not a section and never becomes one. It is a safeguarding
-- control, not copy: an editor can reword the explanation of a tier, but cannot
-- reword the tier into existence. Same reasoning as PATHWAY_UNVERIFIED on
-- /programmes and the consent gates elsewhere.
--
-- The empty state's *existence* is also not editorial. The copy is, and it is
-- seeded above; the decision to render it rather than an empty grid is code.

notify pgrst, 'reload schema';
