-- Imarisha Dada — Phase 5: Partners on the homepage
--
-- The partner list has been on /partner since migration 0027, but a funder or a
-- family landing on the homepage saw nothing about who the organisation works with.
--
-- The list itself is `partners`, which is gated on written permission at the row
-- level (migration 0027). This migration only adds the heading and the one line
-- of copy above it. The section stays hidden until a partner is publishable, so
-- seeding it changes nothing on the page until permission is recorded.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'home-partners', 'home',
  'Partners',
  'Who we work with',
  'Organisations that have agreed in writing to be named here. Each one links to its own website.',
  3
)
on conflict (section_key) do update
  set page_key   = excluded.page_key,
      eyebrow    = excluded.eyebrow,
      heading    = excluded.heading,
      body       = excluded.body,
      sort_order = excluded.sort_order;

notify pgrst, 'reload schema';
