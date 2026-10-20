-- Imarisha Dada — Phase 5: carousel images move to the database
--
-- The About page renders `AboutPhotoCarousel` twice, both from the same
-- hardcoded `CARDS` array in `components/about/photo-carousel.tsx`. It was the
-- last hardcoded image set on the site: changing a photograph meant editing
-- code and deploying.
--
-- `site_sections` already has `steps` (an ordered list of {title, description}).
-- This adds `images` — the same idea for photographs: an ordered list of
-- {path, alt}.

alter table public.site_sections
  add column if not exists images jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_sections_images_is_array'
  ) then
    alter table public.site_sections
      add constraint site_sections_images_is_array
      check (images is null or jsonb_typeof(images) = 'array');
  end if;
end $$;

comment on column public.site_sections.images is
  'Ordered photographs for a carousel or gallery: [{ "path": text, "alt": text }]. Renders in array order. Alt text is required per image — a photograph of a participant with no alt is an accessibility defect.';

-- ---------------------------------------------------------------------------
-- Seed the carousel from the component
-- ---------------------------------------------------------------------------
-- Values lifted verbatim, so wiring the component changes nothing visible.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'about-carousel',
  'about',
  null,
  'Programmes and sessions in Kibera',
  'Programmes and sessions in Kibera, photographed by Suma and published with written consent. Auto-advances, and pauses on hover or keyboard focus.',
  20
)
on conflict (section_key) do update
  set page_key   = excluded.page_key,
      heading    = excluded.heading,
      body       = excluded.body,
      sort_order = excluded.sort_order;

update public.site_sections
   set images = '[
     {"path":"/images/about/about-two-women-classroom.avif","alt":"Two young women smiling together in a classroom in Kibera"},
     {"path":"/images/about/about-mentor-and-participant.avif","alt":"A participant and a younger girl seated together during a session"},
     {"path":"/images/about/about-core-values-presentation.avif","alt":"A participant presenting a chart to her group during a session"},
     {"path":"/images/about/about-outdoor-candid.avif","alt":"Participants in branded t-shirts talking outdoors after a session"},
     {"path":"/images/about/about-group-outdoors.avif","alt":"The full group photographed outside the community centre"},
     {"path":"/images/about/about-facilitation.avif","alt":"A participant drawing on a flipchart while the group watches"}
   ]'::jsonb
 where section_key = 'about-carousel';

notify pgrst, 'reload schema';
