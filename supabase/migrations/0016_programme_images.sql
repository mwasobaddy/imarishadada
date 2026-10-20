-- Imarisha Dada — Phase 5: programme photography moves to the database
--
-- `programmes.image_path` and `image_alt` have existed since migration 0001,
-- but every row has been null. The photographs rendered anyway, from a
-- hardcoded `PROGRAMME_IMAGE_FALLBACK` map in `lib/data/programme-images.ts`.
--
-- That map was a pre-migration stopgap. Its own comment said so: "the database
-- is not provisioned yet". It is now, so the map is no longer a stopgap — it is
-- a hidden override with a confusing consequence:
--
--   Clearing the image in the admin did not clear the image. It revealed a
--   *different* one, from code, that the editor could neither see nor change.
--
-- This migration copies the fallback values into the rows and the map is then
-- deleted from the codebase. From here the database is the only source, and an
-- empty `image_path` means the card renders its brand-tinted field.

-- ---------------------------------------------------------------------------
-- Seed the three programmes
-- ---------------------------------------------------------------------------

update public.programmes
   set image_path = '/images/programmes/re-entry/re-entry-mother-writing.avif',
       image_alt  = 'A young mother holding her baby writes with a pen during a school re-entry session'
 where slug = 'school-reentry'
   and image_path is null;

-- A proxy, and the alt says so.
--
-- The gallery contains no photograph of a business, a market stall, or
-- start-up capital being put to work. This frame shows two participants in
-- conversation outdoors — the closest honest representation of a programme
-- about young women building their own income, and better than reusing a
-- classroom photograph to illustrate money.
--
-- It is still a proxy. The alt describes what is actually in the picture rather
-- than claiming to show a business, and the programme still needs its own shoot.
update public.programmes
   set image_path = '/images/programmes/economic-empowerment/economic-empowerment-conversation.avif',
       image_alt  = 'Two participants talking together outdoors, one explaining something to the other'
 where slug = 'economic-empowerment'
   and image_path is null;

update public.programmes
   set image_path = '/images/programmes/dada-space/dada-space-hand-raised.avif',
       image_alt  = 'A girl raises her hand during a Dada Space session'
 where slug = 'dada-space'
   and image_path is null;

-- ---------------------------------------------------------------------------
-- Now that a path can be set, alt text has to be required with it
-- ---------------------------------------------------------------------------
-- A photograph of a participant with no alt text is an accessibility defect,
-- not a warning. The same rule is already enforced in `updateSection` for
-- sections and at upload for `media`; programmes were the one place it was
-- merely conventional.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'programmes_alt_required_with_image'
  ) then
    alter table public.programmes
      add constraint programmes_alt_required_with_image
      check (
        image_path is null
        or (image_alt is not null and length(btrim(image_alt)) > 0)
      );
  end if;
end $$;

comment on constraint programmes_alt_required_with_image on public.programmes is
  'An image without alt text is an accessibility defect. Enforced here as well as in the admin action, because a form can be bypassed and a constraint cannot.';

notify pgrst, 'reload schema';
