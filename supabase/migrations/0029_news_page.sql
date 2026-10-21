-- Imarisha Dada — Phase 4: News
--
-- ## What was wrong
--
--   1. `/news` was a `ProseRoute` constant saying nothing was published yet. The
--      `posts` table had a full schema, RLS and an admin editor since migration
--      0007, and no public code read it.
--
--   2. A post's cover image had no alt text column. Every image on this site
--      needs one, and the admin picker offered a path with nothing to describe it.
--
-- ## What the public API already guarantees
--
-- `posts_anon_read` (migration 0009) only returns `published = true` rows with
-- `published_at <= now()`. Unpublished and future-dated posts never reach the
-- client, so the roadmap's "absent from the HTML" rule holds without a new policy.

-- ===========================================================================
-- 1. Alt text for a cover image is a gate
-- ===========================================================================

alter table public.posts
  add column if not exists cover_alt text;

comment on column public.posts.cover_alt is
  'Description of the cover image for screen readers. Required whenever cover_path is set.';

alter table public.posts drop constraint if exists posts_cover_alt_required;
alter table public.posts add constraint posts_cover_alt_required
  check (cover_path is null or length(btrim(coalesce(cover_alt, ''))) > 0);

-- ===========================================================================
-- 2. The page copy
-- ===========================================================================
-- The filter labels and the "All" link are interface chrome and stay in code.
-- The empty state has a real next step, so it is copy.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, cta_label, cta_href, sort_order
) values
  (
    'news-hero', 'news',
    'News',
    'News',
    'What we have been doing, and what we have learned.',
    null, null, 1
  ),
  (
    -- Shown when there are no published posts at all. The roadmap says never render
    -- an empty grid, and an empty grid on a new site reads as abandoned.
    'news-empty', 'news',
    null,
    'Nothing here yet',
    'We publish when we have something worth telling you. Until then, you can reach us through the contact page.',
    'Contact us', '/contact', 2
  )
on conflict (section_key) do update
  set page_key   = excluded.page_key,
      eyebrow    = excluded.eyebrow,
      heading    = excluded.heading,
      body       = excluded.body,
      cta_label  = excluded.cta_label,
      cta_href   = excluded.cta_href,
      sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
