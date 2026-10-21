-- Imarisha Dada — a picture on a section needs a description
--
-- ## What was wrong
--
-- `site_sections` gained `image_path` and `image_alt` in migration 0013, and
-- the admin action has refused a section with an image and no alt text since
-- the page editor was built. Nothing enforced it in the database, though, so
-- the rule was one layer of defence.
--
-- ## Why it matters more now
--
-- The homepage hero's portrait is editable from the page editor. A section
-- with a picture and no description is a defect for a screen reader, and the
-- hero is the first thing a visitor meets.
--
-- The constraint matches the one on `posts` (migration 0029): an image path
-- means a description is not optional.

alter table public.site_sections
  drop constraint if exists site_sections_image_alt_required;

alter table public.site_sections
  add constraint site_sections_image_alt_required
  check (image_path is null or length(btrim(coalesce(image_alt, ''))) > 0);

comment on constraint site_sections_image_alt_required on public.site_sections is
  'A section with a picture must describe it. The alt text is not optional.';
